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
const inventoryCtrl = __importStar(require("./inventory.controller"));
const prescriptionCtrl = __importStar(require("./prescription.controller"));
const validator_1 = require("../../middleware/validator");
const pharmacy_schema_1 = require("./pharmacy.schema");
const authenticate_1 = require("../../middleware/authenticate");
const rbacHandler_1 = require("../../middleware/rbacHandler");
const auditLogger_1 = require("../../middleware/auditLogger");
const router = (0, express_1.Router)();
// Inventory
router.get('/inventory', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Pharmacist', 'Admin', 'Doctor']), inventoryCtrl.getAll);
router.get('/inventory/low-stock', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Pharmacist', 'Admin']), inventoryCtrl.getLowStock);
router.get('/inventory/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Pharmacist', 'Admin']), inventoryCtrl.getById);
router.post('/inventory', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Pharmacist', 'Admin']), (0, validator_1.validate)(pharmacy_schema_1.createInventoryItemSchema), (0, auditLogger_1.auditLogger)('CREATE', 'InventoryItem'), inventoryCtrl.create);
router.post('/inventory/bulk', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Pharmacist', 'Admin']), (0, auditLogger_1.auditLogger)('CREATE', 'InventoryBulk'), inventoryCtrl.bulkCreate);
router.put('/inventory/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Pharmacist', 'Admin']), (0, validator_1.validate)(pharmacy_schema_1.updateInventoryItemSchema), (0, auditLogger_1.auditLogger)('UPDATE', 'InventoryItem'), inventoryCtrl.update);
router.post('/sales', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Pharmacist', 'Admin']), (0, validator_1.validate)(pharmacy_schema_1.createSaleSchema), (0, auditLogger_1.auditLogger)('CREATE', 'Invoice'), inventoryCtrl.createSale);
router.get('/sales', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Pharmacist', 'Admin']), inventoryCtrl.getSalesHistory);
// Prescriptions
router.get('/prescriptions/pending', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Pharmacist', 'Admin']), prescriptionCtrl.getPending);
router.get('/prescriptions/:id', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Pharmacist', 'Doctor', 'Admin']), prescriptionCtrl.getById);
router.post('/prescriptions', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Doctor', 'Admin']), (0, validator_1.validate)(pharmacy_schema_1.createPrescriptionSchema), (0, auditLogger_1.auditLogger)('CREATE', 'Prescription'), prescriptionCtrl.create);
router.patch('/prescriptions/:id/dispense', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Pharmacist', 'Admin']), (0, auditLogger_1.auditLogger)('DISPENSE', 'Prescription'), prescriptionCtrl.dispense);
exports.default = router;
//# sourceMappingURL=pharmacy.routes.js.map