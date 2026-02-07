import { Process } from './Process';
import type { Action, ProcessStats, Vector2 } from './types';
import { Marketplace } from './Marketplace';
import { getLastThought } from './AgentAI';

export class Kernel {
    public width: number;
    public height: number;
    public processes: Map<string, Process>;
    public grid: (string | null)[][];
    public tickCount: number;
    public marketplace: Marketplace; // THE ECONOMY
    public events: string[] = [];
    public logImportantOnly: boolean = true;

    // Session analytics
    public session = {
        totalBirths: 0,
        totalDeaths: 0,
        totalAttacks: 0,
        totalTrades: 0,
        peakPopulation: 0,
        peakPopulationTick: 0,
        peakGDP: 0,
        highestGeneration: 1,
        totalLifespanTicks: 0,
        extinctionTick: null as number | null,
        populationTimeline: [] as { tick: number; pop: number; avgStability: number }[],
    };

    constructor(width: number = 30, height: number = 30) {
        this.width = width;
        this.height = height;
        this.processes = new Map();
        this.grid = Array(height).fill(null).map(() => Array(width).fill(null));
        this.tickCount = 0;
        this.marketplace = new Marketplace();
    }

    public log(msg: string, opts?: { important?: boolean }) {
        if (this.logImportantOnly) {
            const isImportant = opts?.important ?? this.isImportantLog(msg);
            if (!isImportant) return;
        }
        this.events.unshift(`[${this.tickCount}] ${msg}`);
        if (this.events.length > 50) this.events.pop();
    }

    private isImportantLog(msg: string): boolean {
        return msg.startsWith('BIRTH:')
            || msg.startsWith('SIGKILL:')
            || msg.startsWith('ATTACK:')
            || msg.startsWith('FORK:');
    }

    public spawnProcess(pos: Vector2, parentStats?: ProcessStats, birthCrowding?: number): Process | null {
        if (this.isOutOfBounds(pos) || this.grid[pos.y][pos.x] !== null) {
            return null;
        }

        const id = `PROC_${this.tickCount}_${Math.floor(Math.random() * 1000)}`;
        const process = new Process(id, pos, parentStats, birthCrowding);

        this.processes.set(id, process);
        this.grid[pos.y][pos.x] = id;

        if (parentStats) {
            this.session.totalBirths++;
            if (parentStats.generation + 1 > this.session.highestGeneration) {
                this.session.highestGeneration = parentStats.generation + 1;
            }
            this.log(`FORK: ${parentStats.id} -> ${id}`);
        }
        // else this.log(`INJECT: ${id} initialized`);

        return process;
    }

    public killProcess(id: string) {
        const proc = this.processes.get(id);
        if (proc) {
            this.grid[proc.position.y][proc.position.x] = null;
            this.processes.delete(id);
            this.session.totalDeaths++;
            this.session.totalLifespanTicks += proc.stats.cycle;
            this.log(`SIGKILL: ${id}`);
        }
    }

    public moveProcess(id: string, target: Vector2): boolean {
        const proc = this.processes.get(id);
        if (!proc) return false;

        if (this.isOutOfBounds(target) || this.grid[target.y][target.x] !== null) {
            return false; // Collision or blocked
        }

        // Move
        this.grid[proc.position.y][proc.position.x] = null;
        proc.position = target;
        this.grid[target.y][target.x] = id;
        return true;
    }

