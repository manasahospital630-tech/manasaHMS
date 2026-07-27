"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const defaultDb = process.env.DATABASE_URL || 'postgresql://hms_user.ctrlsyhzszlufdnguerz:Nine%40248688944@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';
const defaultJwt = 'super-secret-jwt-key-for-manasa-hms-production-2026';
let rawPort = process.env.PORT || 5000;
if (typeof rawPort === 'string' && !isNaN(parseInt(rawPort, 10)) && !rawPort.includes('/') && !rawPort.includes('\\')) {
    rawPort = parseInt(rawPort, 10);
}
exports.env = {
    PORT: rawPort,
    DATABASE_URL: process.env.DATABASE_URL || defaultDb,
    JWT_SECRET: process.env.JWT_SECRET || defaultJwt,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    NODE_ENV: process.env.NODE_ENV || 'production',
};
//# sourceMappingURL=environment.js.map