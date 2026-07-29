"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadsBaseDir = path_1.default.join(process.cwd(), 'uploads');
const storage = multer_1.default.diskStorage({
    destination: (_req, file, cb) => {
        let folder = 'documents';
        if (file.mimetype.startsWith('image/')) {
            folder = 'images';
        }
        const targetDir = path_1.default.join(uploadsBaseDir, folder);
        if (!fs_1.default.existsSync(targetDir)) {
            fs_1.default.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB max file size
});
//# sourceMappingURL=fileUpload.js.map