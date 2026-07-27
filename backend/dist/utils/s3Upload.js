"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndUploadQrCode = exports.uploadBase64Image = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uploadsBaseDir = path_1.default.join(process.cwd(), 'uploads');
const ensureDirectoryExists = (dirPath) => {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
    }
};
const uploadBase64Image = async (base64String, folderCategory = 'images', customFileName) => {
    if (!base64String) {
        throw new Error('No base64 string provided');
    }
    let contentType = 'image/png';
    let buffer;
    const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
        contentType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
    }
    else {
        buffer = Buffer.from(base64String.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    }
    const fileExt = contentType.split('/')[1] || 'png';
    const fileName = customFileName || `img-${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
    // Ensure category directory exists (e.g. uploads/images, uploads/qrcodes, uploads/documents)
    const categoryFolder = folderCategory === 'logos' ? 'images' : (folderCategory || 'images');
    const targetFolder = path_1.default.join(uploadsBaseDir, categoryFolder);
    ensureDirectoryExists(targetFolder);
    const filePath = path_1.default.join(targetFolder, fileName);
    await fs_1.default.promises.writeFile(filePath, buffer);
    // Return static URL path served by Express
    return `/uploads/${categoryFolder}/${fileName}`;
};
exports.uploadBase64Image = uploadBase64Image;
const generateAndUploadQrCode = async (textToEncode, itemId) => {
    try {
        let QRCode;
        try {
            QRCode = require('qrcode');
        }
        catch (e) {
            console.warn('qrcode module require warning:', e);
        }
        if (QRCode && typeof QRCode.toDataURL === 'function') {
            const dataUrl = await QRCode.toDataURL(textToEncode, {
                width: 300,
                margin: 1,
                color: {
                    dark: '#0f172a',
                    light: '#ffffff',
                },
            });
            const cleanId = (itemId || 'report').replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileName = `qr_${cleanId}.png`;
            return await (0, exports.uploadBase64Image)(dataUrl, 'qrcodes', fileName);
        }
    }
    catch (err) {
        console.error(`Error generating/uploading local QR code for ${itemId}:`, err);
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(textToEncode)}`;
};
exports.generateAndUploadQrCode = generateAndUploadQrCode;
//# sourceMappingURL=s3Upload.js.map