    public tick() {
        this.tickCount++;
        this.marketplace.cleanExpiredOrders(this.tickCount);

        // 0. Random Drift — agents wander naturally
        this.processes.forEach((proc, id) => {
            // "Beautiful Ones" actively flee from neighbors every tick
            if (proc.isWithdrawn) {
                const neighbors = this.getNeighbors(proc.position);
                if (neighbors.length > 0) {
                    // Move away from the average neighbor position
                    const avgX = neighbors.reduce((s, n) => s + n.position.x, 0) / neighbors.length;
                    const avgY = neighbors.reduce((s, n) => s + n.position.y, 0) / neighbors.length;
                    const fleeX = proc.position.x + Math.sign(proc.position.x - avgX);
                    const fleeY = proc.position.y + Math.sign(proc.position.y - avgY);
                    // Try fleeing in both axes, fall back to one
                    if (!this.moveProcess(id, { x: fleeX, y: fleeY })) {
                        if (!this.moveProcess(id, { x: fleeX, y: proc.position.y })) {
                            this.moveProcess(id, { x: proc.position.x, y: fleeY });
                        }
                    }
                }
            } else if (Math.random() < 0.15) { // 15% chance to drift each tick
                const dirs = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];
                const d = dirs[Math.floor(Math.random() * dirs.length)];
                this.moveProcess(id, { x: proc.position.x + d.x, y: proc.position.y + d.y });
            }
        });

        // 1. Process Decisions
        const actions: { id: string, action: Action }[] = [];

        this.processes.forEach((proc, id) => {
            if (proc.stats.cpu <= 0) {
                this.killProcess(id);
                return;
            }

            const neighbors = this.getNeighbors(proc.position);
            const emptySpots = 8 - neighbors.length;

            // Pass Marketplace state (snapshot) to Agent
            const marketSnapshot = {
                lowestAsk: this.marketplace.orders.find(o => o.type === 'ASK')?.price || 999,
                highestBid: this.marketplace.orders.find(o => o.type === 'BID')?.price || 0
            };

            // AI thinking is now handled globally with rate limiting
            // The agentThink function will skip if called too soon
            if (this.tickCount % 150 === 0) { // Every 15 seconds at 10 ticks/sec
                proc.thinkWithAI(neighbors, emptySpots, marketSnapshot).then(() => {
                    const thought = getLastThought(id);
                    if (thought) {
                        this.log(`🤖 ${id}: "${thought.reasoning}" → ${thought.action}`);
                    }
                });
            }

            const action = proc.decideAction(neighbors, emptySpots, marketSnapshot);
            actions.push({ id, action });

            // Calculate social context for Universe-25 dynamics
            const neighborCount = neighbors.length;
            const avgNeighborStability = neighbors.length > 0
                ? neighbors.reduce((sum, n) => sum + n.stats.stability, 0) / neighbors.length
                : 100;

            proc.tick(neighborCount, avgNeighborStability);
        });

        // 2. Resolve Actions
        actions.forEach(({ id, action }) => {
            const proc = this.processes.get(id);
            if (!proc) return;

            switch (action.type) {
                case 'ALLOCATE_RAM':
                    const moves = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];
                    const dir = moves[Math.floor(Math.random() * moves.length)];
                    this.moveProcess(id, { x: proc.position.x + dir.x, y: proc.position.y + dir.y });
                    break;

                case 'REQUEST_CYCLES':
                    // Can only scavenge/beg if there are other agents nearby
                    const scavengeNeighbors = this.getNeighbors(proc.position);
                    if (scavengeNeighbors.length > 0) {
                        proc.stats.cpu += 10;
                        proc.stats.stability -= 5; // Begging is humiliating
                    }
                    // No log spam - just silently fail if alone
                    break;

                case 'FORK':
                    const spawnDir = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }].find(d => {
                        const p = { x: proc.position.x + d.x, y: proc.position.y + d.y };
                        return !this.isOutOfBounds(p) && this.grid[p.y][p.x] === null;
                    });
                    if (spawnDir && proc.stats.money >= 20) {
                        const spawnPos = { x: proc.position.x + spawnDir.x, y: proc.position.y + spawnDir.y };
                        const birthCrowding = this.getNeighbors(proc.position).length;
                        this.spawnProcess(spawnPos, proc.stats, birthCrowding);
                        proc.stats.cpu -= 20; // Energy cost
                        proc.stats.money = proc.stats.money / 2 - 20; // Give half to child, pay birth fee
                        this.log(`BIRTH: ${id} → Gen ${proc.stats.generation + 1}`);
                    }
                    break;

