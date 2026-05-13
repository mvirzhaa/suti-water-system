import { Router } from 'express';
import { getProducts, createProduct, deleteProduct } from './products.controller';

const router = Router();

router.get('/', getProducts);

// Hanya Pimpinan & Super Admin yang bisa membuat produk
router.post('/', /* verifyJWT, checkRole(['PIMPINAN', 'SUPER_ADMIN']), */ createProduct);

// Hanya Super Admin yang bisa menghapus produk
router.delete('/:id', /* verifyJWT, checkRole(['SUPER_ADMIN']), */ deleteProduct);

export default router;