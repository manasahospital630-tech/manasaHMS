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
exports.deleteBed = exports.editBed = exports.addBed = exports.dischargePatient = exports.transferBed = exports.admitEmergencyFastTrack = exports.admitRoutine = exports.getActiveAdmissions = exports.getBeds = void 0;
const ip_schema_1 = require("./ip.schema");
const ipService = __importStar(require("./ip.service"));
const getBeds = async (req, res, next) => {
    try {
        const beds = await ipService.getBeds();
        res.json({ success: true, data: beds });
    }
    catch (error) {
        next(error);
    }
};
exports.getBeds = getBeds;
const getActiveAdmissions = async (req, res, next) => {
    try {
        const admissions = await ipService.getActiveAdmissions();
        res.json({ success: true, data: admissions });
    }
    catch (error) {
        next(error);
    }
};
exports.getActiveAdmissions = getActiveAdmissions;
const admitRoutine = async (req, res, next) => {
    try {
        const input = ip_schema_1.routineAdmissionSchema.parse(req.body);
        const admission = await ipService.admitRoutine(input);
        res.status(201).json({ success: true, data: admission });
    }
    catch (error) {
        next(error);
    }
};
exports.admitRoutine = admitRoutine;
const admitEmergencyFastTrack = async (req, res, next) => {
    try {
        const input = ip_schema_1.emergencyFastTrackSchema.parse(req.body);
        const result = await ipService.admitEmergencyFastTrack(input);
        res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.admitEmergencyFastTrack = admitEmergencyFastTrack;
const transferBed = async (req, res, next) => {
    try {
        const input = ip_schema_1.transferBedSchema.parse(req.body);
        const userId = req.user?.userId;
        const result = await ipService.transferBed(input, userId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.transferBed = transferBed;
const dischargePatient = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await ipService.dischargePatient(id);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.dischargePatient = dischargePatient;
// Bed Configuration Controllers
const addBed = async (req, res, next) => {
    try {
        const input = ip_schema_1.bedSchema.parse(req.body);
        const bed = await ipService.addBed(input);
        res.status(201).json({ success: true, data: bed });
    }
    catch (error) {
        next(error);
    }
};
exports.addBed = addBed;
const editBed = async (req, res, next) => {
    try {
        const id = req.params.id;
        const input = ip_schema_1.bedSchema.parse(req.body);
        const bed = await ipService.editBed(id, input);
        res.json({ success: true, data: bed });
    }
    catch (error) {
        next(error);
    }
};
exports.editBed = editBed;
const deleteBed = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await ipService.deleteBed(id);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteBed = deleteBed;
//# sourceMappingURL=ip.controller.js.map