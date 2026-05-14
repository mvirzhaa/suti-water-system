import prisma from '../../config/database';
import { CreateAgentDto, UpdateAgentDto } from './agents.schema';
import { createAuditLog } from '../../utils/auditLog';

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

  async create(userId: string, data: CreateAgentDto) {
    return await prisma.$transaction(async (tx) => {
      const agent = await tx.agent.create({ data });
      
      await createAuditLog({
        userId,
        action: 'CREATE',
        entity: 'AGENT',
        entityId: agent.id,
        newValue: data
      });

      return agent;
    });
  }

  async update(userId: string, id: string, data: UpdateAgentDto) {
    return await prisma.$transaction(async (tx) => {
      const oldAgent = await tx.agent.findUnique({ where: { id } });
      const agent = await tx.agent.update({
        where: { id },
        data
      });
      
      await createAuditLog({
        userId,
        action: 'UPDATE',
        entity: 'AGENT',
        entityId: agent.id,
        oldValue: oldAgent || undefined,
        newValue: data
      });

      return agent;
    });
  }

  async delete(userId: string, id: string) {
    return await prisma.$transaction(async (tx) => {
      const oldAgent = await tx.agent.findUnique({ where: { id } });
      const agent = await tx.agent.delete({
        where: { id }
      });
      
      await createAuditLog({
        userId,
        action: 'DELETE',
        entity: 'AGENT',
        entityId: agent.id,
        oldValue: oldAgent || undefined
      });

      return agent;
    });
  }
}
