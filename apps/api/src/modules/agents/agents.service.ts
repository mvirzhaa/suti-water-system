import prisma from '../../config/database';
import { CreateAgentDto, UpdateAgentDto } from './agents.schema';
import { createAuditLog } from '../../utils/auditLog';

export class AgentsService {
  async getAll() {
    return prisma.agent.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getById(id: string) {
    return prisma.agent.findUnique({ where: { id } });
  }

  async create(userId: string, data: CreateAgentDto) {
    const agent = await prisma.agent.create({ data });

    createAuditLog({ userId, action: 'CREATE', entity: 'AGENT', entityId: agent.id, newValue: data });

    return agent;
  }

  async update(userId: string, id: string, data: UpdateAgentDto) {
    const oldAgent = await prisma.agent.findUnique({ where: { id } });
    const agent = await prisma.agent.update({ where: { id }, data });

    createAuditLog({ userId, action: 'UPDATE', entity: 'AGENT', entityId: id, oldValue: oldAgent || undefined, newValue: data });

    return agent;
  }

  async delete(userId: string, id: string) {
    const oldAgent = await prisma.agent.findUnique({ where: { id } });
    const agent = await prisma.agent.delete({ where: { id } });

    createAuditLog({ userId, action: 'DELETE', entity: 'AGENT', entityId: id, oldValue: oldAgent || undefined });

    return agent;
  }
}
