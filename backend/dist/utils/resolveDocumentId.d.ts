import mongoose from 'mongoose';
type IdLike = mongoose.Types.ObjectId | string | {
    _id?: mongoose.Types.ObjectId | string;
} | null | undefined;
/** Resolves a MongoDB id from an ObjectId, string, or populated subdocument. */
export declare const resolveDocumentId: (value: IdLike, label?: string) => string;
export {};
//# sourceMappingURL=resolveDocumentId.d.ts.map