                case 'TERMINATE_PROCESS':
                    if (action.targetId) {
                        const target = this.processes.get(action.targetId);
                        if (target) {
                            target.stats.stability -= 20;
                            target.stats.cpu -= 10;
                            proc.stats.cpu -= 5;
                            this.session.totalAttacks++;
                            this.log(`ATTACK: ${id} -> ${target.stats.id}`);
                        }
                    }
                    break;

                case 'MINT_TOKEN':
                    if (proc.stats.cpu >= 4) {
                        proc.stats.cpu -= 4;
                        proc.stats.money += 5;
                    }
                    break;

                case 'TRADE_TOKEN':
                    if (action.payload?.action === 'BUY_ENERGY') {
                        // Can only buy if there are other agents to trade with
                        const tradeNeighbors = this.getNeighbors(proc.position);
                        if (tradeNeighbors.length > 0 && proc.stats.money >= 15) {
                            proc.stats.money -= 15;
                            proc.stats.cpu += 25;
                            this.log(`TRADE: ${id} bought energy`);
                        }
                        // No spam log for failed trades
                    }
                    break;

                case 'PLACE_ASK':
                    if (proc.stats.money >= 1) {
                        this.marketplace.placeOrder({
                            id: `ORD_${this.tickCount}_${id}`, agentId: id, type: 'ASK',
                            packetType: action.payload.packetType, price: action.payload.price, timestamp: this.tickCount
                        });
                    }
                    break;

                case 'PLACE_BID':
                    this.marketplace.placeOrder({
                        id: `ORD_${this.tickCount}_${id}`, agentId: id, type: 'BID',
                        packetType: action.payload.packetType, price: action.payload.price, timestamp: this.tickCount
                    });
                    break;
            }
        });

        // 3. MATCH ORDERS
        const matches = this.marketplace.matchOrders();
        matches.forEach(match => {
            const buyer = this.processes.get(match.buyerId);
            const seller = this.processes.get(match.sellerId);

            if (buyer && seller) {
                // Transfer Funds
                if (buyer.stats.money >= match.price) {
                    buyer.stats.money -= match.price;
                    seller.stats.money += match.price;

                    // Exchange Goods (Simulated benefit)
                    buyer.stats.priority += 1; // "Knowledge is Power"
                    buyer.stats.stability += 5; // Satisfaction
                    this.session.totalTrades++;

                    this.log(`TRADE: ${seller.stats.id} sold DATA to ${buyer.stats.id} for ${match.price}CR`);
                }
            }
        });

        // 4. SESSION ANALYTICS
        const pop = this.processes.size;
        if (pop > this.session.peakPopulation) {
            this.session.peakPopulation = pop;
            this.session.peakPopulationTick = this.tickCount;
        }
        let sessionGdp = 0;
        let sessionTotalStab = 0;
        this.processes.forEach(p => { sessionGdp += p.stats.money; sessionTotalStab += p.stats.stability; });
        if (sessionGdp > this.session.peakGDP) this.session.peakGDP = sessionGdp;
        const sessionAvgStab = pop > 0 ? sessionTotalStab / pop : 0;

        if (this.tickCount % 10 === 0) {
            this.session.populationTimeline.push({ tick: this.tickCount, pop, avgStability: sessionAvgStab });
        }

        if (pop === 0 && this.session.extinctionTick === null && this.session.totalBirths > 0) {
            this.session.extinctionTick = this.tickCount;
        }
    }

    private isOutOfBounds(pos: Vector2): boolean {
        return pos.x < 0 || pos.x >= this.width || pos.y < 0 || pos.y >= this.height;
    }

    private getNeighbors(pos: Vector2): Process[] {
        const neighbors: Process[] = [];
        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                if (x === 0 && y === 0) continue;
                const checkPos = { x: pos.x + x, y: pos.y + y };
                if (!this.isOutOfBounds(checkPos)) {
                    const id = this.grid[checkPos.y][checkPos.x];
                    if (id) {
                        const p = this.processes.get(id);
                        if (p) neighbors.push(p);
                    }
                }
            }
        }
        return neighbors;
    }
}
