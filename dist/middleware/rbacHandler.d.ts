import { Request, Response, NextFunction } from 'express';
export type UserRole = 'Admin' | 'Management' | 'Doctor' | 'Nurse' | 'Receptionist' | 'Pharmacist' | 'Biller' | 'Patient' | 'Incharge';
export interface IdentityPayload {
    userId: string;
    role: UserRole;
    email: string;
}
export interface ProtectedRequest extends Request {
    identity?: IdentityPayload;
}
export declare const enforceRBAC: (allowedRoles: UserRole[]) => (req: ProtectedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbacHandler.d.ts.map