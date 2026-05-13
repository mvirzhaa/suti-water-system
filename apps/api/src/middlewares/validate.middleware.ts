import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';
import { ApiError } from '../utils/ApiError';

type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Middleware factory: Validasi request menggunakan Zod schema
 *
 * Contoh penggunaan:
 *   router.post('/login', validate(loginSchema), controller.login)
 *   router.get('/stock-in', validate(paginationSchema, 'query'), controller.list)
 */
export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = (result.error as ZodError).issues.map((e: ZodIssue) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      return next(
        new ApiError(400, 'Validasi gagal, periksa kembali input Anda', 'VALIDATION_ERROR')
      );
    }

    // Replace dengan data yang sudah diparse/transform oleh Zod
    req[target] = result.data;
    next();
  };
}
