"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = exports.JWT_EXPIRES_IN = exports.JWT_SECRET = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("./environment");
exports.JWT_SECRET = environment_1.env.JWT_SECRET;
exports.JWT_EXPIRES_IN = environment_1.env.JWT_EXPIRES_IN;
const generateToken = (payload) => {
    const options = {
        expiresIn: exports.JWT_EXPIRES_IN,
    };
    return jsonwebtoken_1.default.sign(payload, exports.JWT_SECRET, options);
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    const decoded = jsonwebtoken_1.default.verify(token, exports.JWT_SECRET);
    return {
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email,
    };
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=jwt.js.map