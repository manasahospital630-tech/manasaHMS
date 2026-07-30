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
const express_1 = require("express");
const ctrl = __importStar(require("./admin.controller"));
const validator_1 = require("../../middleware/validator");
const admin_schema_1 = require("./admin.schema");
const authenticate_1 = require("../../middleware/authenticate");
const rbacHandler_1 = require("../../middleware/rbacHandler");
const auditLogger_1 = require("../../middleware/auditLogger");
const buCtrl = __importStar(require("./businessUnits.controller"));
const router = (0, express_1.Router)();
// Business Units & Teams Architecture (MS CRM Architecture Alignment)
router.get('/v1/business-units', authenticate_1.authenticateJWT, buCtrl.getBusinessUnits);
router.get('/business-units', authenticate_1.authenticateJWT, buCtrl.getBusinessUnits);
router.post('/v1/business-units', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('CREATE', 'BusinessUnit'), buCtrl.createBusinessUnit);
router.post('/business-units', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('CREATE', 'BusinessUnit'), buCtrl.createBusinessUnit);
router.put('/v1/business-units/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('UPDATE', 'BusinessUnit'), buCtrl.updateBusinessUnit);
router.put('/business-units/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('UPDATE', 'BusinessUnit'), buCtrl.updateBusinessUnit);
router.get('/v1/teams', authenticate_1.authenticateJWT, buCtrl.getTeams);
router.get('/teams', authenticate_1.authenticateJWT, buCtrl.getTeams);
router.post('/v1/teams', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('CREATE', 'Team'), buCtrl.createTeam);
router.post('/teams', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('CREATE', 'Team'), buCtrl.createTeam);
router.put('/v1/teams/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('UPDATE', 'Team'), buCtrl.updateTeam);
router.put('/teams/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('UPDATE', 'Team'), buCtrl.updateTeam);
router.delete('/v1/teams/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('DELETE', 'Team'), buCtrl.deleteTeam);
router.delete('/teams/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('DELETE', 'Team'), buCtrl.deleteTeam);
router.get('/v1/teams/:id/members', authenticate_1.authenticateJWT, buCtrl.getTeamMembers);
router.get('/teams/:id/members', authenticate_1.authenticateJWT, buCtrl.getTeamMembers);
router.post('/v1/teams/:id/members', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('UPDATE', 'TeamMembers'), buCtrl.updateTeamMembers);
router.post('/teams/:id/members', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('UPDATE', 'TeamMembers'), buCtrl.updateTeamMembers);
router.post('/v1/teams/:id/roles', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('UPDATE', 'TeamRoles'), buCtrl.updateTeamRoles);
router.post('/teams/:id/roles', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('UPDATE', 'TeamRoles'), buCtrl.updateTeamRoles);
router.get('/users', authenticate_1.authenticateJWT, ctrl.getUsers);
router.get('/users/:id/profile', authenticate_1.authenticateJWT, ctrl.getStaffProfile);
router.get('/staff/profile/:id', authenticate_1.authenticateJWT, ctrl.getStaffProfile);
router.post('/users', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, validator_1.validate)(admin_schema_1.createUserSchema), (0, auditLogger_1.auditLogger)('CREATE', 'User'), ctrl.createUser);
router.patch('/users/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, validator_1.validate)(admin_schema_1.updateUserSchema), (0, auditLogger_1.auditLogger)('UPDATE', 'User'), ctrl.updateUser);
router.delete('/users/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('DELETE', 'User'), ctrl.deleteUser);
router.get('/audit-log', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), ctrl.getAuditLog);
router.get('/dashboard-stats', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin', 'Management']), ctrl.getDashboardStats);
router.get('/consolidated-revenue', authenticate_1.authenticateJWT, ctrl.getConsolidatedHospitalRevenue);
router.get('/v1/consolidated-revenue', authenticate_1.authenticateJWT, ctrl.getConsolidatedHospitalRevenue);
router.get('/analytics/dashboard', authenticate_1.authenticateJWT, ctrl.getConsolidatedHospitalRevenue);
router.get('/v1/analytics/dashboard', authenticate_1.authenticateJWT, ctrl.getConsolidatedHospitalRevenue);
router.get('/analytics/consolidated-revenue', authenticate_1.authenticateJWT, ctrl.getConsolidatedHospitalRevenue);
router.get('/v1/analytics/consolidated-revenue', authenticate_1.authenticateJWT, ctrl.getConsolidatedHospitalRevenue);
router.get('/doctor-profiles', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin', 'Biller']), ctrl.getDoctorProfiles);
router.post('/doctor-profiles', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin', 'Biller']), (0, validator_1.validate)(admin_schema_1.upsertDoctorProfileSchema), (0, auditLogger_1.auditLogger)('UPDATE', 'DoctorProfile'), ctrl.upsertDoctorProfile);
router.get('/hospital-settings/public', ctrl.getHospitalSettingsPublic);
router.get('/hospital-settings', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin', 'Receptionist', 'Biller', 'Pharmacist']), ctrl.getHospitalSettings);
router.put('/hospital-settings', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('UPDATE', 'HospitalSettings'), ctrl.updateHospitalSettings);
const rbacCtrl = __importStar(require("./rbac.controller"));
router.get('/modules', authenticate_1.authenticateJWT, rbacCtrl.getModulesMaster);
router.get('/roles', authenticate_1.authenticateJWT, rbacCtrl.getRoles);
router.get('/roles/:id', authenticate_1.authenticateJWT, rbacCtrl.getRoleById);
router.post('/roles', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('CREATE', 'SecurityRole'), rbacCtrl.createRole);
router.put('/roles/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('UPDATE', 'SecurityRole'), rbacCtrl.updateRole);
router.delete('/roles/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, auditLogger_1.auditLogger)('DELETE', 'SecurityRole'), rbacCtrl.deleteRole);
// Route registrations completed
exports.default = router;
//# sourceMappingURL=admin.routes.js.map