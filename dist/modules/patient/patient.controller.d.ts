import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
export declare const create: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAll: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getById: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const update: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const givePortalAccess: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getTimeline: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=patient.controller.d.ts.map