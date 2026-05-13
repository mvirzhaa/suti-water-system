import prisma from '../../config/database';
import { CreateAgentDto, UpdateAgentDto } from './agents.schema';

export class AgentsService {
  async getAll() {
    return prisma.agent.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(id: string) {
    return prisma.agent.findUnique({
      where: { id }
    });
  }

  async create(data: CreateAgentDto) {
    return prisma.agent.create({
      data
    });
  }

  async update(id: string, data: UpdateAgentDto) {
    return prisma.agent.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.agent.delete({
      where: { id }
    });
  }
}
