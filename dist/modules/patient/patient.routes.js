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
const patientController = __importStar(require("./patient.controller"));
const validator_1 = require("../../middleware/validator");
const patient_schema_1 = require("./patient.schema");
const authenticate_1 = require("../../middleware/authenticate");
const rbacHandler_1 = require("../../middleware/rbacHandler");
const auditLogger_1 = require("../../middleware/auditLogger");
const router = (0, express_1.Router)();
router.post('/', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Admin']), (0, validator_1.validate)(patient_schema_1.createPatientSchema), (0, auditLogger_1.auditLogger)('CREATE', 'Patient'), patientController.create);
router.get('/', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Doctor', 'Nurse', 'Admin', 'Biller', 'Pharmacist']), patientController.getAll);
router.get('/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Doctor', 'Nurse', 'Admin', 'Biller', 'Pharmacist']), patientController.getById);
router.get('/:id/timeline', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Doctor', 'Nurse', 'Admin', 'Biller', 'Pharmacist', 'Patient']), patientController.getTimeline);
router.put('/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Admin']), (0, validator_1.validate)(patient_schema_1.updatePatientSchema), (0, auditLogger_1.auditLogger)('UPDATE', 'Patient'), patientController.update);
router.post('/:id/portal-access', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Admin', 'Biller']), (0, auditLogger_1.auditLogger)('CREATE', 'PatientPortalAccess'), patientController.givePortalAccess);
exports.default = router;
//# sourceMappingURL=patient.routes.js.map