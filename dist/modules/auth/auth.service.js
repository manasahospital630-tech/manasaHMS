"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../../config/database");
const jwt_1 = require("../../config/jwt");
const errorHandler_1 = require("../../middleware/errorHandler");
const rbac_service_1 = require("../admin/rbac.service");
const uuid_1 = require("uuid");
const SALT_ROUNDS = 12;
const registerUser = async (input) => {
    const cleanEmail = (input.email || '').trim().toLowerCase();
    const existingUser = await (0, database_1.query)('SELECT user_id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existingUser.rows.length > 0) {
        throw new errorHandler_1.AppError('A user with this email already exists.', 409);
    }
    const passwordHash = await bcryptjs_1.default.hash(input.password, SALT_ROUNDS);
    const userId = (0, uuid_1.v4)();
    await (0, database_1.query)(`INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`, [userId, cleanEmail, passwordHash, input.firstName, input.lastName, input.phone || null, input.role]);
    const result = await (0, database_1.query)(`SELECT user_id, email, first_name, last_name, phone, role, is_active, created_at, updated_at
     FROM users WHERE user_id = $1`, [userId]);
    return result.rows[0];
};
exports.registerUser = registerUser;
const loginUser = async (input) => {
    const cleanEmail = (input.email || '').trim().toLowerCase();
    const cleanPassword = (input.password || '').trim();
    const result = await (0, database_1.query)('SELECT user_id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (result.rows.length === 0) {
        throw new errorHandler_1.AppError('Invalid email or password.', 401);
    }
    const user = result.rows[0];
    if (user.is_active === 0 || user.is_active === false || user.is_active === '0') {
        throw new errorHandler_1.AppError('Your account has been deactivated. Please contact an administrator.', 403);
    }
    const isPasswordValid = await bcryptjs_1.default.compare(cleanPassword, user.password_hash);
    if (!isPasswordValid) {
        throw new errorHandler_1.AppError('Invalid email or password.', 401);
    }
    const token = (0, jwt_1.generateToken)({
        userId: user.user_id,
        role: user.role,
        email: user.email,
    });
    return {
        token,
        user: {
            user_id: user.user_id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            permissions: await (0, rbac_service_1.getUserPermissionMatrix)(user.user_id)
        },
    };
};
exports.loginUser = loginUser;
const getUserProfile = async (userId) => {
    const result = await (0, database_1.query)(`SELECT user_id, email, first_name, last_name, phone, role, is_active, created_at, updated_at
     FROM users WHERE user_id = $1`, [userId]);
    if (result.rows.length === 0) {
        throw new errorHandler_1.AppError('User not found.', 404);
    }
    const user = result.rows[0];
    const permissions = await (0, rbac_service_1.getUserPermissionMatrix)(user.user_id);
    return {
        ...user,
        permissions
    };
};
exports.getUserProfile = getUserProfile;
//# sourceMappingURL=auth.service.js.map