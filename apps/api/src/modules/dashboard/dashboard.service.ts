import prisma from '../../config/database';

export class DashboardService {
  async getDashboardSummary() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 1. Total Agen (User biasa / Pembeli yg terdaftar, atau kita hitung buyerName unik)
    // Karena di skema kita buyerName itu string di StockOut, kita hitung jumlah user dengan role STAFF sebagai representasi
    const totalAgen = await prisma.user.count({
      where: { role: 'STAFF' }
    });

    // 2. Total Stok Barang Saat Ini
    const products = await prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      select: { stock: true }
    });
    const totalStok = products.reduce((acc, curr) => acc + curr.stock, 0);

    // 3. Total Pendapatan Bulan Ini
    const pendapatanBulanIni = await prisma.stockOut.aggregate({
      where: {
        exitDate: { gte: firstDayOfMonth }
      },
      _sum: { totalPrice: true }
    });

    // 4. 5 Agen/Pembeli dengan Pembelian Tertinggi (Berdasarkan Qty)
    const topBuyersRaw = await prisma.stockOut.groupBy({
      by: ['buyerName'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
      where: { buyerName: { not: null } }
    });
    const topBuyers = topBuyersRaw.map((b, i) => ({
      rank: i + 1,
      name: b.buyerName || 'Umum',
      qty: b._sum.quantity || 0,
      city: 'Toko/Agen' // Dummy city as it's not in schema
    }));

    // 5. Produk Terlaris (Berdasarkan jumlah terjual total)
    const topProductsRaw = await prisma.stockOut.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 4
    });
    
    const topProductsIds = topProductsRaw.map(p => p.productId);
    const topProductsDetails = await prisma.product.findMany({
      where: { id: { in: topProductsIds } },
      select: { id: true, name: true, unit: true, imageUrl: true }
    });

    const topProducts = topProductsRaw.map((p, i) => {
      const detail = topProductsDetails.find(d => d.id === p.productId);
      return {
        rank: i + 1,
        name: detail?.name || 'Unknown',
        unit: detail?.unit || 'pcs',
        qty: p._sum.quantity || 0,
        img: detail?.imageUrl || 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=100&h=100&fit=crop'
      };
    });

    // 6. Stok Hampir Habis
    const lowStock = await prisma.product.findMany({
      where: { isActive: true, deletedAt: null, stock: { lte: prisma.product.fields.minStock } },
      select: { id: true, name: true, stock: true },
      take: 5
    });

    // 7. Transaksi Terakhir
    const recentStockInRaw = await prisma.stockIn.findMany({
      orderBy: { entryDate: 'desc' },
      take: 5,
      include: { product: { select: { name: true } } }
    });
    const recentStockIn = recentStockInRaw.map(s => ({
      date: s.entryDate.toISOString().split('T')[0],
      product: s.product.name,
      qty: s.quantity
    }));

    const recentStockOutRaw = await prisma.stockOut.findMany({
      orderBy: { exitDate: 'desc' },
      take: 5,
      include: { product: { select: { name: true } } }
    });
    const recentStockOut = recentStockOutRaw.map(s => ({
      date: s.exitDate.toISOString().split('T')[0],
      product: s.product.name,
      qty: s.quantity
    }));

    // 8. Grafik Masuk & Keluar per Bulan (Simulasi tahun ini)
    const currentYear = now.getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = months.map(m => ({ name: m, masuk: 0, keluar: 0 }));

    // Di production yang datanya besar, ini harus menggunakan raw SQL GROUP BY DATE_TRUNC. 
    // Untuk seed data, kita fetch semua tahun ini lalu group in memory (karena Prisma belum full support extract month via ORM dengan gampang).
    const stockInYear = await prisma.stockIn.findMany({
      where: { entryDate: { gte: new Date(currentYear, 0, 1) } },
      select: { entryDate: true, quantity: true }
    });
    stockInYear.forEach(s => {
      chartData[s.entryDate.getMonth()].masuk += s.quantity;
    });

    const stockOutYear = await prisma.stockOut.findMany({
      where: { exitDate: { gte: new Date(currentYear, 0, 1) } },
      select: { exitDate: true, quantity: true }
    });
    stockOutYear.forEach(s => {
      chartData[s.exitDate.getMonth()].keluar += s.quantity;
    });

    return {
      kpi: {
        totalAgen,
        totalStok,
        totalPendapatan: pendapatanBulanIni._sum.totalPrice || 0
      },
      topBuyers,
      topProducts,
      lowStock,
      recentStockIn,
      recentStockOut,
      chartData: chartData.filter((_, idx) => idx <= now.getMonth()) // Tampilkan hanya sampai bulan ini
    };
  }
}
