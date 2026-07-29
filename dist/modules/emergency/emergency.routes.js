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
const emergencyCtrl = __importStar(require("./emergency.controller"));
const authenticate_1 = require("../../middleware/authenticate");
const rbacHandler_1 = require("../../middleware/rbacHandler");
const auditLogger_1 = require("../../middleware/auditLogger");
const router = (0, express_1.Router)();
// Admit an emergency patient
router.post('/admit', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Nurse', 'Admin', 'Receptionist', 'Incharge']), (0, auditLogger_1.auditLogger)('ADMIT_EMERGENCY', 'EmergencyPatient'), emergencyCtrl.admitEmergencyPatient);
// Submit police intimation details
router.post('/mlc-police-intimation', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Nurse', 'Admin', 'Incharge']), (0, auditLogger_1.auditLogger)('MLC_POLICE_INTIMATION', 'EmergencyPatient'), emergencyCtrl.generatePoliceIntimation);
// Fetch consents for an emergency record
router.get('/consents/:emergencyId', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Nurse', 'Admin', 'Incharge']), emergencyCtrl.getEmergencyConsents);
// Capture/sign digital consent
router.post('/consents/sign', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Nurse', 'Admin', 'Incharge']), (0, auditLogger_1.auditLogger)('SIGN_CONSENT', 'EmergencyPatient'), emergencyCtrl.saveDigitalConsent);
// Log vital signs
router.post('/vitals/log', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Nurse', 'Admin']), (0, auditLogger_1.auditLogger)('LOG_EMERGENCY_VITALS', 'EmergencyPatient'), emergencyCtrl.logEmergencyVitals);
// Fetch vitals history for an emergency record
router.get('/vitals/history/:emergencyId', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Nurse', 'Admin']), emergencyCtrl.getEmergencyVitalsHistory);
// Update patient status in ER
router.put('/status-update', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Nurse', 'Admin', 'Incharge']), (0, auditLogger_1.auditLogger)('UPDATE_EMERGENCY_STATUS', 'EmergencyPatient'), emergencyCtrl.updateEmergencyStatus);
// Create doctor emergency/STAT order
router.post('/orders', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Admin']), (0, auditLogger_1.auditLogger)('CREATE_EMERGENCY_ORDER', 'EmergencyPatient'), emergencyCtrl.createEmergencyOrder);
// Fetch emergency/STAT orders
router.get('/orders/:emergencyId', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Nurse', 'Admin']), emergencyCtrl.getEmergencyOrders);
// Update status of STAT order
router.patch('/orders/:orderId/status', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Nurse', 'Doctor', 'Admin']), (0, auditLogger_1.auditLogger)('UPDATE_EMERGENCY_ORDER_STATUS', 'EmergencyPatient'), emergencyCtrl.updateEmergencyOrderStatus);
// Fetch active emergency room patients list
router.get('/active-patients', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Nurse', 'Admin', 'Receptionist', 'Incharge']), emergencyCtrl.getActiveEmergencyPatients);
exports.default = router;
//# sourceMappingURL=emergency.routes.js.map