import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
export declare const getBusinessUnits: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createBusinessUnit: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateBusinessUnit: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getTeams: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createTeam: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateTeam: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteTeam: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getTeamMembers: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateTeamMembers: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateTeamRoles: (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=businessUnits.controller.d.ts.map