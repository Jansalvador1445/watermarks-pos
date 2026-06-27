import mongoose, { Document } from 'mongoose';
import { UserRole, UserStatus } from '../types/enums';
export interface IUser extends Document {
    name: string;
    email: string;
    username?: string;
    passwordHash: string;
    role: UserRole;
    customPermissions?: string[];
    avatar?: string;
    status: UserStatus;
    isOnboarded: boolean;
    refreshToken?: string;
    lastLogin?: Date;
    failedLoginAttempts: number;
    lockUntil?: Date;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, mongoose.DefaultSchemaOptions> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
//# sourceMappingURL=User.d.ts.map