import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
export declare const create: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getPending: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getById: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const dispense: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=prescription.controller.d.ts.map