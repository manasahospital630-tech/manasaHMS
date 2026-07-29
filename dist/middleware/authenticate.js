"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = void 0;
const jwt_1 = require("../config/jwt");
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            error: 'Authentication required. Please provide a valid Bearer token.',
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        req.identity = {
            userId: decoded.userId,
            role: decoded.role,
            email: decoded.email,
        };
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token. Please log in again.',
        });
    }
};
exports.authenticateJWT = authenticateJWT;
//# sourceMappingURL=authenticate.js.map