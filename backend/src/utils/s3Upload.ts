import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: process.env.SUPABASE_S3_ENDPOINT || 'https://ctrlsyhzszlufdnguerz.storage.supabase.co/storage/v1/s3',
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || 'c429c15eac92ed5649c4cc502219f481',
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || 'a6630d55c7dbf76585191afc00dcc30408ccef71e982f1d6b19e56aeaa947f9d',
  },
  forcePathStyle: true,
});

export const uploadBase64Image = async (base64String: string, bucketName: string = 'logos', customFileName?: string): Promise<string> => {
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
  const fileName = customFileName || `img-${Date.now()}.${fileExt}`;

  // Ensure bucket exists
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (err: any) {
    try {
      console.log(`Bucket ${bucketName} not found, attempting to create...`);
      await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
    } catch (createErr) {
      console.warn('Bucket creation warning (bucket may already exist):', createErr);
    }
  }

  // Upload object to S3
  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
  }));

  // Return public S3 URL
  const baseUrl = process.env.SUPABASE_URL || 'https://ctrlsyhzszlufdnguerz.supabase.co';
  return `${baseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
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
      return await uploadBase64Image(dataUrl, 'logos', fileName);
    }
  } catch (err) {
    console.error(`Error generating/uploading S3 QR code for ${itemId}:`, err);
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(textToEncode)}`;
};
