'use client';

import { useState, useEffect } from 'react';
import { productService } from '@/services/product.service';
import { Box, Plus, Edit, Trash2 } from 'lucide-react';

// Format currency
const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

export default function ProductPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await productService.getAll();
      setData(res.data);
    } catch (error) {
      console.error('Error fetching products', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="section-title" style={{ marginTop: 0 }}>Barang</h1>
      
      <div className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', color: '#1e293b' }}>
            <div style={{ backgroundColor: '#0CA5EA', padding: '0.5rem', borderRadius: '0.5rem', color: 'white' }}>
              <Box size={20} />
            </div>
            Data Detail Barang
          </h2>
          
          <button style={{ backgroundColor: '#006FB2', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={18} /> Tambah Data Barang
          </button>
        </div>

        <div className="table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Kode Barang</th>
                <th>Nama Barang</th>
                <th>Jenis Barang</th>
                <th>Satuan Barang</th>
                <th>Harga</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center' }}>Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center' }}>Belum ada data barang</td></tr>
              ) : (
                data.map((item, index) => {
                  // Ekstrak kapasitas dari nama untuk UI "Jenis Barang" jika diperlukan, atau gunakan nama as is
                  const jenisBarang = item.name.match(/\d+\s*(ml|liter)/i)?.[0] || '-';
                  return (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.sku || '-'}</td>
                      <td>{item.name}</td>
                      <td>{jenisBarang.toUpperCase()}</td>
                      <td>{item.unit}</td>
                      <td>{formatRupiah(item.priceSell)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button style={{ backgroundColor: '#0CA5EA', color: 'white', border: 'none', padding: '0.35rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                            <Edit size={14} />
                          </button>
                          <button style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.35rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
