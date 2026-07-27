import fs from 'fs';
import path from 'path';

const uploadsBaseDir = path.join(process.cwd(), 'uploads');

const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const uploadBase64Image = async (
  base64String: string,
  folderCategory: string = 'images',
  customFileName?: string
): Promise<string> => {
  if (!base64String) {
    throw new Error('No base64 string provided');
  }

  let contentType = 'image/png';
  let buffer: Buffer;

  const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    contentType = matches[1];
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    buffer = Buffer.from(base64String.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
  }

  const fileExt = contentType.split('/')[1] || 'png';
  const fileName = customFileName || `img-${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;

  // Ensure category directory exists (e.g. uploads/images, uploads/qrcodes, uploads/documents)
  const categoryFolder = folderCategory === 'logos' ? 'images' : (folderCategory || 'images');
  const targetFolder = path.join(uploadsBaseDir, categoryFolder);
  ensureDirectoryExists(targetFolder);

  const filePath = path.join(targetFolder, fileName);
  await fs.promises.writeFile(filePath, buffer);

  // Return static URL path served by Express
  return `/uploads/${categoryFolder}/${fileName}`;
};

export const generateAndUploadQrCode = async (textToEncode: string, itemId: string): Promise<string> => {
  try {
    let QRCode: any;
    try {
      QRCode = require('qrcode');
    } catch (e) {
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
      return await uploadBase64Image(dataUrl, 'qrcodes', fileName);
    }
  } catch (err) {
    console.error(`Error generating/uploading local QR code for ${itemId}:`, err);
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(textToEncode)}`;
};
