import { Prisma } from '@prisma/client';

import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { createAuditLog } from '../../utils/auditLog';

import type {
  RefrigeratorBody,
  FillBody,
  ListQuery,
  FillListQuery,
  WeeklyReportBody,
  ReportListQuery,
} from './refrigerator.schema';

/**
 * Flag integrasi stok gudang.
 * - false (default): pengisian kulkas TIDAK mengurangi stok Product.
 *   Cocok bila katalog produk belum menstandarkan unit (kardus vs botol).
 * - true: pengisian kulkas mengurangi stok Product memakai FIFO yang sama
 *   dengan modul stock-out. Aktifkan hanya bila `productId` dikirim dan unit
 *   produk sudah konsisten (lihat depleteProductStockFIFO di bawah).
 */
const INTEGRATE_WAREHOUSE_STOCK = false;

type AuditCtx = { ipAddress?: string; userAgent?: string };

export class RefrigeratorService {
  // -------------------------------------------------------------------------
  //  MASTER KULKAS
  // -------------------------------------------------------------------------

  /**
   * Daftar kulkas + ringkasan "terisi hari ini" untuk setiap kartu.
   * Agregasi hari ini dihitung dengan satu query group-by agar tidak N+1.
   */
  async list(params: ListQuery) {
    const { page, limit, search, isActive } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.RefrigeratorWhereInput = {
      deletedAt: null,
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { location: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.refrigerator.findMany({
        where,
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        skip,
        take: limit,
        include: { shares: true },
      }),
      prisma.refrigerator.count({ where }),
    ]);

    // Agregasi pengisian HARI INI untuk seluruh kulkas pada halaman ini.
    const ids = items.map((r) => r.id);
    const { start, end } = dayRange(new Date());

    const todayAgg = ids.length
      ? await prisma.refrigeratorFill.groupBy({
          by: ['refrigeratorId'],
          where: { refrigeratorId: { in: ids }, fillDate: { gte: start, lte: end } },
          _sum: { boxCount: true, totalBottles: true, totalCost: true },
          _count: { _all: true },
          _max: { createdAt: true },
        })
      : [];

    const aggMap = new Map(todayAgg.map((a) => [a.refrigeratorId, a]));

    const data = items.map((r) => {
      const agg = aggMap.get(r.id);
      return {
        ...r,
        todayFill: {
          boxCount: agg?._sum.boxCount ?? 0,
          totalBottles: agg?._sum.totalBottles ?? 0,
          totalCost: (agg?._sum.totalCost ?? new Prisma.Decimal(0)).toString(),
          fillCount: agg?._count._all ?? 0,
          lastFillAt: agg?._max.createdAt ?? null,
        },
      };
    });

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const fridge = await prisma.refrigerator.findFirst({
      where: { id, deletedAt: null },
      include: {
        shares: true,
        fills: {
          orderBy: { fillDate: 'desc' },
          take: 10,
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
    if (!fridge) throw ApiError.notFound('Kulkas tidak ditemukan');
    return fridge;
  }

  async create(body: RefrigeratorBody, userId: string, audit?: AuditCtx) {
    if (body.code) {
      const exists = await prisma.refrigerator.findFirst({
        where: { code: body.code, deletedAt: null },
      });
      if (exists) throw new ApiError(409, 'Kode kulkas sudah dipakai', 'DUPLICATE_CODE');
    }

    const created = await prisma.$transaction(async (tx) => {
      const fridge = await tx.refrigerator.create({
        data: {
          name: body.name,
          location: body.location ?? null,
          code: body.code ?? null,
          description: body.description ?? null,
          imageUrl: body.imageUrl ?? null,
          isActive: body.isActive ?? true,
          profitSharingEnabled: body.profitSharingEnabled ?? false,
          createdBy: userId,
        },
      });

      if (body.profitSharingEnabled && body.shares?.length) {
        await tx.refrigeratorShare.createMany({
          data: body.shares.map((s) => ({
            refrigeratorId: fridge.id,
            instansiName: s.instansiName,
            percentage: new Prisma.Decimal(s.percentage),
          })),
        });
      }

      return tx.refrigerator.findUniqueOrThrow({ where: { id: fridge.id }, include: { shares: true } });
    });

    createAuditLog({
      userId,
      action: 'CREATE',
      entity: 'Refrigerator',
      entityId: created.id,
      newValue: { id: created.id, name: created.name, profitSharingEnabled: created.profitSharingEnabled },
      ...audit,
    });

    return created;
  }

  async update(
    id: string,
    body: Partial<RefrigeratorBody>,
    userId: string,
    audit?: AuditCtx,
  ) {
    const existing = await prisma.refrigerator.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw ApiError.notFound('Kulkas tidak ditemukan');

    if (body.code && body.code !== existing.code) {
      const dup = await prisma.refrigerator.findFirst({
        where: { code: body.code, deletedAt: null, NOT: { id } },
      });
      if (dup) throw new ApiError(409, 'Kode kulkas sudah dipakai', 'DUPLICATE_CODE');
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.refrigerator.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.location !== undefined ? { location: body.location } : {}),
          ...(body.code !== undefined ? { code: body.code } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
          ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
          ...(body.profitSharingEnabled !== undefined
            ? { profitSharingEnabled: body.profitSharingEnabled }
            : {}),
        },
      });

      // Sinkronkan konfigurasi bagi hasil bila status/daftar instansi dikirim.
      if (body.profitSharingEnabled !== undefined || body.shares !== undefined) {
        await tx.refrigeratorShare.deleteMany({ where: { refrigeratorId: id } });
        const enabled = body.profitSharingEnabled ?? existing.profitSharingEnabled;
        if (enabled && body.shares?.length) {
          await tx.refrigeratorShare.createMany({
            data: body.shares.map((s) => ({
              refrigeratorId: id,
              instansiName: s.instansiName,
              percentage: new Prisma.Decimal(s.percentage),
            })),
          });
        }
      }

      return tx.refrigerator.findUniqueOrThrow({ where: { id }, include: { shares: true } });
    });

    createAuditLog({
      userId,
      action: 'UPDATE',
      entity: 'Refrigerator',
      entityId: id,
      oldValue: { id: existing.id, name: existing.name, profitSharingEnabled: existing.profitSharingEnabled },
      newValue: { id: updated.id, name: updated.name, profitSharingEnabled: updated.profitSharingEnabled },
      ...audit,
    });

    return updated;
  }

