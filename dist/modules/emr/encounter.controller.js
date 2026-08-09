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
exports.getByIpAdmissionId = exports.updateSOAP = exports.updateVitals = exports.getById = exports.getPatientEncounters = exports.create = void 0;
const responseHelper_1 = require("../../utils/responseHelper");
const encounterService = __importStar(require("./encounter.service"));
const create = async (req, res, next) => {
    try {
        const encounter = await encounterService.createEncounter(req.identity.userId, req.body);
        (0, responseHelper_1.successResponse)(res, encounter, 'Encounter created successfully.', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.create = create;
const getPatientEncounters = async (req, res, next) => {
    try {
        const encounters = await encounterService.getPatientEncounters(req.params.patientId);
        (0, responseHelper_1.successResponse)(res, encounters);
    }
    catch (error) {
        next(error);
    }
};
exports.getPatientEncounters = getPatientEncounters;
const getById = async (req, res, next) => {
    try {
        const encounter = await encounterService.getEncounterById(req.params.id);
        (0, responseHelper_1.successResponse)(res, encounter);
    }
    catch (error) {
        next(error);
    }
};
exports.getById = getById;
const updateVitals = async (req, res, next) => {
    try {
        const encounter = await encounterService.updateEncounterVitals(req.params.id, req.body);
        (0, responseHelper_1.successResponse)(res, encounter, 'Vitals updated.');
    }
    catch (error) {
        next(error);
    }
};
exports.updateVitals = updateVitals;
const updateSOAP = async (req, res, next) => {
    try {
        const encounter = await encounterService.updateEncounterSOAP(req.params.id, req.body);
        (0, responseHelper_1.successResponse)(res, encounter, 'SOAP notes updated.');
    }
    catch (error) {
        next(error);
    }
};
exports.updateSOAP = updateSOAP;
const getByIpAdmissionId = async (req, res, next) => {
    try {
        const encounter = await encounterService.getEncounterByIpAdmissionId(req.params.ipAdmissionId);
        (0, responseHelper_1.successResponse)(res, encounter);
    }
    catch (error) {
        next(error);
    }
};
exports.getByIpAdmissionId = getByIpAdmissionId;
//# sourceMappingURL=encounter.controller.js.map