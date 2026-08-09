"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const opdAnalytics_controller_1 = require("./opdAnalytics.controller");
const authenticate_1 = require("../../middleware/authenticate");
const rbacHandler_1 = require("../../middleware/rbacHandler");
const router = (0, express_1.Router)();
router.get('/kpi-summary', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Doctor', 'Nurse', 'Admin', 'Biller']), opdAnalytics_controller_1.getOpdKpiSummary);
router.get('/growth-chart', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Doctor', 'Nurse', 'Admin', 'Biller']), opdAnalytics_controller_1.getOpdGrowthChart);
router.get('/records', authenticate_1.authenticateJWT, (0, rbacHandler_1.enforceRBAC)(['Receptionist', 'Doctor', 'Nurse', 'Admin', 'Biller']), opdAnalytics_controller_1.getFilteredOpdRecords);
exports.default = router;
//# sourceMappingURL=opdAnalytics.routes.js.map