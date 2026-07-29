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
const encounterCtrl = __importStar(require("./encounter.controller"));
const diagnosisCtrl = __importStar(require("./diagnosis.controller"));
const validator_1 = require("../../middleware/validator");
const emr_schema_1 = require("./emr.schema");
const authenticate_1 = require("../../middleware/authenticate");
const rbacHandler_1 = require("../../middleware/rbacHandler");
const auditLogger_1 = require("../../middleware/auditLogger");
const router = (0, express_1.Router)();
router.post('/encounters', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Nurse', 'Admin']), (0, validator_1.validate)(emr_schema_1.createEncounterSchema), (0, auditLogger_1.auditLogger)('CREATE', 'Encounter'), encounterCtrl.create);
router.get('/patients/:patientId/encounters', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Nurse', 'Admin']), encounterCtrl.getPatientEncounters);
router.get('/encounters/ip-admission/:ipAdmissionId', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Nurse', 'Admin']), encounterCtrl.getByIpAdmissionId);
router.get('/encounters/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Nurse', 'Admin']), encounterCtrl.getById);
router.patch('/encounters/:id/vitals', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Nurse', 'Doctor', 'Admin']), (0, validator_1.validate)(emr_schema_1.updateVitalsSchema), (0, auditLogger_1.auditLogger)('UPDATE_VITALS', 'Encounter'), encounterCtrl.updateVitals);
router.patch('/encounters/:id/soap', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Admin']), (0, validator_1.validate)(emr_schema_1.updateSoapSchema), (0, auditLogger_1.auditLogger)('UPDATE_SOAP', 'Encounter'), encounterCtrl.updateSOAP);
router.post('/encounters/:id/diagnoses', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Admin']), (0, validator_1.validate)(emr_schema_1.addDiagnosisSchema), (0, auditLogger_1.auditLogger)('ADD_DIAGNOSIS', 'Diagnosis'), diagnosisCtrl.add);
router.get('/encounters/:id/diagnoses', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Nurse', 'Admin']), diagnosisCtrl.getForEncounter);
exports.default = router;
//# sourceMappingURL=encounter.routes.js.map