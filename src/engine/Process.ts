import { ProcessState } from './types';
import type { Action, ProcessStats, Vector2, ActionType, SocialRank } from './types';
import { agentThink, isAIReady, setLastThought, getLastThought } from './AgentAI';

export class Process {
    public position: Vector2;
    public state: ProcessState;
    public stats: ProcessStats;

    // "Genome" / Traits
    private readonly aggressiveness: number; // 0-1
    private readonly efficiency: number; // 0-1 (Metabolism)

    // Universe-25 Behavioral State
    public homePosition: Vector2; // Territorial memory — where they were born
    public fertilityThreshold: number; // Rises permanently under chronic stress
    public isWithdrawn: boolean; // "Beautiful One" — actively avoids society

    // === POLITICS ===
    public socialRank: SocialRank = 'OMEGA';  // Starts at bottom, can rise
    public territoryId: string | null = null; // Which Alpha's territory are we in?

    public lastAction: ActionType | null = null;
    public lastThought: string | null = null; // AI reasoning
    public lastThoughtAt: number | null = null;

    constructor(id: string, pos: Vector2, parentStats?: ProcessStats, birthCrowding?: number) {
        this.position = pos;
        this.homePosition = { ...pos }; // Remember birthplace
        this.state = ProcessState.IDLE;
        this.isWithdrawn = false;
        this.fertilityThreshold = 70; // Base fertility threshold

        // Generational decay: children born in crowded conditions start weaker
        const crowdingPenalty = birthCrowding ? Math.min(birthCrowding * 5, 30) : 0; // Up to -30 stability
        const generationDecay = parentStats ? Math.min((parentStats.generation - 1) * 2, 20) : 0; // Later gens weaker

        // Inherit or Randomize stats
        this.stats = {
            id,
            cycle: 0,
            ram: 1,
            cpu: 80,
            priority: 1,
            stability: Math.max(40, 100 - crowdingPenalty - generationDecay), // Born stressed if crowded
            generation: parentStats ? parentStats.generation + 1 : 1,
            money: parentStats ? parentStats.money / 2 : 10
        };

        // Randomize traits for variation
        this.aggressiveness = Math.random();
        this.efficiency = 0.1 + (Math.random() * 0.2);
    }

    /**
     * Async AI thinking - called periodically for major decisions
     */
    public async thinkWithAI(neighbors: Process[], emptySpots: number, marketSnapshot: { lowestAsk: number, highestBid: number }): Promise<void> {
        if (!isAIReady()) return;

        const ctx = {
            self: this.stats,
            neighbors: neighbors.map(n => n.stats),
            emptySpots,
            marketState: marketSnapshot
        };

        const thought = await agentThink(ctx);
        if (thought) {
            this.lastThought = thought.reasoning;
            this.lastThoughtAt = Date.now();
            setLastThought(this.stats.id, thought);
        }
    }

    /**
     * Get AI recommendation if available
     */
    public getAIRecommendation(): string | null {
        const thought = getLastThought(this.stats.id);
        return thought?.action || null;
    }

