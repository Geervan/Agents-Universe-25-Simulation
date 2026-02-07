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
