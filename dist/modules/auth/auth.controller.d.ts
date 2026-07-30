import { Request, Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
export declare const register: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getProfile: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map