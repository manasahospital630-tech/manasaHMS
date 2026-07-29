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
exports.deleteDepartment = exports.updateDepartment = exports.createDepartment = exports.getDepartments = void 0;
const departmentService = __importStar(require("./department.service"));
const getDepartments = async (req, res, next) => {
    try {
        const departments = await departmentService.getAllDepartments();
        res.json({
            success: true,
            data: departments
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getDepartments = getDepartments;
const createDepartment = async (req, res, next) => {
    try {
        const department = await departmentService.createDepartment(req.body);
        res.status(201).json({
            success: true,
            message: 'Department created successfully.',
            data: department
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createDepartment = createDepartment;
const updateDepartment = async (req, res, next) => {
    try {
        const id = req.params.id;
        const department = await departmentService.updateDepartment(id, req.body);
        res.json({
            success: true,
            message: 'Department updated successfully.',
            data: department
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateDepartment = updateDepartment;
const deleteDepartment = async (req, res, next) => {
    try {
        const id = req.params.id;
        await departmentService.deleteDepartment(id);
        res.json({
            success: true,
            message: 'Department deactivated successfully.'
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteDepartment = deleteDepartment;
//# sourceMappingURL=department.controller.js.map