import { Request, Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
export declare const admitEmergencyPatient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const generatePoliceIntimation: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getEmergencyConsents: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const saveDigitalConsent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const logEmergencyVitals: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getEmergencyVitalsHistory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateEmergencyStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createEmergencyOrder: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getEmergencyOrders: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateEmergencyOrderStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getActiveEmergencyPatients: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=emergency.controller.d.ts.map