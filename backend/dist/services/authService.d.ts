import { Response } from 'express';
import { UserStatus, UserRole } from '../types/enums';
export declare class AuthService {
    private static buildTokenPayload;
    private static buildUserResponse;
    static login(identifier: string, password: string, res: Response, ip?: string): Promise<{
        user: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            username: string | undefined;
            role: UserRole;
            avatar: string | undefined;
            status: UserStatus;
            isOnboarded: boolean;
            customPermissions: string[] | undefined;
            lastLogin: Date | undefined;
        };
    }>;
    static refresh(refreshToken: string, res: Response): Promise<{
        message: string;
    }>;
    static logout(userId: string, res: Response): Promise<{
        message: string;
    }>;
    static getMe(userId: string): Promise<{
        id: import("mongoose").Types.ObjectId;
        name: string;
        email: string;
        username: string | undefined;
        role: UserRole;
        avatar: string | undefined;
        status: UserStatus;
        isOnboarded: boolean;
        customPermissions: string[] | undefined;
        lastLogin: Date | undefined;
    }>;
    static completeOnboarding(userId: string, data: {
        username: string;
        email: string;
        password: string;
    }, res: Response): Promise<{
        user: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            username: string | undefined;
            role: UserRole;
            avatar: string | undefined;
            status: UserStatus;
            isOnboarded: boolean;
            customPermissions: string[] | undefined;
            lastLogin: Date | undefined;
        };
    }>;
}
//# sourceMappingURL=authService.d.ts.map