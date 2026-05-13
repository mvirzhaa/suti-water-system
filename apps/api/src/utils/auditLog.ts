import prisma from '../config/database';
import logger from './logger';

interface AuditParams {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: object;
  newValue?: object;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}


/**
 * Buat audit log entry — tidak pernah throw, agar tidak mengganggu operasi utama
 */
export async function createAuditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({ data: params as any });
  } catch (err) {
    logger.error('Audit log failed:', err);
  }
}
