import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
export declare const create: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAll: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getById: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateStatus: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createOPCheckIn: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkReviewStatus: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const recordTriageVitals: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=appointment.controller.d.ts.map