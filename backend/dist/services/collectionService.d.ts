export declare class CollectionService {
    static getDaily(dateStr?: string): Promise<{
        date: string;
        summary: {
            cash: number;
            gcash: number;
            bank: number;
            total: number;
        };
        unpaidTotal: number;
        items: ({
            id: import("mongoose").Types.ObjectId;
            customer: string;
            amount: number;
            paymentMethod: import("../types/enums").PaymentMethod;
            paid: boolean;
            type: import("../types/enums").TransactionType;
            source: "transaction";
            createdAt: Date;
        } | {
            id: import("mongoose").Types.ObjectId;
            customer: string;
            amount: number;
            paymentMethod: string;
            paid: boolean;
            type: string;
            source: "delivery";
            staff: string | undefined;
            createdAt: Date;
        })[];
    }>;
}
//# sourceMappingURL=collectionService.d.ts.map