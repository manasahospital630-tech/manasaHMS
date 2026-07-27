"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const environment_1 = require("../config/environment");
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
const errorHandler = (err, _req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational || statusCode < 500 || err instanceof AppError || err.name === 'AppError';
    console.error('Error Handler:', {
        name: err.name,
        message: err.message,
        statusCode,
        isOperational,
        stack: environment_1.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            error: 'Invalid token.',
        });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            error: 'Token has expired.',
        });
        return;
    }
    if (err.name === 'SyntaxError' && 'body' in err) {
        res.status(400).json({
            success: false,
            error: 'Invalid JSON in request body.',
        });
        return;
    }
    // Expose operational error messages (e.g. 401 Invalid Credentials, 403 Deactivated) directly
    const message = isOperational || environment_1.env.NODE_ENV !== 'production'
        ? (err.message || 'An error occurred.')
        : 'An unexpected error occurred. Please try again later.';
    res.status(statusCode).json({
        success: false,
        error: message,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map