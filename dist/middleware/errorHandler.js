"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
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
    console.error('Error Handler:', {
        name: err.name,
        message: err.message,
        statusCode,
        stack: err.stack,
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
    // Always return human-readable error message to help diagnostic feedback on Hostinger/Cloud hosting
    const message = err.message || 'An unexpected error occurred. Please try again later.';
    res.status(statusCode).json({
        success: false,
        error: message,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map