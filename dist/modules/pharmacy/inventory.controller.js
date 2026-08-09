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
exports.getSalesHistory = exports.createSale = exports.getLowStock = exports.update = exports.bulkCreate = exports.create = exports.getById = exports.getAll = void 0;
const responseHelper_1 = require("../../utils/responseHelper");
const inventoryService = __importStar(require("./inventory.service"));
const getAll = async (req, res, next) => {
    try {
        const result = await inventoryService.getInventory({
            search: req.query.search,
            lowStock: req.query.lowStock === 'true',
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
        const item = await inventoryService.getInventoryItemById(req.params.id);
        (0, responseHelper_1.successResponse)(res, item);
    }
    catch (error) {
        next(error);
    }
};
exports.getById = getById;
const create = async (req, res, next) => {
    try {
        const item = await inventoryService.createInventoryItem(req.body);
        (0, responseHelper_1.successResponse)(res, item, 'Inventory item created.', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.create = create;
const bulkCreate = async (req, res, next) => {
    try {
        const items = Array.isArray(req.body) ? req.body : (req.body?.items || []);
        const result = await inventoryService.bulkCreateInventoryItems(items);
        (0, responseHelper_1.successResponse)(res, result, `${result.importedCount} inventory items imported successfully.`, 201);
    }
    catch (error) {
        next(error);
    }
};
exports.bulkCreate = bulkCreate;
const update = async (req, res, next) => {
    try {
        const item = await inventoryService.updateInventoryItem(req.params.id, req.body);
        (0, responseHelper_1.successResponse)(res, item, 'Inventory item updated.');
    }
    catch (error) {
        next(error);
    }
};
exports.update = update;
const getLowStock = async (req, res, next) => {
    try {
        const items = await inventoryService.getLowStockItems();
        (0, responseHelper_1.successResponse)(res, items);
    }
    catch (error) {
        next(error);
    }
};
exports.getLowStock = getLowStock;
const createSale = async (req, res, next) => {
    try {
        const invoice = await inventoryService.createSale(req.identity.userId, req.body);
        (0, responseHelper_1.successResponse)(res, invoice, 'Pharmacy sale recorded successfully.', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createSale = createSale;
const getSalesHistory = async (req, res, next) => {
    try {
        const history = await inventoryService.getSalesHistory();
        (0, responseHelper_1.successResponse)(res, history);
    }
    catch (error) {
        next(error);
    }
};
exports.getSalesHistory = getSalesHistory;
//# sourceMappingURL=inventory.controller.js.map