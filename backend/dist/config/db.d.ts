/**
 * Standalone MongoDB (local dev) requires retryWrites=false for session/transaction ops.
 * Atlas and replica sets keep the driver default (retryWrites=true).
 */
export declare const normalizeMongoUri: (uri: string) => string;
export declare const connectDB: () => Promise<void>;
//# sourceMappingURL=db.d.ts.map