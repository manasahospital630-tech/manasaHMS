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
exports.getHospitalSettingsPublic = exports.getConsolidatedHospitalRevenue = exports.getDashboardStats = exports.updateHospitalSettings = exports.getHospitalSettings = exports.upsertDoctorProfile = exports.getDoctorProfiles = exports.getAuditLog = exports.deleteUser = exports.updateUser = exports.createUser = exports.getStaffProfile = exports.getUsers = void 0;
const responseHelper_1 = require("../../utils/responseHelper");
const adminService = __importStar(require("./admin.service"));
const getUsers = async (req, res, next) => {
    try {
        const result = await adminService.getAllUsers({
            search: req.query.search,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            offset: req.query.offset ? Number(req.query.offset) : undefined,
        });
        (0, responseHelper_1.successResponse)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
const getStaffProfile = async (req, res, next) => {
    try {
        const profile = await adminService.getStaffProfile(req.params.id);
        (0, responseHelper_1.successResponse)(res, profile);
    }
    catch (error) {
        next(error);
    }
};
exports.getStaffProfile = getStaffProfile;
const createUser = async (req, res, next) => {
    try {
        const user = await adminService.createUser(req.body);
        (0, responseHelper_1.successResponse)(res, user, 'User created.', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createUser = createUser;
const updateUser = async (req, res, next) => {
    try {
        const user = await adminService.updateUser(req.params.id, req.body);
        (0, responseHelper_1.successResponse)(res, user, 'User updated.');
    }
    catch (error) {
        next(error);
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res, next) => {
    try {
        const result = await adminService.deleteUser(req.params.id);
        (0, responseHelper_1.successResponse)(res, result, 'User deleted successfully.');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUser = deleteUser;
const getAuditLog = async (req, res, next) => {
    try {
        const logs = await adminService.getAuditLog({
            userId: req.query.userId,
            resourceType: req.query.resourceType,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            offset: req.query.offset ? Number(req.query.offset) : undefined,
        });
        (0, responseHelper_1.successResponse)(res, logs);
    }
    catch (error) {
        next(error);
    }
};
exports.getAuditLog = getAuditLog;
const getDoctorProfiles = async (req, res, next) => {
    try {
        const profiles = await adminService.getDoctorProfiles();
        (0, responseHelper_1.successResponse)(res, profiles);
    }
    catch (error) {
        next(error);
    }
};
exports.getDoctorProfiles = getDoctorProfiles;
const upsertDoctorProfile = async (req, res, next) => {
    try {
        const profile = await adminService.upsertDoctorProfile(req.body);
        (0, responseHelper_1.successResponse)(res, profile, 'Doctor profile updated.');
    }
    catch (error) {
        next(error);
    }
};
exports.upsertDoctorProfile = upsertDoctorProfile;
const getHospitalSettings = async (req, res, next) => {
    try {
        const settings = await adminService.getHospitalSettings();
        (0, responseHelper_1.successResponse)(res, settings);
    }
    catch (error) {
        next(error);
    }
};
exports.getHospitalSettings = getHospitalSettings;
const updateHospitalSettings = async (req, res, next) => {
    try {
        const settings = await adminService.updateHospitalSettings(req.body);
        (0, responseHelper_1.successResponse)(res, settings, 'Hospital settings updated.');
    }
    catch (error) {
        next(error);
    }
};
exports.updateHospitalSettings = updateHospitalSettings;
const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await adminService.getDashboardStats();
        (0, responseHelper_1.successResponse)(res, stats);
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
const getConsolidatedHospitalRevenue = async (req, res, next) => {
    try {
        const revenue = await adminService.getConsolidatedHospitalRevenue({
            period: (req.query.period || req.query.selectedTimeframe || req.query.timeframe),
            selectedTimeframe: (req.query.selectedTimeframe || req.query.period || req.query.timeframe),
            startDate: req.query.startDate,
            endDate: req.query.endDate,
        });
        (0, responseHelper_1.successResponse)(res, revenue);
    }
    catch (error) {
        next(error);
    }
};
exports.getConsolidatedHospitalRevenue = getConsolidatedHospitalRevenue;
const getHospitalSettingsPublic = async (req, res, next) => {
    try {
        const settings = await adminService.getHospitalSettings();
        const publicSettings = {
            hospital_name: settings.hospital_name,
            hospital_logo: settings.hospital_logo,
            logo_url: settings.hospital_logo,
            theme: settings.theme || 'dark',
            website: settings.website,
            hospital_address: settings.hospital_address,
            phone_number: settings.phone_number,
            email: settings.email,
            gstin: settings.gstin,
            license_info: settings.license_info
        };
        (0, responseHelper_1.successResponse)(res, publicSettings);
    }
    catch (error) {
        next(error);
    }
};
exports.getHospitalSettingsPublic = getHospitalSettingsPublic;
//# sourceMappingURL=admin.controller.js.map