  /** Soft delete — konsisten dengan pola products/discounts. */
  async remove(id: string, userId: string, audit?: AuditCtx) {
    const existing = await prisma.refrigerator.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw ApiError.notFound('Kulkas tidak ditemukan');

    await prisma.refrigerator.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    createAuditLog({
      userId,
      action: 'DELETE',
      entity: 'Refrigerator',
      entityId: id,
      oldValue: existing,
      ...audit,
    });

    return { id };
  }

  // -------------------------------------------------------------------------
  //  PENGISIAN KULKAS (FILL)
  // -------------------------------------------------------------------------

  async createFill(
    refrigeratorId: string,
    body: FillBody,
    userId: string,
    audit?: AuditCtx,
  ) {
    const fridge = await prisma.refrigerator.findFirst({
      where: { id: refrigeratorId, deletedAt: null },
    });
    if (!fridge) throw ApiError.notFound('Kulkas tidak ditemukan');

    const bottlesPerBox = body.bottlesPerBox ?? 0;
    const totalBottles = body.boxCount * bottlesPerBox;

    // Kalkulasi uang memakai Prisma.Decimal agar bebas masalah floating-point.
    const pricePerBox = new Prisma.Decimal(body.pricePerBox);
    const pricePerBottle = new Prisma.Decimal(body.pricePerBottle);
    const totalCost = pricePerBox.mul(body.boxCount); // nilai modal terisi

    const fillDate = body.fillDate ? new Date(body.fillDate) : startOfDay(new Date());

    const fill = await prisma.$transaction(async (tx) => {
      const created = await tx.refrigeratorFill.create({
        data: {
          refrigeratorId,
          productId: body.productId ?? null,
          userId,
          fillDate,
          boxCount: body.boxCount,
          bottlesPerBox,
          pricePerBox,
          pricePerBottle,
          totalBottles,
          totalCost,
          notes: body.notes ?? null,
        },
      });

      // ===== OPSIONAL: integrasi stok gudang (FIFO) ==========================
      // Aktif hanya jika INTEGRATE_WAREHOUSE_STOCK=true DAN productId dikirim.
      // Mengikuti algoritma FIFO yang sama dengan modul stock-out.
      if (INTEGRATE_WAREHOUSE_STOCK && body.productId && totalBottles > 0) {
        await depleteProductStockFIFO(tx, body.productId, totalBottles);
      }
      // =======================================================================

      return created;
    });

    createAuditLog({
      userId,
      action: 'FILL',
      entity: 'RefrigeratorFill',
      entityId: fill.id,
      newValue: { id: fill.id, boxCount: fill.boxCount, totalCost: totalCost.toString() },
      metadata: { refrigeratorId, refrigeratorName: fridge.name },
      ...audit,
    });

    return fill;
  }

