import { Response } from 'express';
export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    isOnboarded?: boolean;
    customPermissions?: string[];
}
export declare const generateAccessToken: (payload: TokenPayload) => string;
export declare const generateRefreshToken: (payload: TokenPayload) => string;
export declare const verifyAccessToken: (token: string) => TokenPayload;
export declare const verifyRefreshToken: (token: string) => TokenPayload;
export declare const setAuthCookies: (res: Response, accessToken: string, refreshToken: string) => void;
export declare const clearAuthCookies: (res: Response) => void;
//# sourceMappingURL=jwt.d.ts.map