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
const ctrl = __importStar(require("./appointment.controller"));
const validator_1 = require("../../middleware/validator");
const appointment_schema_1 = require("./appointment.schema");
const authenticate_1 = require("../../middleware/authenticate");
const rbacHandler_1 = require("../../middleware/rbacHandler");
const auditLogger_1 = require("../../middleware/auditLogger");
const router = (0, express_1.Router)();
router.post('/', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Admin', 'Patient']), (0, validator_1.validate)(appointment_schema_1.createAppointmentSchema), (0, auditLogger_1.auditLogger)('CREATE', 'Appointment'), ctrl.create);
router.get('/', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Doctor', 'Nurse', 'Admin']), ctrl.getAll);
router.get('/check-review', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Admin', 'Biller']), ctrl.checkReviewStatus);
router.post('/op-checkin', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Admin', 'Biller']), (0, validator_1.validate)(appointment_schema_1.createOPCheckInSchema), (0, auditLogger_1.auditLogger)('CREATE', 'OPCheckIn'), ctrl.createOPCheckIn);
router.post('/record-vitals', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Doctor', 'Nurse', 'Admin']), ctrl.recordTriageVitals);
router.post('/:id/vitals', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Doctor', 'Nurse', 'Admin']), ctrl.recordTriageVitals);
router.get('/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Doctor', 'Nurse', 'Admin']), ctrl.getById);
router.patch('/:id/status', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Doctor', 'Nurse', 'Admin']), (0, validator_1.validate)(appointment_schema_1.updateAppointmentStatusSchema), (0, auditLogger_1.auditLogger)('STATUS_UPDATE', 'Appointment'), ctrl.updateStatus);
router.put('/update-status', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Doctor', 'Nurse', 'Admin']), ctrl.updateStatus);
exports.default = router;
//# sourceMappingURL=appointment.routes.js.map