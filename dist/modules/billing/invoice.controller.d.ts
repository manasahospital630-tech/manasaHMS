import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
export declare const create: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAll: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getById: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getPatientInvoices: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const recordPayment: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const cancel: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const returnInvoice: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateStatus: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAnalytics: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=invoice.controller.d.ts.map