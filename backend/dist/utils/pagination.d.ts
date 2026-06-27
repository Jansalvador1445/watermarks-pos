import { Request } from 'express';
export interface PaginationOptions {
    page: number;
    limit: number;
    skip: number;
    sort: Record<string, 1 | -1>;
}
export declare const getPagination: (req: Request) => PaginationOptions;
export declare const escapeRegex: (value: string) => string;
export declare const buildSearchQuery: (search: string | undefined, fields: string[]) => {
    $or?: undefined;
} | {
    $or: {
        [x: string]: RegExp;
    }[];
};
//# sourceMappingURL=pagination.d.ts.map