'use client';

import { useState, useEffect } from 'react';
import { productService } from '@/services/product.service';
import { stockInService } from '@/services/stock-in.service';
import { stockOutService } from '@/services/stock-out.service';
import { FileText, Search } from 'lucide-react';
import type { Product, StockInRecord, StockOutRecord } from '@/types/api';

type CombinedRecord = {
  id: string;
  date: string;
  createdAt: string;
  type: 'IN' | 'OUT';
  document: string;
  quantityIn: number;
  quantityOut: number;
  balance: number;
  price?: number;
  notes?: string;
  source: any;
};

export default function StockCardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<CombinedRecord[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchStockHistory(selectedProductId);
    } else {
      setRecords([]);
    }
  }, [selectedProductId]);

  const fetchProducts = async () => {
    try {
      const res = await productService.getAll();
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products', error);
    }
  };

  const fetchStockHistory = async (productId: string) => {
    setLoading(true);
    try {
      const [resIn, resOut] = await Promise.all([
        stockInService.getAll({ productId, limit: 1000 }),
        stockOutService.getAll({ productId, limit: 1000 })
      ]);

      const inRecords = (resIn.data as StockInRecord[]).map(r => ({
        id: r.id,
        date: r.entryDate,
        createdAt: (r as any).createdAt || r.entryDate,
        type: 'IN' as const,
        document: r.suppl?.name || r.supplier || 'Barang Masuk',
        quantityIn: r.quantity,
        quantityOut: 0,
        balance: 0, // will calculate later
        price: r.pricePerUnit,
        source: r
      }));

      const outRecords = (resOut.data as StockOutRecord[]).map(r => ({
        id: r.id,
        date: r.exitDate,
        createdAt: (r as any).createdAt || r.exitDate,
        type: 'OUT' as const,
        document: r.agent?.name || r.buyerName || 'Penjualan',
        quantityIn: 0,
        quantityOut: r.quantity,
        balance: 0,
        price: r.pricePerUnit,
        source: r
      }));

      // Combine and sort by createdAt
      const combined = [...inRecords, ...outRecords].sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      // Calculate running balance
      let currentBalance = 0;
      for (const record of combined) {
        if (record.type === 'IN') {
          currentBalance += record.quantityIn;
        } else {
          currentBalance -= record.quantityOut;
        }
        record.balance = currentBalance;
      }

      // Reverse for descending display (newest first)
      setRecords(combined.reverse());

    } catch (error) {
      console.error('Error fetching stock history', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <div>
      <div className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', color: '#1e293b' }}>
            <div style={{ backgroundColor: '#0CA5EA', padding: '0.5rem', borderRadius: '0.5rem', color: 'white' }}>
              <FileText size={20} />
            </div>
            Kartu Stok Barang
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 400px) 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Pilih Barang</label>
            <div style={{ position: 'relative' }}>
              <select 
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 2.5rem 0.6rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', outline: 'none', backgroundColor: 'white', appearance: 'none' }}
              >
                <option value="">-- Pilih Barang --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.sku ? `[${p.sku}] ` : ''}{p.name}</option>
                ))}
              </select>
              <Search size={16} color="#64748b" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {selectedProduct && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Kode Barang / SKU</p>
                <p style={{ margin: 0, fontWeight: 600 }}>{selectedProduct.sku || '-'}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Satuan</p>
                <p style={{ margin: 0, fontWeight: 600 }}>{selectedProduct.unit}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Stok Tersedia Saat Ini</p>
                <p style={{ margin: 0, fontWeight: 700, color: '#0CA5EA', fontSize: '1.25rem' }}>{selectedProduct.stock}</p>
              </div>
            </div>
          )}
        </div>

        {selectedProductId ? (
          <div className="table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle' }}>Tanggal</th>
                  <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle' }}>Keterangan / Dokumen</th>
                  <th colSpan={3} style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>Mutasi Stok</th>
                  <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle' }}>Harga/Unit</th>
                </tr>
                <tr>
                  <th style={{ textAlign: 'center', backgroundColor: '#f0fdf4', color: '#166534' }}>Masuk</th>
                  <th style={{ textAlign: 'center', backgroundColor: '#fef2f2', color: '#991b1b' }}>Keluar</th>
                  <th style={{ textAlign: 'center', backgroundColor: '#f0f9ff', color: '#075985' }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Memuat riwayat stok...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Belum ada pergerakan stok untuk barang ini.</td></tr>
                ) : (
                  records.map((record) => (
                    <tr key={`${record.type}-${record.id}`}>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{new Date(record.createdAt).toLocaleString('id-ID')}</td>
                      <td>{record.document}</td>
                      <td style={{ textAlign: 'center', fontWeight: record.quantityIn > 0 ? 600 : 400, color: record.quantityIn > 0 ? '#166534' : 'inherit' }}>
                        {record.quantityIn || '-'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: record.quantityOut > 0 ? 600 : 400, color: record.quantityOut > 0 ? '#991b1b' : 'inherit' }}>
                        {record.quantityOut || '-'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, backgroundColor: '#f8fafc' }}>
                        {record.balance}
                      </td>
                      <td style={{ textAlign: 'right' }}>{record.price ? formatRupiah(record.price) : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '0.5rem' }}>
            <FileText size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p style={{ margin: 0 }}>Silakan pilih barang terlebih dahulu untuk melihat kartu stok.</p>
          </div>
        )}
      </div>
    </div>
  );
}
