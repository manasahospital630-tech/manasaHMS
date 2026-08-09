import { Response, NextFunction } from 'express';
import { ProtectedRequest } from './rbacHandler';
export declare const auditLogger: (action: string, resourceType: string) => (req: ProtectedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auditLogger.d.ts.map