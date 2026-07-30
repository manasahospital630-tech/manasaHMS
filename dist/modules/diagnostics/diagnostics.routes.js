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
const dController = __importStar(require("./diagnostics.controller"));
const authenticate_1 = require("../../middleware/authenticate");
const router = (0, express_1.Router)();
router.get('/reports/public/:itemId', dController.getPublicReport);
router.use(authenticate_1.authenticateJWT);
router.get('/dashboard/stats', dController.getDashboardStats);
router.get('/categories', dController.getCategories);
router.get('/services', dController.getServices);
router.post('/services', dController.addService);
router.put('/services/:id', dController.editService);
router.delete('/services/:id', dController.deleteService);
router.get('/packages', dController.getPackages);
router.post('/packages', dController.addPackage);
router.put('/packages/:id', dController.editPackage);
router.delete('/packages/:id', dController.deletePackage);
router.get('/orders', dController.getOrders);
router.post('/orders', dController.createOrder);
router.post('/orders/:id/pay', dController.payOrder);
router.post('/samples/collect', dController.collectSample);
router.post('/results/submit', dController.submitResult);
router.post('/results/verify', dController.verifyReport);
router.get('/machines', dController.getMachines);
router.post('/machines', dController.addMachine);
router.get('/referrals', dController.getReferrals);
router.post('/referrals', dController.addReferral);
router.get('/qc', dController.getQcLogs);
router.post('/qc', dController.addQcLog);
router.put('/orders/items/:itemId/status', dController.updateOrderItemStatus);
exports.default = router;
//# sourceMappingURL=diagnostics.routes.js.map