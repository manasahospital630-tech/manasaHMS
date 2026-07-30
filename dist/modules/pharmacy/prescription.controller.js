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
exports.dispense = exports.getById = exports.getPending = exports.create = void 0;
const responseHelper_1 = require("../../utils/responseHelper");
const prescriptionService = __importStar(require("./prescription.service"));
const create = async (req, res, next) => {
    try {
        const rx = await prescriptionService.createPrescription(req.identity.userId, req.body);
        (0, responseHelper_1.successResponse)(res, rx, 'Prescription created.', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.create = create;
const getPending = async (req, res, next) => {
    try {
        const prescriptions = await prescriptionService.getPendingPrescriptions();
        (0, responseHelper_1.successResponse)(res, prescriptions);
    }
    catch (error) {
        next(error);
    }
};
exports.getPending = getPending;
const getById = async (req, res, next) => {
    try {
        const rx = await prescriptionService.getPrescriptionById(req.params.id);
        (0, responseHelper_1.successResponse)(res, rx);
    }
    catch (error) {
        next(error);
    }
};
exports.getById = getById;
const dispense = async (req, res, next) => {
    try {
        const rx = await prescriptionService.dispensePrescription(req.params.id, req.identity.userId);
        (0, responseHelper_1.successResponse)(res, rx, 'Prescription dispensed successfully.');
    }
    catch (error) {
        next(error);
    }
};
exports.dispense = dispense;
//# sourceMappingURL=prescription.controller.js.map