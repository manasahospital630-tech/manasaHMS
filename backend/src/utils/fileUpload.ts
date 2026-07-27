import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsBaseDir = path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    let folder = 'documents';
    if (file.mimetype.startsWith('image/')) {
      folder = 'images';
    }
    const targetDir = path.join(uploadsBaseDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max file size
});
