import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
export declare const create: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getPatientEncounters: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getById: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateVitals: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateSOAP: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getByIpAdmissionId: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=encounter.controller.d.ts.map