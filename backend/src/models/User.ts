import mongoose, { Document, Schema } from 'mongoose';
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

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.CASHIER },
    customPermissions: { type: [String], default: undefined },
    avatar: { type: String },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE },
    isOnboarded: { type: Boolean, default: false },
    refreshToken: { type: String, select: false },
    lastLogin: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.index({ isDeleted: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
