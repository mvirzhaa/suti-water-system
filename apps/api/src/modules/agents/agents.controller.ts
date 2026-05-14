import { Request, Response, NextFunction } from 'express';
import { AgentsService } from './agents.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { createAgentSchema, updateAgentSchema } from './agents.schema';

const agentsService = new AgentsService();

export class AgentsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const agents = await agentsService.getAll();
      ApiResponse.success(res, agents, 'Berhasil mengambil data agen');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const agent = await agentsService.getById(req.params.id as string);
      if (!agent) {
        return ApiResponse.error(res, 'Agen tidak ditemukan', 404);
      }
      ApiResponse.success(res, agent, 'Berhasil mengambil detail agen');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createAgentSchema.parse(req.body);
      const agent = await agentsService.create(req.user!.userId, validatedData);
      ApiResponse.success(res, agent, 'Agen berhasil ditambahkan', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateAgentSchema.parse(req.body);
      const agent = await agentsService.update(req.user!.userId, req.params.id as string, validatedData);
      ApiResponse.success(res, agent, 'Agen berhasil diperbarui');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await agentsService.delete(req.user!.userId, req.params.id as string);
      ApiResponse.success(res, null, 'Agen berhasil dihapus');
    } catch (error) {
      next(error);
    }
  }
}
