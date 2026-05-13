import { Response } from 'express';

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Helper untuk format response API yang konsisten
 * sesuai spesifikasi Suti Water System
 */
export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'Berhasil',
    statusCode = 200,
    meta?: Meta
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      ...(meta && { meta }),
    });
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    code?: string,
    errors?: Array<{ field: string; message: string }>
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(code && { code }),
      ...(errors && errors.length > 0 && { errors }),
    });
  }

  static created<T>(res: Response, data: T, message = 'Data berhasil dibuat'): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}
