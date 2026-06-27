/**
 * Resolves an inventory item by MongoDB ObjectId or opaque publicId token.
 * Prevents relying on predictable/enumerable IDs in URLs.
 */
export declare const resolveInventoryId: (param: string) => Promise<string>;
//# sourceMappingURL=resolveInventory.d.ts.map