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
exports.recordTriageVitals = exports.checkReviewStatus = exports.createOPCheckIn = exports.updateStatus = exports.getById = exports.getAll = exports.create = void 0;
const responseHelper_1 = require("../../utils/responseHelper");
const appointmentService = __importStar(require("./appointment.service"));
const create = async (req, res, next) => {
    try {
        const appointment = await appointmentService.createAppointment(req.body);
        (0, responseHelper_1.successResponse)(res, appointment, 'Appointment created successfully.', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.create = create;
const getAll = async (req, res, next) => {
    try {
        const result = await appointmentService.getAppointments({
            doctorId: req.query.doctorId,
            status: req.query.status,
            date: req.query.date,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            offset: req.query.offset ? Number(req.query.offset) : undefined,
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
        const appointment = await appointmentService.getAppointmentById(req.params.id);
        (0, responseHelper_1.successResponse)(res, appointment);
    }
    catch (error) {
        next(error);
    }
};
exports.getById = getById;
const updateStatus = async (req, res, next) => {
    try {
        const appointment = await appointmentService.updateAppointmentStatus(req.params.id, req.body.status);
        (0, responseHelper_1.successResponse)(res, appointment, 'Appointment status updated.');
    }
    catch (error) {
        next(error);
    }
};
exports.updateStatus = updateStatus;
const createOPCheckIn = async (req, res, next) => {
    try {
        const result = await appointmentService.createOPCheckIn(req.body);
        (0, responseHelper_1.successResponse)(res, result, 'OPD Check-in successful.', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createOPCheckIn = createOPCheckIn;
const checkReviewStatus = async (req, res, next) => {
    try {
        const { patientId, doctorId } = req.query;
        if (!patientId || !doctorId) {
            res.status(400).json({ success: false, error: 'patientId and doctorId are required.' });
            return;
        }
        const result = await appointmentService.checkReviewStatus(patientId, doctorId);
        (0, responseHelper_1.successResponse)(res, result);
    }
    catch (error) {
        next(error);
    }
};
exports.checkReviewStatus = checkReviewStatus;
const recordTriageVitals = async (req, res, next) => {
    try {
        const appointmentId = req.params.id || req.body.appointmentId || req.body.bookingId;
        const result = await appointmentService.recordTriageVitals({
            ...req.body,
            appointmentId
        });
        (0, responseHelper_1.successResponse)(res, result, 'Vitals recorded successfully and synced to Patient Timeline.', 200);
    }
    catch (error) {
        next(error);
    }
};
exports.recordTriageVitals = recordTriageVitals;
//# sourceMappingURL=appointment.controller.js.map