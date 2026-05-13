'use client';

import { useState, useEffect } from 'react';
import { supplierService } from '@/services/supplier.service';
import { Building2, Plus, Eye, Edit, Trash2 } from 'lucide-react';

export default function SupplierPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await supplierService.getAll();
      setData(res.data);
    } catch (error) {
      console.error('Error fetching suppliers', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="section-title" style={{ marginTop: 0 }}>Pemasok</h1>
      
      <div className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', color: '#1e293b' }}>
            <div style={{ backgroundColor: '#0CA5EA', padding: '0.5rem', borderRadius: '0.5rem', color: 'white' }}>
              <Building2 size={20} />
            </div>
            Data Perusahaan Pemasok
          </h2>
          
          <button style={{ backgroundColor: '#006FB2', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={18} /> Tambah Data Pemasok
          </button>
        </div>

        <div className="table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nama Perusahaan Pemasok</th>
                <th style={{ textAlign: 'center' }}>No. Telp/No. Whatsapp</th>
                <th>Alamat Pemasok</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>Belum ada data pemasok</td></tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.name}</td>
                    <td style={{ textAlign: 'center' }}>{item.phone || '-'}</td>
                    <td style={{ maxWidth: '300px' }}>{item.address || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button style={{ backgroundColor: '#0CA5EA', color: 'white', border: 'none', padding: '0.35rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                          <Eye size={14} />
                        </button>
                        <button style={{ backgroundColor: '#0CA5EA', color: 'white', border: 'none', padding: '0.35rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                          <Edit size={14} />
                        </button>
                        <button style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.35rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
