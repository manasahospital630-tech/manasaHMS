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
exports.getPublicReport = exports.updateOrderItemStatus = exports.addQcLog = exports.getQcLogs = exports.addReferral = exports.getReferrals = exports.addMachine = exports.getMachines = exports.verifyReport = exports.submitResult = exports.collectSample = exports.payOrder = exports.createOrder = exports.getOrders = exports.deletePackage = exports.editPackage = exports.addPackage = exports.getPackages = exports.deleteService = exports.editService = exports.addService = exports.getServices = exports.getCategories = exports.getDashboardStats = void 0;
const dService = __importStar(require("./diagnostics.service"));
const schemas = __importStar(require("./diagnostics.schema"));
const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await dService.getDashboardStats();
        res.json({ success: true, data: stats });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
const getCategories = async (req, res, next) => {
    try {
        const categories = await dService.getCategories();
        res.json({ success: true, data: categories });
    }
    catch (error) {
        next(error);
    }
};
exports.getCategories = getCategories;
const getServices = async (req, res, next) => {
    try {
        const services = await dService.getServices();
        res.json({ success: true, data: services });
    }
    catch (error) {
        next(error);
    }
};
exports.getServices = getServices;
const addService = async (req, res, next) => {
    try {
        const input = schemas.serviceSchema.parse(req.body);
        const service = await dService.addService(input);
        res.status(201).json({ success: true, data: service });
    }
    catch (error) {
        next(error);
    }
};
exports.addService = addService;
const editService = async (req, res, next) => {
    try {
        const id = req.params.id;
        const input = schemas.serviceSchema.parse(req.body);
        const service = await dService.editService(id, input);
        res.json({ success: true, data: service });
    }
    catch (error) {
        next(error);
    }
};
exports.editService = editService;
const deleteService = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await dService.deleteService(id);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.deleteService = deleteService;
const getPackages = async (req, res, next) => {
    try {
        const packages = await dService.getPackages();
        res.json({ success: true, data: packages });
    }
    catch (error) {
        next(error);
    }
};
exports.getPackages = getPackages;
const addPackage = async (req, res, next) => {
    try {
        const input = schemas.packageSchema.parse(req.body);
        const pkg = await dService.addPackage(input);
        res.status(201).json({ success: true, data: pkg });
    }
    catch (error) {
        next(error);
    }
};
exports.addPackage = addPackage;
const editPackage = async (req, res, next) => {
    try {
        const id = req.params.id;
        const input = schemas.packageSchema.parse(req.body);
        const result = await dService.editPackage(id, input);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.editPackage = editPackage;
const deletePackage = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await dService.deletePackage(id);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.deletePackage = deletePackage;
const getOrders = async (req, res, next) => {
    try {
        const orders = await dService.getOrders();
        res.json({ success: true, data: orders });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrders = getOrders;
const createOrder = async (req, res, next) => {
    try {
        const input = schemas.orderSchema.parse(req.body);
        const order = await dService.createOrder(input);
        res.status(201).json({ success: true, data: order });
    }
    catch (error) {
        next(error);
    }
};
exports.createOrder = createOrder;
const payOrder = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await dService.payOrder(id);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.payOrder = payOrder;
const collectSample = async (req, res, next) => {
    try {
        const input = schemas.sampleCollectionSchema.parse(req.body);
        const userId = req.user?.userId;
        const collection = await dService.collectSample(input, userId);
        res.status(201).json({ success: true, data: collection });
    }
    catch (error) {
        next(error);
    }
};
exports.collectSample = collectSample;
const submitResult = async (req, res, next) => {
    try {
        const type = req.query.type; // 'lab', 'radiology', 'ultrasound', 'ecg'
        const userId = req.user?.userId;
        let result;
        if (type === 'lab') {
            const input = schemas.labResultSchema.parse(req.body);
            result = await dService.submitLabResult(input, userId);
        }
        else if (type === 'radiology') {
            const input = schemas.radiologyReportSchema.parse(req.body);
            result = await dService.submitRadiologyReport(input, userId);
        }
        else if (type === 'ultrasound') {
            const input = schemas.ultrasoundReportSchema.parse(req.body);
            result = await dService.submitUltrasoundReport(input, userId);
        }
        else if (type === 'ecg') {
            const input = schemas.ecgReportSchema.parse(req.body);
            result = await dService.submitEcgReport(input, userId);
        }
        else {
            throw new Error('Invalid diagnostic result category type');
        }
        res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.submitResult = submitResult;
const verifyReport = async (req, res, next) => {
    try {
        const input = schemas.reportVerificationSchema.parse(req.body);
        const userId = req.user?.userId;
        const verification = await dService.verifyReport(input, userId);
        res.status(201).json({ success: true, data: verification });
    }
    catch (error) {
        next(error);
    }
};
exports.verifyReport = verifyReport;
const getMachines = async (req, res, next) => {
    try {
        const machines = await dService.getMachines();
        res.json({ success: true, data: machines });
    }
    catch (error) {
        next(error);
    }
};
exports.getMachines = getMachines;
const addMachine = async (req, res, next) => {
    try {
        const input = schemas.machineSchema.parse(req.body);
        const machine = await dService.addMachine(input);
        res.status(201).json({ success: true, data: machine });
    }
    catch (error) {
        next(error);
    }
};
exports.addMachine = addMachine;
const getReferrals = async (req, res, next) => {
    try {
        const referrals = await dService.getReferrals();
        res.json({ success: true, data: referrals });
    }
    catch (error) {
        next(error);
    }
};
exports.getReferrals = getReferrals;
const addReferral = async (req, res, next) => {
    try {
        const input = schemas.referralDoctorSchema.parse(req.body);
        const referral = await dService.addReferral(input);
        res.status(201).json({ success: true, data: referral });
    }
    catch (error) {
        next(error);
    }
};
exports.addReferral = addReferral;
const getQcLogs = async (req, res, next) => {
    try {
        const logs = await dService.getQcLogs();
        res.json({ success: true, data: logs });
    }
    catch (error) {
        next(error);
    }
};
exports.getQcLogs = getQcLogs;
const addQcLog = async (req, res, next) => {
    try {
        const input = schemas.qcLogSchema.parse(req.body);
        const userId = req.user?.userId;
        const log = await dService.addQcLog(input, userId);
        res.status(201).json({ success: true, data: log });
    }
    catch (error) {
        next(error);
    }
};
exports.addQcLog = addQcLog;
const updateOrderItemStatus = async (req, res, next) => {
    try {
        const itemId = req.params.itemId;
        const { status } = req.body;
        const result = await dService.updateOrderItemStatus(itemId, status);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.updateOrderItemStatus = updateOrderItemStatus;
const getPublicReport = async (req, res, next) => {
    try {
        const itemId = req.params.itemId;
        const report = await dService.getPublicReport(itemId);
        if (!report) {
            return res.status(404).json({ success: false, error: 'Report not found or not finalized.' });
        }
        return res.json({ success: true, data: report });
    }
    catch (error) {
        next(error);
        return;
    }
};
exports.getPublicReport = getPublicReport;
//# sourceMappingURL=diagnostics.controller.js.map