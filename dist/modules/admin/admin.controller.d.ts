import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
export declare const getUsers: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getStaffProfile: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createUser: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateUser: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteUser: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAuditLog: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getDoctorProfiles: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const upsertDoctorProfile: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getHospitalSettings: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateHospitalSettings: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getDashboardStats: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getConsolidatedHospitalRevenue: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getHospitalSettingsPublic: (req: any, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=admin.controller.d.ts.map