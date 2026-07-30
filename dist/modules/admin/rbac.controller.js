"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoleById = exports.getRoles = exports.getModulesMaster = void 0;
const rbacService = __importStar(require("./rbac.service"));
const responseHelper_1 = require("../../utils/responseHelper");
const getModulesMaster = async (req, res, next) => {
    try {
        const modules = await rbacService.getModulesMaster();
        (0, responseHelper_1.successResponse)(res, modules);
    }
    catch (error) {
        next(error);
    }
};
exports.getModulesMaster = getModulesMaster;
const getRoles = async (req, res, next) => {
    try {
        const roles = await rbacService.getRoles();
        (0, responseHelper_1.successResponse)(res, roles);
    }
    catch (error) {
        next(error);
    }
};
exports.getRoles = getRoles;
const getRoleById = async (req, res, next) => {
    try {
        const roleId = req.params.id;
        const role = await rbacService.getRoleById(roleId);
        if (!role) {
            (0, responseHelper_1.errorResponse)(res, 'Role not found', 404);
            return;
        }
        (0, responseHelper_1.successResponse)(res, role);
    }
    catch (error) {
        next(error);
    }
};
exports.getRoleById = getRoleById;
const createRole = async (req, res, next) => {
    try {
        const { role_name, description, permissions } = req.body;
        if (!role_name || !role_name.trim()) {
            (0, responseHelper_1.errorResponse)(res, 'Role name is required', 400);
            return;
        }
        const role = await rbacService.createRole({ role_name, description, permissions });
        (0, responseHelper_1.successResponse)(res, role, 'Role created successfully', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createRole = createRole;
const updateRole = async (req, res, next) => {
    try {
        const roleId = req.params.id;
        const { role_name, description, permissions } = req.body;
        const role = await rbacService.updateRole(roleId, { role_name, description, permissions });
        (0, responseHelper_1.successResponse)(res, role, 'Role updated successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.updateRole = updateRole;
const deleteRole = async (req, res, next) => {
    try {
        const roleId = req.params.id;
        const result = await rbacService.deleteRole(roleId);
        (0, responseHelper_1.successResponse)(res, result, 'Role deleted successfully');
    }
    catch (error) {
        (0, responseHelper_1.errorResponse)(res, error.message || 'Failed to delete role', 400);
    }
};
exports.deleteRole = deleteRole;
//# sourceMappingURL=rbac.controller.js.map