  async listFills(refrigeratorId: string, query: FillListQuery) {
    const fridge = await prisma.refrigerator.findFirst({
      where: { id: refrigeratorId, deletedAt: null },
    });
    if (!fridge) throw ApiError.notFound('Kulkas tidak ditemukan');

    const { page, limit, from, to } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RefrigeratorFillWhereInput = {
      refrigeratorId,
      ...(from || to
        ? {
            fillDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.refrigeratorFill.findMany({
        where,
        orderBy: [{ fillDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.refrigeratorFill.count({ where }),
    ]);

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Hapus 1 pengisian (hanya SUPER_ADMIN/PIMPINAN — diatur di routes). */
  async removeFill(
    refrigeratorId: string,
    fillId: string,
    userId: string,
    audit?: AuditCtx,
  ) {
    const fill = await prisma.refrigeratorFill.findFirst({
      where: { id: fillId, refrigeratorId },
    });
    if (!fill) throw ApiError.notFound('Data pengisian tidak ditemukan');

    await prisma.$transaction(async (tx) => {
      // Jika integrasi stok aktif & dahulu memotong stok, kembalikan di sini (LIFO).
      if (INTEGRATE_WAREHOUSE_STOCK && fill.productId && fill.totalBottles > 0) {
        await restoreProductStockLIFO(tx, fill.productId, fill.totalBottles);
      }
      await tx.refrigeratorFill.delete({ where: { id: fillId } });
    });

    createAuditLog({
      userId,
      action: 'DELETE',
      entity: 'RefrigeratorFill',
      entityId: fillId,
      oldValue: { id: fill.id, boxCount: fill.boxCount, totalCost: fill.totalCost.toString() },
      ...audit,
    });

    return { id: fillId };
  }

  // -------------------------------------------------------------------------
  //  REKAP PEKANAN / BAGI HASIL
  // -------------------------------------------------------------------------

  /** Pratinjau modal kardus pada rentang tanggal (untuk membantu form rekap). */
  async recapPreview(refrigeratorId: string, from: string, to: string) {
    await this.ensureExists(refrigeratorId);

    const agg = await prisma.refrigeratorFill.aggregate({
      where: { refrigeratorId, fillDate: { gte: new Date(from), lte: new Date(to) } },
      _sum: { totalCost: true, boxCount: true, totalBottles: true },
      _count: { _all: true },
    });

    return {
      periodStart: from,
      periodEnd: to,
      modalCost: (agg._sum.totalCost ?? new Prisma.Decimal(0)).toString(),
      boxCount: agg._sum.boxCount ?? 0,
      totalBottles: agg._sum.totalBottles ?? 0,
      fillCount: agg._count._all ?? 0,
    };
  }

  /**
   * Buat rekap pekanan + snapshot pembagian laba per instansi.
   * Laba bersih = uang masuk aktual (input manual) - modal kardus (otomatis dari pengisian).
   */
  async createWeeklyReport(
    refrigeratorId: string,
    body: WeeklyReportBody,
    userId: string,
    audit?: AuditCtx,
  ) {
    const fridge = await prisma.refrigerator.findFirst({
      where: { id: refrigeratorId, deletedAt: null },
      include: { shares: true },
    });
    if (!fridge) throw ApiError.notFound('Kulkas tidak ditemukan');
    if (!fridge.profitSharingEnabled || fridge.shares.length === 0) {
      throw new ApiError(422, 'Kulkas ini tidak mengaktifkan sistem bagi hasil', 'PROFIT_SHARING_DISABLED');
    }

    const start = new Date(body.periodStart);
    const end = new Date(body.periodEnd);

    const agg = await prisma.refrigeratorFill.aggregate({
      where: { refrigeratorId, fillDate: { gte: start, lte: end } },
      _sum: { totalCost: true },
    });
    const modalCost = agg._sum.totalCost ?? new Prisma.Decimal(0);
    const actualRevenue = new Prisma.Decimal(body.actualRevenue);
    const netProfit = actualRevenue.minus(modalCost);

    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.refrigeratorWeeklyReport.create({
        data: {
          refrigeratorId,
          userId,
          periodStart: start,
          periodEnd: end,
          actualRevenue,
          modalCost,
          netProfit,
          notes: body.notes ?? null,
        },
      });

      await tx.refrigeratorReportShare.createMany({
        data: fridge.shares.map((s) => ({
          reportId: created.id,
          instansiName: s.instansiName,
          percentage: s.percentage,
          amount: netProfit.mul(s.percentage).div(100),
        })),
      });

      return tx.refrigeratorWeeklyReport.findUniqueOrThrow({
        where: { id: created.id },
        include: { shares: true },
      });
    });

    createAuditLog({
      userId,
      action: 'WEEKLY_REPORT',
      entity: 'RefrigeratorWeeklyReport',
      entityId: report.id,
      newValue: {
        id: report.id,
        actualRevenue: actualRevenue.toString(),
        modalCost: modalCost.toString(),
        netProfit: netProfit.toString(),
      },
      metadata: { refrigeratorId, refrigeratorName: fridge.name },
      ...audit,
    });

    return report;
  }

  async listWeeklyReports(refrigeratorId: string, query: ReportListQuery) {
    await this.ensureExists(refrigeratorId);

    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await prisma.$transaction([
      prisma.refrigeratorWeeklyReport.findMany({
        where: { refrigeratorId },
        orderBy: { periodStart: 'desc' },
        skip,
        take: limit,
        include: { shares: true, user: { select: { id: true, name: true } } },
      }),
      prisma.refrigeratorWeeklyReport.count({ where: { refrigeratorId } }),
    ]);

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Hapus 1 rekap pekanan (hanya SUPER_ADMIN/PIMPINAN — diatur di routes). */
  async removeWeeklyReport(
    refrigeratorId: string,
    reportId: string,
    userId: string,
    audit?: AuditCtx,
  ) {
    const report = await prisma.refrigeratorWeeklyReport.findFirst({
      where: { id: reportId, refrigeratorId },
    });
    if (!report) throw ApiError.notFound('Rekap pekanan tidak ditemukan');

    // Snapshot bagi hasil ikut terhapus via cascade.
    await prisma.refrigeratorWeeklyReport.delete({ where: { id: reportId } });

    createAuditLog({
      userId,
      action: 'DELETE',
      entity: 'RefrigeratorWeeklyReport',
      entityId: reportId,
      oldValue: { id: report.id, netProfit: report.netProfit.toString() },
      ...audit,
    });

    return { id: reportId };
  }

  private async ensureExists(id: string) {
    const fridge = await prisma.refrigerator.findFirst({ where: { id, deletedAt: null } });
    if (!fridge) throw ApiError.notFound('Kulkas tidak ditemukan');
    return fridge;
  }

  // -------------------------------------------------------------------------
  //  RINGKASAN (untuk header halaman)
  // -------------------------------------------------------------------------

  async getTodaySummary() {
    const { start, end } = dayRange(new Date());

    const [totalRefrigerators, agg] = await prisma.$transaction([
      prisma.refrigerator.count({ where: { deletedAt: null, isActive: true } }),
      prisma.refrigeratorFill.aggregate({
        where: { fillDate: { gte: start, lte: end } },
        _sum: { boxCount: true, totalBottles: true, totalCost: true },
        _count: { _all: true },
      }),
    ]);

    const filledFridges = await prisma.refrigeratorFill.findMany({
      where: { fillDate: { gte: start, lte: end } },
      distinct: ['refrigeratorId'],
      select: { refrigeratorId: true },
    });

    return {
      totalRefrigerators,
      filledToday: filledFridges.length,
      notFilledToday: Math.max(totalRefrigerators - filledFridges.length, 0),
      boxCountToday: agg._sum.boxCount ?? 0,
      totalBottlesToday: agg._sum.totalBottles ?? 0,
      totalCostToday: (agg._sum.totalCost ?? new Prisma.Decimal(0)).toString(),
      fillCountToday: agg._count._all ?? 0,
    };
  }
}

// ---------------------------------------------------------------------------
//  HELPER INTERNAL
// ---------------------------------------------------------------------------

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayRange(d: Date) {
  const start = startOfDay(d);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Pengurangan stok FIFO — SALINAN pola dari stock-out.service.ts.
 * Dipakai hanya bila INTEGRATE_WAREHOUSE_STOCK=true.
 * NOTE: pastikan satuan `quantity` (botol) konsisten dengan Product.stock Anda.
 */
async function depleteProductStockFIFO(
  tx: Prisma.TransactionClient,
  productId: string,
  quantity: number,
) {
  const product = await tx.product.findFirst({ where: { id: productId, deletedAt: null } });
  if (!product) throw ApiError.notFound('Produk tidak ditemukan');
  if (product.stock < quantity) {
    throw new ApiError(422, 'Stok gudang tidak mencukupi untuk pengisian ini', 'INSUFFICIENT_STOCK');
  }

  let qtyToDeplete = quantity;
  const availableStockIns = await tx.stockIn.findMany({
    where: { productId, remainingStock: { gt: 0 } },
    orderBy: { entryDate: 'asc' },
  });

  for (const stIn of availableStockIns) {
    if (qtyToDeplete <= 0) break;
    const depleteAmount = Math.min(qtyToDeplete, stIn.remainingStock);
    await tx.stockIn.update({
      where: { id: stIn.id },
      data: { remainingStock: stIn.remainingStock - depleteAmount },
    });
    qtyToDeplete -= depleteAmount;
  }

  await tx.product.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } },
  });
}

/** Pemulihan stok LIFO saat pengisian dihapus (cermin stock-out rollback). */
async function restoreProductStockLIFO(
  tx: Prisma.TransactionClient,
  productId: string,
  quantity: number,
) {
  let qtyToRestore = quantity;
  const recentStockIns = await tx.stockIn.findMany({
    where: { productId },
    orderBy: { entryDate: 'desc' },
  });

  for (const stIn of recentStockIns) {
    if (qtyToRestore <= 0) break;
    const spaceLeft = stIn.quantity - stIn.remainingStock;
    if (spaceLeft > 0) {
      const restoreAmount = Math.min(qtyToRestore, spaceLeft);
      await tx.stockIn.update({
        where: { id: stIn.id },
        data: { remainingStock: stIn.remainingStock + restoreAmount },
      });
      qtyToRestore -= restoreAmount;
    }
  }

  await tx.product.update({
    where: { id: productId },
    data: { stock: { increment: quantity } },
  });
}
