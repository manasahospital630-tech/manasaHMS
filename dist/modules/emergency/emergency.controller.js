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
exports.getActiveEmergencyPatients = exports.updateEmergencyOrderStatus = exports.getEmergencyOrders = exports.createEmergencyOrder = exports.updateEmergencyStatus = exports.getEmergencyVitalsHistory = exports.logEmergencyVitals = exports.saveDigitalConsent = exports.getEmergencyConsents = exports.generatePoliceIntimation = exports.admitEmergencyPatient = void 0;
const emergencyService = __importStar(require("./emergency.service"));
const emergency_schema_1 = require("./emergency.schema");
const admitEmergencyPatient = async (req, res, next) => {
    try {
        const input = emergency_schema_1.admitEmergencyPatientSchema.parse(req.body);
        const result = await emergencyService.admitEmergencyPatient(input);
        res.status(201).json({
            success: true,
            message: 'Emergency patient registered and medical care initiated.',
            data: result.emergencyRecord,
            policeNotice: result.policeNotice
        });
    }
    catch (error) {
        next(error);
    }
};
exports.admitEmergencyPatient = admitEmergencyPatient;
const generatePoliceIntimation = async (req, res, next) => {
    try {
        const { emergencyId, officerName, badgeNumber, policeStation } = req.body;
        const result = await emergencyService.generatePoliceIntimation(emergencyId, {
            officerName,
            badgeNumber,
            policeStation
        });
        res.status(200).json({
            success: true,
            message: result.message
        });
    }
    catch (error) {
        next(error);
    }
};
exports.generatePoliceIntimation = generatePoliceIntimation;
const getEmergencyConsents = async (req, res, next) => {
    try {
        const consents = await emergencyService.getEmergencyConsents(req.params.emergencyId);
        res.status(200).json({
            success: true,
            data: consents
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getEmergencyConsents = getEmergencyConsents;
const saveDigitalConsent = async (req, res, next) => {
    try {
        const input = emergency_schema_1.saveConsentSchema.parse(req.body);
        const consent = await emergencyService.saveDigitalConsent(input);
        res.status(201).json({
            success: true,
            data: consent
        });
    }
    catch (error) {
        next(error);
    }
};
exports.saveDigitalConsent = saveDigitalConsent;
const logEmergencyVitals = async (req, res, next) => {
    try {
        const input = emergency_schema_1.logVitalsSchema.parse(req.body);
        const log = await emergencyService.logEmergencyVitals(input);
        res.status(201).json({
            success: true,
            data: log
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logEmergencyVitals = logEmergencyVitals;
const getEmergencyVitalsHistory = async (req, res, next) => {
    try {
        const history = await emergencyService.getEmergencyVitalsHistory(req.params.emergencyId);
        res.status(200).json({
            success: true,
            data: history
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getEmergencyVitalsHistory = getEmergencyVitalsHistory;
const updateEmergencyStatus = async (req, res, next) => {
    try {
        const input = emergency_schema_1.updateEmergencyStatusSchema.parse(req.body);
        const record = await emergencyService.updateEmergencyStatus(input);
        res.status(200).json({
            success: true,
            data: record
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateEmergencyStatus = updateEmergencyStatus;
const createEmergencyOrder = async (req, res, next) => {
    try {
        const input = emergency_schema_1.createEmergencyOrderSchema.parse(req.body);
        const order = await emergencyService.createEmergencyOrder(input, req.identity.userId);
        res.status(201).json({
            success: true,
            data: order
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createEmergencyOrder = createEmergencyOrder;
const getEmergencyOrders = async (req, res, next) => {
    try {
        const orders = await emergencyService.getEmergencyOrders(req.params.emergencyId);
        res.status(200).json({
            success: true,
            data: orders
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getEmergencyOrders = getEmergencyOrders;
const updateEmergencyOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const order = await emergencyService.updateEmergencyOrderStatus(req.params.orderId, status);
        res.status(200).json({
            success: true,
            data: order
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateEmergencyOrderStatus = updateEmergencyOrderStatus;
const getActiveEmergencyPatients = async (req, res, next) => {
    try {
        const patients = await emergencyService.getActiveEmergencyPatients();
        res.status(200).json({
            success: true,
            data: patients
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getActiveEmergencyPatients = getActiveEmergencyPatients;
//# sourceMappingURL=emergency.controller.js.map