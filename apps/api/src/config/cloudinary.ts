import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || 'DUMMY',
  api_key: process.env.CLOUDINARY_API_KEY || 'DUMMY',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'DUMMY',
});

/**
 * Storage untuk Foto Produk
 */
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'suti-water/products',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  } as any,
});

/**
 * Storage untuk Nota (Barang Masuk/Keluar)
 */
const notaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'suti-water/nota',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
  } as any,
});

export const uploadProductPhoto = multer({ storage: productStorage });
export const uploadNotaCloud = multer({ storage: notaStorage });

export default cloudinary;
