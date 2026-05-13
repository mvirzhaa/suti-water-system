import multer from 'multer';

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Tipe file tidak diizinkan. Gunakan PDF, JPG, atau PNG'));
};

/** Untuk upload nota barang masuk/keluar */
export const uploadNota = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter,
}).single('nota');

/** Untuk upload foto produk */
export const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Hanya gambar JPG/PNG yang diizinkan'));
  },
}).single('image');
