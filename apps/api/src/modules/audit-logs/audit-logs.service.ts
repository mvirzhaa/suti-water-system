import prisma from '../../config/database';

export class AuditLogService {
  /**
   * Ambil semua log aktivitas dengan pagination & filter
   */
  async findAll(params: { 
    skip: number; 
    take: number; 
    userId?: string; 
    entity?: string; 
    action?: string; 
  }) {
    const where: any = {};
    
    if (params.userId) where.userId = params.userId;
    if (params.entity) where.entity = params.entity;
    if (params.action) where.action = params.action;

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: params.skip,
        take: params.take,
        include: {
          user: { select: { name: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ]);

    return { data, total };
  }

  /**
   * Ambil statistik aktivitas singkat (misal: 10 log terakhir)
   */
  async getLatest() {
    return await prisma.auditLog.findMany({
      take: 10,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }
}
