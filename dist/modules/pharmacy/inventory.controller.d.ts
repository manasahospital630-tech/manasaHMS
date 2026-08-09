import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
export declare const getAll: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getById: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const create: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const bulkCreate: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const update: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getLowStock: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createSale: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getSalesHistory: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=inventory.controller.d.ts.map