import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { createUserSchema, updateUserSchema } from './users.schema';

const usersService = new UsersService();

export class UsersController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await usersService.getAll();
      ApiResponse.success(res, users, 'Berhasil mengambil data pengguna');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getById(req.params.id as string);
      if (!user) {
        return ApiResponse.error(res, 'Pengguna tidak ditemukan', 404);
      }
      ApiResponse.success(res, user, 'Berhasil mengambil detail pengguna');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const user = await usersService.create(req.user!.userId, validatedData);
      ApiResponse.success(res, user, 'Pengguna berhasil ditambahkan', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateUserSchema.parse(req.body);
      const user = await usersService.update(req.user!.userId, req.params.id as string, validatedData);
      ApiResponse.success(res, user, 'Pengguna berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await usersService.delete(req.user!.userId, req.params.id as string);
      ApiResponse.success(res, null, 'Pengguna berhasil dihapus');
    } catch (error) {
      next(error);
    }
  }
}