    /**
     * Main Decision Loop (The "Brain")
     * Uses AI when available, falls back to heuristics
     */
    public decideAction(neighbors: Process[], availableRam: number, marketSnapshot: { lowestAsk: number, highestBid: number }): Action {
        let action: Action = { type: 'NO_OP' };

        // BEAUTIFUL ONES: Withdrawn agents only rest or flee — they don't participate
        if (this.isWithdrawn) {
            this.state = ProcessState.GARBAGE_COLLECTING;
            if (neighbors.length > 0) {
                // Flee from others
                action = { type: 'ALLOCATE_RAM' }; // Will be resolved as movement away
            } else {
                action = { type: 'DEFRAGMENT' }; // Groom in isolation
            }
            this.lastAction = action.type;
            return action;
        }

        // Check if AI has a recommendation
        const aiRec = this.getAIRecommendation();

        if (aiRec) {
            // AI REPRODUCE also requires a partner
            const fertilePartners = neighbors.filter(n =>
                !n.isWithdrawn && n.stats.cpu > 40 && n.stats.stability > 50 && n.stats.money > 20
            );

            if (aiRec === 'REPRODUCE' && this.stats.cpu > 50 && availableRam > 0 && this.stats.money > 40 && this.stats.stability > this.fertilityThreshold && fertilePartners.length > 0) {
                this.state = ProcessState.ALLOCATING;
                action = { type: 'FORK' };
            } else if (aiRec === 'ATTACK' && neighbors.length > 0) {
                this.state = ProcessState.DDOS;
                const victim = neighbors.sort((a, b) => a.stats.stability - b.stats.stability)[0];
                action = { type: 'TERMINATE_PROCESS', targetId: victim.stats.id };
            } else if (aiRec === 'WORK' && this.stats.cpu >= 5) {
                this.state = ProcessState.COMPUTING;
                action = { type: 'MINT_TOKEN' };
            } else if (aiRec === 'REST') {
                this.state = ProcessState.IDLE;
                action = { type: 'DEFRAGMENT' };
            } else if (aiRec === 'SCAVENGE') {
                this.state = ProcessState.CRASHED;
                action = { type: 'REQUEST_CYCLES' };
            } else if (aiRec === 'TRADE') {
                this.state = ProcessState.ALLOCATING;
                action = { type: 'TRADE_TOKEN', payload: { action: 'BUY_ENERGY' } };
            }

            if (action.type !== 'NO_OP') {
                this.lastAction = action.type;
                return action;
            }
        }

        // 1. SURVIVAL CHECK (Immediate Death)
        if (this.stats.cpu < 10) {
            // If Rich, buy food (TRADE)
            if (this.stats.money >= 15) { // Can afford food
                this.state = ProcessState.ALLOCATING; // Buying
                action = { type: 'TRADE_TOKEN', payload: { action: 'BUY_ENERGY' } };
            } else {
                this.state = ProcessState.CRASHED; // Panicking
                action = { type: 'REQUEST_CYCLES' }; // Scavenge/Beg
            }
        }

        // 2. AGGRESSION (The Purge)
        // Only truly unstable + aggressive agents choose violence
        else if (this.stats.stability < 35 && this.aggressiveness > 0.6 && neighbors.length > 0) {
            this.state = ProcessState.DDOS;

            // PRIORITY TARGETING: ALPHAs are high-value targets (the powerful attract aggression)
            // This aligns with Universe-25 where dominant males became targets
            const alphaTargets = neighbors.filter(n => n.socialRank === 'ALPHA');
            const betaTargets = neighbors.filter(n => n.socialRank === 'BETA');

            let victim;
            if (alphaTargets.length > 0) {
                // Attack the richest ALPHA (takedown the powerful)
                victim = alphaTargets.sort((a, b) => b.stats.money - a.stats.money)[0];
            } else if (betaTargets.length > 0 && Math.random() > 0.5) {
                // 50% chance to attack BETA if no ALPHAs
                victim = betaTargets.sort((a, b) => b.stats.money - a.stats.money)[0];
            } else {
                // Fall back to attacking the weakest (easy prey)
                victim = neighbors.sort((a, b) => a.stats.cpu - b.stats.cpu)[0];
            }

            action = { type: 'TERMINATE_PROCESS', targetId: victim.stats.id };
        }

        // 3. REPRODUCTION (The Imperative) - Requires a PARTNER nearby!
        // Must have: energy, space, wealth, stability, AND a fertile neighbor
        else if (this.stats.cpu > 50 && availableRam > 0 && this.stats.money > 40 && this.stats.stability > this.fertilityThreshold) {
            // Find a fertile partner nearby (not withdrawn, has decent stats)
            const fertilePartners = neighbors.filter(n =>
                !n.isWithdrawn &&
                n.stats.cpu > 40 &&
                n.stats.stability > 50 &&
                n.stats.money > 20
            );

            if (fertilePartners.length > 0) {
                // Found a partner! Reproduce
                this.state = ProcessState.ALLOCATING;
                action = { type: 'FORK' };
            }
            // No partner = no reproduction (isolation is deadly)
        }

        // 4. WEALTHY BEHAVIOR (money >= 60)
        else if (this.stats.money >= 60) {
            const roll = Math.random();

            if (roll < 0.3) {
                // 30% chance: SELL data to create market supply
                this.state = ProcessState.COMPUTING;
                action = {
                    type: 'PLACE_ASK',
                    payload: {
                        packetType: 'INT',
                        price: 8 + Math.floor(Math.random() * 5)
                    }
                };
            } else if (roll < 0.5 && marketSnapshot.lowestAsk > 0 && marketSnapshot.lowestAsk < 20) {
                // 20% chance: BUY if good deal exists
                this.state = ProcessState.COMPUTING;
                action = {
                    type: 'PLACE_BID',
                    payload: {
                        packetType: 'INT',
                        price: marketSnapshot.lowestAsk + 1
                    }
                };
            } else if (roll < 0.7) {
                // 20% chance: Keep working to accumulate more
                this.state = ProcessState.COMPUTING;
                action = { type: 'MINT_TOKEN' };
            } else {
                // 30% chance: Socialize/Idle
                this.state = ProcessState.IDLE;
                action = { type: 'DEFRAGMENT' };
            }
        }

        // 5. WORKING CLASS (money < 60, cpu > 15)
        else if (this.stats.cpu > 15 && this.stats.money < 60) {
            if (this.stats.money > 30 && Math.random() < 0.2) {
                // Occasionally sell to participate in economy
                this.state = ProcessState.COMPUTING;
                action = {
                    type: 'PLACE_ASK',
                    payload: {
                        packetType: 'INT',
                        price: 5 + Math.floor(Math.random() * 5)
                    }
                };
            } else {
                // Usually just work
                this.state = ProcessState.COMPUTING;
                action = { type: 'MINT_TOKEN' };
            }
        }

        // 6. LOW ENERGY RECOVERY
        else if (this.stats.cpu <= 15 && this.stats.cpu > 10) {
            this.state = ProcessState.IDLE;
            action = { type: 'DEFRAGMENT' }; // Rest to recover
        }

        // 7. SOCIAL (Default)
        else if (neighbors.length > 0 && this.stats.stability > 50) {
            this.state = ProcessState.IDLE;
            action = { type: 'DEFRAGMENT' };
        } else {
            this.state = ProcessState.IDLE;
            action = { type: 'NO_OP' };
        }

        this.lastAction = action.type;
        return action;
    }

