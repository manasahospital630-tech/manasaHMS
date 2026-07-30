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
exports.updateTeamRoles = exports.updateTeamMembers = exports.getTeamMembers = exports.deleteTeam = exports.updateTeam = exports.createTeam = exports.getTeams = exports.updateBusinessUnit = exports.createBusinessUnit = exports.getBusinessUnits = void 0;
const responseHelper_1 = require("../../utils/responseHelper");
const buService = __importStar(require("./businessUnits.service"));
const getBusinessUnits = async (req, res, next) => {
    try {
        const bus = await buService.getTeams();
        (0, responseHelper_1.successResponse)(res, bus);
    }
    catch (error) {
        next(error);
    }
};
exports.getBusinessUnits = getBusinessUnits;
const createBusinessUnit = async (req, res, next) => {
    try {
        const bu = await buService.createTeam(req.body);
        (0, responseHelper_1.successResponse)(res, bu, 'Team created successfully.', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createBusinessUnit = createBusinessUnit;
const updateBusinessUnit = async (req, res, next) => {
    try {
        const bu = await buService.updateTeam(req.params.id, req.body);
        (0, responseHelper_1.successResponse)(res, bu, 'Team updated successfully.');
    }
    catch (error) {
        next(error);
    }
};
exports.updateBusinessUnit = updateBusinessUnit;
const getTeams = async (req, res, next) => {
    try {
        const teams = await buService.getTeams();
        (0, responseHelper_1.successResponse)(res, teams);
    }
    catch (error) {
        next(error);
    }
};
exports.getTeams = getTeams;
const createTeam = async (req, res, next) => {
    try {
        const team = await buService.createTeam(req.body);
        (0, responseHelper_1.successResponse)(res, team, 'Team created successfully.', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createTeam = createTeam;
const updateTeam = async (req, res, next) => {
    try {
        const team = await buService.updateTeam(req.params.id, req.body);
        (0, responseHelper_1.successResponse)(res, team, 'Team updated successfully.');
    }
    catch (error) {
        next(error);
    }
};
exports.updateTeam = updateTeam;
const deleteTeam = async (req, res, next) => {
    try {
        const result = await buService.deleteTeam(req.params.id);
        (0, responseHelper_1.successResponse)(res, result, 'Team deleted successfully.');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTeam = deleteTeam;
const getTeamMembers = async (req, res, next) => {
    try {
        const members = await buService.getTeamMembers(req.params.id);
        (0, responseHelper_1.successResponse)(res, members);
    }
    catch (error) {
        next(error);
    }
};
exports.getTeamMembers = getTeamMembers;
const updateTeamMembers = async (req, res, next) => {
    try {
        const result = await buService.updateTeamMembers(req.params.id, req.body.memberUserIds || []);
        (0, responseHelper_1.successResponse)(res, result, 'Team members updated successfully.');
    }
    catch (error) {
        next(error);
    }
};
exports.updateTeamMembers = updateTeamMembers;
const updateTeamRoles = async (req, res, next) => {
    try {
        const result = await buService.updateTeamRoles(req.params.id, req.body.roles || []);
        (0, responseHelper_1.successResponse)(res, result, 'Team security roles updated successfully.');
    }
    catch (error) {
        next(error);
    }
};
exports.updateTeamRoles = updateTeamRoles;
//# sourceMappingURL=businessUnits.controller.js.map