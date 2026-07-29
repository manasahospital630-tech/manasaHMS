import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
export declare const add: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getForEncounter: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=diagnosis.controller.d.ts.map