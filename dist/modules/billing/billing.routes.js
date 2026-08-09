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
const ctrl = __importStar(require("./invoice.controller"));
const validator_1 = require("../../middleware/validator");
const billing_schema_1 = require("./billing.schema");
const authenticate_1 = require("../../middleware/authenticate");
const rbacHandler_1 = require("../../middleware/rbacHandler");
const auditLogger_1 = require("../../middleware/auditLogger");
const router = (0, express_1.Router)();
router.get('/analytics', authenticate_1.authenticateJWT, ctrl.getAnalytics);
router.get('/dashboard-stats', authenticate_1.authenticateJWT, ctrl.getAnalytics);
router.post('/invoices', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Biller', 'Admin', 'Incharge']), (0, validator_1.validate)(billing_schema_1.createInvoiceSchema), (0, auditLogger_1.auditLogger)('CREATE', 'Invoice'), ctrl.create);
router.get('/invoices', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Biller', 'Admin', 'Incharge']), ctrl.getAll);
router.get('/invoices/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Biller', 'Admin', 'Patient', 'Pharmacist', 'Incharge']), ctrl.getById);
router.get('/patients/:patientId/invoices', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Biller', 'Admin', 'Patient', 'Doctor', 'Incharge']), ctrl.getPatientInvoices);
router.patch('/invoices/:id/payment', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Biller', 'Admin', 'Incharge']), (0, validator_1.validate)(billing_schema_1.recordPaymentSchema), (0, auditLogger_1.auditLogger)('PAYMENT', 'Invoice'), ctrl.recordPayment);
router.post('/invoices/:id/payment', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Biller', 'Admin', 'Incharge']), (0, validator_1.validate)(billing_schema_1.recordPaymentSchema), (0, auditLogger_1.auditLogger)('PAYMENT', 'Invoice'), ctrl.recordPayment);
router.post('/invoices/:id/payments', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Biller', 'Admin', 'Incharge']), (0, validator_1.validate)(billing_schema_1.recordPaymentSchema), (0, auditLogger_1.auditLogger)('PAYMENT', 'Invoice'), ctrl.recordPayment);
router.post('/invoices/:id/cancel', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Biller', 'Admin', 'Incharge']), (0, auditLogger_1.auditLogger)('CANCEL', 'Invoice'), ctrl.cancel);
router.post('/invoices/:id/return', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Biller', 'Admin', 'Incharge']), (0, auditLogger_1.auditLogger)('RETURN', 'Invoice'), ctrl.returnInvoice);
router.post('/invoices/:id/update-status', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Biller', 'Admin', 'Incharge']), (0, auditLogger_1.auditLogger)('UPDATE_STATUS', 'Invoice'), ctrl.updateStatus);
exports.default = router;
//# sourceMappingURL=billing.routes.js.map