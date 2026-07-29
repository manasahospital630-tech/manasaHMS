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
exports.getTimeline = exports.givePortalAccess = exports.update = exports.getById = exports.getAll = exports.create = void 0;
const responseHelper_1 = require("../../utils/responseHelper");
const patientService = __importStar(require("./patient.service"));
const create = async (req, res, next) => {
    try {
        const patient = await patientService.createPatient(req.body);
        (0, responseHelper_1.successResponse)(res, patient, 'Patient registered successfully.', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.create = create;
const getAll = async (req, res, next) => {
    try {
        const { search, limit, offset } = req.query;
        const result = await patientService.getPatients({
            search: search,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
        });
        (0, responseHelper_1.successResponse)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.getAll = getAll;
const getById = async (req, res, next) => {
    try {
        const patient = await patientService.getPatientById(req.params.id);
        (0, responseHelper_1.successResponse)(res, patient);
    }
    catch (error) {
        next(error);
    }
};
exports.getById = getById;
const update = async (req, res, next) => {
    try {
        const patient = await patientService.updatePatient(req.params.id, req.body);
        (0, responseHelper_1.successResponse)(res, patient, 'Patient updated successfully.');
    }
    catch (error) {
        next(error);
    }
};
exports.update = update;
const givePortalAccess = async (req, res, next) => {
    try {
        const result = await patientService.givePortalAccess(req.params.id);
        (0, responseHelper_1.successResponse)(res, result, 'Patient portal access granted successfully.', 200);
    }
    catch (error) {
        next(error);
    }
};
exports.givePortalAccess = givePortalAccess;
const getTimeline = async (req, res, next) => {
    try {
        const timeline = await patientService.getPatientFullTimeline(req.params.id);
        (0, responseHelper_1.successResponse)(res, timeline);
    }
    catch (error) {
        next(error);
    }
};
exports.getTimeline = getTimeline;
//# sourceMappingURL=patient.controller.js.map