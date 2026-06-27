import { UserRole } from '../types/enums';
export declare const ADMIN_ONLY_PERMISSIONS: string[];
export declare const ALL_ASSIGNABLE_PERMISSIONS: string[];
export declare const validateCustomPermissions: (permissions: string[]) => string[];
export declare const resolveUserPermissions: (role: UserRole | string, customPermissions?: string[] | null) => string[];
//# sourceMappingURL=permissions.d.ts.map