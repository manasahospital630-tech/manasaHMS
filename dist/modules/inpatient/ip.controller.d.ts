import { Request, Response, NextFunction } from 'express';
export declare const getBeds: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getActiveAdmissions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const admitRoutine: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const admitEmergencyFastTrack: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const transferBed: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const dischargePatient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const addBed: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const editBed: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteBed: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=ip.controller.d.ts.map