"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceRBAC = void 0;
const enforceRBAC = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.identity) {
            res.status(401).json({
                success: false,
                error: 'Authentication required. No identity found on request.',
            });
            return;
        }
        if (!allowedRoles.includes(req.identity.role)) {
            res.status(403).json({
                success: false,
                error: `Access denied. Your role '${req.identity.role}' is not authorized for this resource. Required roles: ${allowedRoles.join(', ')}.`,
            });
            return;
        }
        next();
    };
};
exports.enforceRBAC = enforceRBAC;
//# sourceMappingURL=rbacHandler.js.map