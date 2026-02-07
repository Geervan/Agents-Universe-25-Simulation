// Market Types

export type PacketType = 'INT' | 'FLOAT' | 'BOOL';

export interface DataPacket {
    id: string;
    type: PacketType;
    quality: number; // 0.0 to 1.0 (Entropy)
    creatorId: string;
    timestamp: number;
}

export interface Order {
    id: string;
    agentId: string;
    type: 'BID' | 'ASK'; // Buy | Sell
    packetType: PacketType;
    price: number;
    timestamp: number;
}

export class Marketplace {
    public orders: Order[];
    public history: { price: number, tick: number }[]; // For price tracking

    constructor() {
        this.orders = [];
        this.history = [];
    }

    public placeOrder(order: Order) {
        this.orders.push(order);
    }

    public matchOrders(): { buyerId: string, sellerId: string, price: number }[] {
        const matches: { buyerId: string, sellerId: string, price: number }[] = [];
        const bids = this.orders.filter(o => o.type === 'BID').sort((a, b) => b.price - a.price); // Highest Bid first
        const asks = this.orders.filter(o => o.type === 'ASK').sort((a, b) => a.price - b.price); // Lowest Ask first

        // Simple Matching Engine
        // O(N^2) naive approach for now
        for (const bid of bids) {
            const matchingAsk = asks.find(ask =>
                ask.packetType === bid.packetType &&
                ask.price <= bid.price && // Overlap exists
                ask.agentId !== bid.agentId // Don't buy from self
            );

            if (matchingAsk) {
                // DEAL!
                matches.push({
                    buyerId: bid.agentId,
                    sellerId: matchingAsk.agentId,
                    price: matchingAsk.price // Buyer pays asking price (Seller market for now)
                });

                // Remove filled orders
                this.orders = this.orders.filter(o => o.id !== bid.id && o.id !== matchingAsk.id);
                // Also remove from local arrays to prevent double match
                const askIdx = asks.indexOf(matchingAsk);
                if (askIdx > -1) asks.splice(askIdx, 1);
            }
        }

        return matches;
    }

    public cleanExpiredOrders(currentTick: number) {
        // Orders expire after 50 ticks to keep market fresh
        this.orders = this.orders.filter(o => currentTick - o.timestamp < 50);
    }
}
