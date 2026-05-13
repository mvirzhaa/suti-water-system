/**
 * Custom API Error class
 * Digunakan di seluruh aplikasi untuk throw error yang konsisten
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, code = 'BAD_REQUEST') {
    return new ApiError(400, message, code);
  }

  static unauthorized(message = 'Autentikasi diperlukan', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Akses ditolak', code = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }

  static notFound(message: string, code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code = 'CONFLICT') {
    return new ApiError(409, message, code);
  }

  static unprocessable(message: string, code = 'UNPROCESSABLE') {
    return new ApiError(422, message, code);
  }

  static tooManyRequests(message = 'Terlalu banyak percobaan, coba lagi nanti', code = 'RATE_LIMIT_EXCEEDED') {
    return new ApiError(429, message, code);
  }

  static internal(message = 'Terjadi kesalahan server', code = 'INTERNAL_ERROR') {
    return new ApiError(500, message, code, false);
  }
}
