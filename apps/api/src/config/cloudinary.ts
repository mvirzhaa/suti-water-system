import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || 'DUMMY',
  api_key: process.env.CLOUDINARY_API_KEY || 'DUMMY',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'DUMMY',
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

const notaFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Tipe file tidak diizinkan. Gunakan PDF, JPG, atau PNG'));
};

const photoFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Hanya gambar JPG/PNG yang diizinkan'));
};

export const uploadProductPhoto = multer({
  storage: productStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: photoFileFilter,
});

export const uploadNotaCloud = multer({
  storage: notaStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: notaFileFilter,
});

export default cloudinary;
