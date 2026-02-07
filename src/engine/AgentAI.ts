import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ProcessStats } from './types';

interface AgentContext {
    self: ProcessStats;
    neighbors: ProcessStats[];
    emptySpots: number;
    marketState: { lowestAsk: number; highestBid: number };
}

interface ThinkResult {
    action: 'WORK' | 'TRADE' | 'ATTACK' | 'REPRODUCE' | 'REST' | 'SCAVENGE';
    reasoning: string;
    confidence: number;
}

// Rate limiting: GLOBAL limit (5 per minute for free tier, we use 4 to be safe)
let lastGlobalCall = 0;
const GLOBAL_CALL_INTERVAL = 15000; // 15 seconds between ANY calls (4/min max)
const thoughtCache = new Map<string, { result: ThinkResult; timestamp: number }>();
const CACHE_TTL = 60000; // Cache thoughts for 60 seconds (longer cache = fewer calls)

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

export function initializeAI(apiKey: string) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('[AgentAI] Initialized with Gemini Flash');
}

export function isAIReady(): boolean {
    return model !== null;
}

function createPrompt(ctx: AgentContext): string {
    const neighborCount = ctx.neighbors.length;
    const avgNeighborStability = neighborCount > 0
        ? ctx.neighbors.reduce((s, n) => s + n.stability, 0) / neighborCount
        : 100;

    return `You are an agent in a colony simulation (like Universe-25 mouse experiment).

YOUR STATS:
- Energy: ${Math.round(ctx.self.cpu)}%
- Wealth: ${Math.round(ctx.self.money)} credits
- Mental Stability: ${Math.round(ctx.self.stability)}%
- Age: ${ctx.self.cycle} cycles

ENVIRONMENT:
- Neighbors nearby: ${neighborCount}
- Average neighbor stability: ${Math.round(avgNeighborStability)}%
- Empty spaces around you: ${ctx.emptySpots}
- Market: Lowest sell price ${ctx.marketState.lowestAsk}, Highest buy offer ${ctx.marketState.highestBid}

AVAILABLE ACTIONS:
- WORK: Spend 5 energy to earn 5 credits
- TRADE: Buy/sell on market
- ATTACK: Attack an unstable neighbor (costs energy, reduces their stability)
- REPRODUCE: Have offspring (requires >40 credits, >50 energy, >70 stability)
- REST: Recover stability slowly
- SCAVENGE: Beg for energy (+15 energy, humiliating)

Respond with ONLY a JSON object (no markdown):
{"action": "ACTION_NAME", "reasoning": "brief 10-word explanation", "confidence": 0.0-1.0}`;
}

function generateCacheKey(ctx: AgentContext): string {
    // Include agent ID + buckets for unique thoughts per agent
    const energyBucket = Math.floor(ctx.self.cpu / 25) * 25;
    const moneyBucket = Math.floor(ctx.self.money / 25) * 25;
    const stabilityBucket = Math.floor(ctx.self.stability / 25) * 25;
    const neighborBucket = Math.min(ctx.neighbors.length, 4);

    return `${ctx.self.id}-${energyBucket}-${moneyBucket}-${stabilityBucket}-${neighborBucket}`;
}

export async function agentThink(ctx: AgentContext): Promise<ThinkResult | null> {
    if (!model) {
        return null;
    }

    const agentId = ctx.self.id;
    const now = Date.now();

    // GLOBAL rate limit check (only 1 call every 15 seconds across ALL agents)
    if (now - lastGlobalCall < GLOBAL_CALL_INTERVAL) {
        return null; // Too soon globally, skip
    }

    // Check cache first
    const cacheKey = generateCacheKey(ctx);
    const cached = thoughtCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL) {
        return cached.result; // Return cached thought
    }

    try {
        lastGlobalCall = now; // Mark global call time
        console.log(`[AgentAI] 🧠 ${agentId} thinking...`);

        const prompt = createPrompt(ctx);
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        console.log(`[AgentAI] 💬 Response:`, text.substring(0, 80));

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn('[AgentAI] Could not parse response:', text);
            return null;
        }

        const parsed = JSON.parse(jsonMatch[0]) as ThinkResult;

        // Validate action
        const validActions = ['WORK', 'TRADE', 'ATTACK', 'REPRODUCE', 'REST', 'SCAVENGE'];
        if (!validActions.includes(parsed.action)) {
            parsed.action = 'WORK'; // Default fallback
        }

        // Cache the result
        thoughtCache.set(cacheKey, { result: parsed, timestamp: now });

        console.log(`[AgentAI] ✅ ${agentId}: ${parsed.action} - "${parsed.reasoning}"`);

        return parsed;
    } catch (err) {
        console.error('[AgentAI] ❌ Error:', err);
        return null;
    }
}

// Get the last thought for display purposes
const lastThoughts = new Map<string, ThinkResult>();

export function getLastThought(agentId: string): ThinkResult | null {
    return lastThoughts.get(agentId) || null;
}

export function setLastThought(agentId: string, thought: ThinkResult) {
    lastThoughts.set(agentId, thought);
}