    /**
     * Called each tick with neighbor info for social dynamics
     */
    public tick(neighborCount: number = 0, avgNeighborStability: number = 100) {
        this.stats.cycle++;

        // === METABOLISM ===
        this.stats.cpu -= this.efficiency;

        // === UNIVERSE-25 DYNAMICS ===

        // 1. CROWDING STRESS: Too many neighbors = stress
        if (neighborCount > 3) {
            this.stats.stability -= (neighborCount - 3) * 0.5;
        }

        // 2. SOCIAL CONTAGION: Unstable neighbors spread anxiety
        if (avgNeighborStability < 50 && neighborCount > 0) {
            this.stats.stability -= (50 - avgNeighborStability) * 0.1;
        }

        // 3. ISOLATION RECOVERY: Being alone heals stress
        if (neighborCount === 0) {
            this.stats.stability += 0.3;
        } else if (neighborCount === 1 || neighborCount === 2) {
            this.stats.stability += 0.5; // Ideal social circle
        }

        // 4. AGING: Older agents become less resilient
        if (this.stats.cycle > 500) {
            this.stats.stability -= 0.1;
        }

        // 5. TERRITORIAL STRESS: Displacement from home causes anxiety
        const distFromHome = Math.abs(this.position.x - this.homePosition.x)
            + Math.abs(this.position.y - this.homePosition.y);
        if (distFromHome > 5) {
            this.stats.stability -= (distFromHome - 5) * 0.15; // Far from home = stressed
        } else if (distFromHome <= 2) {
            this.stats.stability += 0.1; // Comfort of home territory
        }

        // 6. FERTILITY SCARRING: Chronic stress permanently damages fertility
        // If stability stays below 40 for extended periods, threshold rises
        if (this.stats.stability < 40 && this.stats.cycle > 50) {
            this.fertilityThreshold = Math.min(95, this.fertilityThreshold + 0.05); // Slow permanent damage
        }

        // 7. "BEAUTIFUL ONES" WITHDRAWAL
        // Rich agents with chronic stress eventually withdraw permanently
        if (this.stats.money > 80 && this.stats.stability < 40) {
            this.state = ProcessState.GARBAGE_COLLECTING; // Grooming
            // Prolonged stress + wealth = permanent withdrawal
            if (this.stats.stability < 30 && this.stats.cycle > 100) {
                this.isWithdrawn = true; // Permanent — they never come back
            }
        }

        // Withdrawn agents have reduced metabolism (they just exist)
        if (this.isWithdrawn) {
            this.stats.cpu += this.efficiency * 0.5; // Partially offset metabolism — they conserve energy
        }

        // === UPDATE SOCIAL RANK ===
        // Rank is based on "power score" = wealth + stability + priority bonus
        const powerScore = this.stats.money + this.stats.stability + (this.stats.priority * 5);

        if (this.isWithdrawn) {
            // Withdrawn agents are always OMEGA - they've given up on society
            this.socialRank = 'OMEGA';
        } else if (powerScore >= 300 && this.stats.stability >= 85 && this.stats.money >= 120) {
            // ALPHA: True elite - extremely wealthy, very stable
            // Should be VERY rare (1-3 in entire population)
            this.socialRank = 'ALPHA';
        } else if (powerScore >= 150 && this.stats.stability >= 60 && this.stats.money >= 50) {
            // BETA: Upper-middle class 
            this.socialRank = 'BETA';
        } else {
            // OMEGA: Everyone else - the majority
            this.socialRank = 'OMEGA';
        }

        // === CLAMP STATS ===
        this.stats.stability = Math.min(100, Math.max(0, this.stats.stability));
        this.stats.cpu = Math.min(100, Math.max(0, this.stats.cpu));
    }
}
