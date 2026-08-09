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
exports.getAnalytics = exports.updateStatus = exports.returnInvoice = exports.cancel = exports.recordPayment = exports.getPatientInvoices = exports.getById = exports.getAll = exports.create = void 0;
const responseHelper_1 = require("../../utils/responseHelper");
const invoiceService = __importStar(require("./invoice.service"));
const create = async (req, res, next) => {
    try {
        const invoice = await invoiceService.createInvoice(req.body);
        (0, responseHelper_1.successResponse)(res, invoice, 'Invoice created.', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.create = create;
const getAll = async (req, res, next) => {
    try {
        const result = await invoiceService.getAllInvoices({
            status: req.query.status,
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
        const invoice = await invoiceService.getInvoiceById(req.params.id);
        (0, responseHelper_1.successResponse)(res, invoice);
    }
    catch (error) {
        next(error);
    }
};
exports.getById = getById;
const getPatientInvoices = async (req, res, next) => {
    try {
        const invoices = await invoiceService.getPatientInvoices(req.params.patientId);
        (0, responseHelper_1.successResponse)(res, invoices);
    }
    catch (error) {
        next(error);
    }
};
exports.getPatientInvoices = getPatientInvoices;
const recordPayment = async (req, res, next) => {
    try {
        const invoice = await invoiceService.recordPayment(req.params.id, req.body);
        (0, responseHelper_1.successResponse)(res, invoice, 'Payment recorded.');
    }
    catch (error) {
        next(error);
    }
};
exports.recordPayment = recordPayment;
const cancel = async (req, res, next) => {
    try {
        const invoice = await invoiceService.cancelInvoice(req.params.id);
        (0, responseHelper_1.successResponse)(res, invoice, 'Invoice cancelled.');
    }
    catch (error) {
        next(error);
    }
};
exports.cancel = cancel;
const returnInvoice = async (req, res, next) => {
    try {
        const invoice = await invoiceService.returnInvoice(req.params.id);
        (0, responseHelper_1.successResponse)(res, invoice, 'Invoice returned.');
    }
    catch (error) {
        next(error);
    }
};
exports.returnInvoice = returnInvoice;
const updateStatus = async (req, res, next) => {
    try {
        const invoice = await invoiceService.updateInvoiceStatus(req.params.id, req.body.status, req.body.paymentMethod);
        (0, responseHelper_1.successResponse)(res, invoice, 'Invoice status updated.');
    }
    catch (error) {
        next(error);
    }
};
exports.updateStatus = updateStatus;
const getAnalytics = async (req, res, next) => {
    try {
        const analytics = await invoiceService.getBillingAnalytics({
            period: req.query.period,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
        });
        (0, responseHelper_1.successResponse)(res, analytics);
    }
    catch (error) {
        next(error);
    }
};
exports.getAnalytics = getAnalytics;
//# sourceMappingURL=invoice.controller.js.map