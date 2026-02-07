export type Vector2 = { x: number; y: number };

export const ProcessState = {
    IDLE: 'IDLE',
    COMPUTING: 'COMPUTING',
    ALLOCATING: 'ALLOCATING',
    GARBAGE_COLLECTING: 'GC',
    DDOS: 'DDOS',
    CRASHED: 'CRASHED',
    KERNEL_PANIC: 'KERNEL_PANIC'
} as const;
export type ProcessState = typeof ProcessState[keyof typeof ProcessState];

export type ProcessStats = {
    id: string;
    cycle: number; // Age
    ram: number; // "Space"
    cpu: number; // "Energy/Food"
    priority: number; // "Social Status"
    stability: number; // "Stress" inverted
    generation: number;
    money: number; // "Resource/Currency"
};

export type ActionType =
    | 'NO_OP'
    | 'ALLOCATE_RAM' // Claim Move
    | 'RELEASE_RAM'
    | 'REQUEST_CYCLES' // Eat
    | 'TERMINATE_PROCESS' // Attack
    | 'FORK' // Reproduce
    | 'DEFRAGMENT' // Grooming/Social
    | 'MINT_TOKEN' // Create Value
    | 'TRADE_TOKEN' // Exchange Value
    | 'PLACE_ASK'  // Sell Data Packet
    | 'PLACE_BID'; // Buy Data Packet

export type Action = {
    type: ActionType;
    targetId?: string;
    targetPos?: Vector2;
    payload?: any; // For trade details
};

// === POLITICS SYSTEM ===

export type SocialRank = 'ALPHA' | 'BETA' | 'OMEGA';

export interface Territory {
    leaderId: string;          // The ALPHA who owns this territory
    centerX: number;           // Territory center (usually Alpha's home)
    centerY: number;
    radius: number;            // Territory radius (typically 4-5 cells)
    color: string;             // Unique color for visualization
    memberCount: number;       // How many agents are in this territory
}

// Predefined territory colors (distinct, vibrant)
export const TERRITORY_COLORS = [
    '#ff6b6b',  // Coral Red
    '#4ecdc4',  // Teal
    '#ffe66d',  // Yellow
    '#95e1d3',  // Mint
    '#f38181',  // Salmon
    '#aa96da',  // Lavender
    '#fcbad3',  // Pink
    '#a8d8ea',  // Sky Blue
    '#ff9f43',  // Orange
    '#6c5ce7',  // Purple
];
