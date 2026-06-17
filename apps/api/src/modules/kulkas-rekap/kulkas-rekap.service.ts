import { Prisma } from '@prisma/client';

import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { createAuditLog } from '../../utils/auditLog';

import type { CreateRekapBody, RekapListQuery } from './kulkas-rekap.schema';

type AuditCtx = { ipAddress?: string; userAgent?: string };

// Pemetaan kolom pecahan -> nilai nominalnya.
const DENOMS = [
  ['qty500', 500],
  ['qty1000', 1000],
  ['qty2000', 2000],
  ['qty5000', 5000],
  ['qty10000', 10000],
  ['qty20000', 20000],
  ['qty50000', 50000],
  ['qty100000', 100000],
] as const;

// Helper: bungkus angka uang ke Prisma.Decimal dengan 2 desimal.
const dec = (n: number) => new Prisma.Decimal(n.toFixed(2));

export class KulkasRekapService {
  /**
   * Buat satu lembar rekap pekanan. Semua nilai turunan (cashTotal per baris,
   * total kas, total QRIS, grand total, modal, laba bersih, dan amount bagi hasil)
   * dihitung di sini lalu disimpan agar cetak ulang konsisten.
   */
  async create(body: CreateRekapBody, userId: string, audit?: AuditCtx) {
    // Hitung tiap baris kulkas.
    const computedLines = body.lines.map((ln, idx) => {
      const cash = DENOMS.reduce(
        (sum, [key, value]) => sum + (Number((ln as Record<string, unknown>)[key]) || 0) * value,
        0,
      );
      const qris = Number(ln.qrisAmount ?? 0);
      return {
        data: {
          refrigeratorId: ln.refrigeratorId ?? null,
          label: ln.label,
          qty500: ln.qty500 ?? 0,
          qty1000: ln.qty1000 ?? 0,
          qty2000: ln.qty2000 ?? 0,
          qty5000: ln.qty5000 ?? 0,
          qty10000: ln.qty10000 ?? 0,
          qty20000: ln.qty20000 ?? 0,
          qty50000: ln.qty50000 ?? 0,
          qty100000: ln.qty100000 ?? 0,
          cashTotal: dec(cash),
          qrisAmount: dec(qris),
          sortOrder: idx,
        },
        cash,
        qris,
      };
    });

    const cashTotal = computedLines.reduce((s, l) => s + l.cash, 0);
    const qrisTotal = computedLines.reduce((s, l) => s + l.qris, 0);
    const grandTotal = cashTotal + qrisTotal;
    const modalCost = (body.dusSold ?? 0) * Number(body.pricePerDus ?? 0);
    const netProfit = grandTotal - modalCost;

    // Bagi hasil dihitung dari laba bersih (boleh negatif bila rugi).
    const shares = (body.shares ?? []).map((s, idx) => ({
      instansiName: s.instansiName,
      percentage: new Prisma.Decimal(Number(s.percentage).toFixed(2)),
      amount: dec((netProfit * Number(s.percentage)) / 100),
      sortOrder: idx,
    }));

    const created = await prisma.kulkasRekap.create({
      data: {
        userId,
        rekapDate: new Date(body.rekapDate),
        title: body.title ?? null,
        dusSold: body.dusSold ?? 0,
        pricePerDus: dec(Number(body.pricePerDus ?? 0)),
        modalCost: dec(modalCost),
        cashTotal: dec(cashTotal),
        qrisTotal: dec(qrisTotal),
        grandTotal: dec(grandTotal),
        netProfit: dec(netProfit),
        notes: body.notes ?? null,
        lines: { create: computedLines.map((l) => l.data) },
        shares: { create: shares },
      },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        shares: { orderBy: { sortOrder: 'asc' } },
        user: { select: { id: true, name: true } },
      },
    });

    createAuditLog({
      userId,
      action: 'CREATE',
      entity: 'KulkasRekap',
      entityId: created.id,
      newValue: { id: created.id, rekapDate: body.rekapDate, grandTotal, netProfit },
      ...audit,
    });

    return created;
  }

  async list(query: RekapListQuery) {
    const { page, limit, from, to } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.KulkasRekapWhereInput =
      from || to
        ? {
            rekapDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {};

    const [items, total] = await prisma.$transaction([
      prisma.kulkasRekap.findMany({
        where,
        orderBy: [{ rekapDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          _count: { select: { lines: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.kulkasRekap.count({ where }),
    ]);

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const rekap = await prisma.kulkasRekap.findUnique({
      where: { id },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        shares: { orderBy: { sortOrder: 'asc' } },
        user: { select: { id: true, name: true } },
      },
    });
    if (!rekap) throw new ApiError(404, 'Rekap tidak ditemukan', 'NOT_FOUND');
    return rekap;
  }

  /** Hapus rekap (lines & shares ikut terhapus via cascade). */
  async remove(id: string, userId: string, audit?: AuditCtx) {
    const existing = await prisma.kulkasRekap.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Rekap tidak ditemukan', 'NOT_FOUND');

    await prisma.kulkasRekap.delete({ where: { id } });

    createAuditLog({
      userId,
      action: 'DELETE',
      entity: 'KulkasRekap',
      entityId: id,
      oldValue: { id, rekapDate: existing.rekapDate },
      ...audit,
    });

    return { id };
  }
}
