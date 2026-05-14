'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Package, DollarSign, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardSummary } from '@/types/api';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const result = await dashboardService.getSummary();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch dashboard summary', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data dashboard...</div>;
  }

  if (!data) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Gagal memuat data.</div>;
  }

  // Helper untuk format rupiah
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      
      {/* 1. KPI Cards */}
      <div className="dash-grid-3">
        <div className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#0CA5EA', padding: '1rem', borderRadius: '1rem', color: 'white' }}>
            <Users size={32} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Total Agen Aktif</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>{data.kpi.totalAgen}</h2>
          </div>
        </div>
        <div className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#0CA5EA', padding: '1rem', borderRadius: '1rem', color: 'white' }}>
            <Package size={32} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Stok Barang Saat Ini</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>{data.kpi.totalStok.toLocaleString('id-ID')} Unit</h2>
          </div>
        </div>
        <div className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ backgroundColor: '#0CA5EA', padding: '1rem', borderRadius: '1rem', color: 'white' }}>
              <DollarSign size={32} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Pendapatan Bulan Ini</p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>{formatRupiah(data.kpi.totalPendapatan)}</h2>
            </div>
          </div>
          <select style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none' }}>
            <option>Bulan Ini</option>
          </select>
        </div>
      </div>

      {/* 2. Agen Terbaik */}
      <h3 className="section-title">Agen Dengan Pembelian Tertinggi</h3>
      <div className="dash-grid-4">
        {data.topBuyers.length > 0 ? data.topBuyers.map((agen, idx) => (
          <div key={idx} className="dash-card" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: agen.rank === 1 ? '#eab308' : '#94a3b8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '3px solid white' }}>
              {agen.rank}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agen.name}</p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0CA5EA', margin: '0.25rem 0' }}>
              {agen.qty.toLocaleString('id-ID')} <span style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 500 }}>Unit</span>
            </h2>
            <span className="badge badge-blue">AGEN</span> <span style={{ fontSize: '0.75rem', fontWeight: 600, marginLeft: '0.5rem' }}>{agen.city}</span>
          </div>
        )) : <p style={{ color: 'gray' }}>Belum ada data pembelian</p>}
      </div>

      {/* 3. Produk Terlaris */}
      <h3 className="section-title">Produk Terlaris</h3>
      <div className="dash-grid-4">
        {data.topProducts.length > 0 ? data.topProducts.map((prod, idx) => (
          <div key={idx} className="dash-card" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10px', right: '10px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: prod.rank === 1 ? '#eab308' : '#94a3b8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
              {prod.rank}
            </div>
            <div style={{ width: '60%' }}>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Terjual {prod.qty} {prod.unit}</p>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0CA5EA', margin: '0.25rem 0' }}>
                {prod.name}
              </h2>
              <span className="badge badge-blue" style={{ marginTop: '0.5rem' }}>{prod.unit.toUpperCase()}</span>
            </div>
            <img src={prod.img || 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=100&h=100&fit=crop'} alt={prod.name} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
          </div>
        )) : <p style={{ color: 'gray' }}>Belum ada data produk terlaris</p>}
      </div>

      {/* 4. Chart Analisis Produk */}
      <h3 className="section-title">Grafik Analisis Produk</h3>
      <div className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ backgroundColor: '#0CA5EA', color: 'white', borderRadius: '4px', padding: '4px' }}><Package size={16}/></div>
              Grafik Produk Terlaris
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '28px' }}>Tren Barang Masuk & Keluar</span>
          </div>
        </div>

        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={1}>
            <BarChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="masuk" fill="#004d99" radius={[4, 4, 0, 0]} name="Barang Masuk" />
              <Bar dataKey="keluar" fill="#0CA5EA" radius={[4, 4, 0, 0]} name="Barang Keluar" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Chart Analisis Barang (Masuk & Keluar) */}
      <h3 className="section-title">Grafik Analisis Barang (Tahun Ini)</h3>
      <div className="dash-grid-2">
        <div className="dash-card">
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: '#0CA5EA', color: 'white', borderRadius: '4px', padding: '4px' }}><ArrowDownCircle size={16}/></div>
            Total Barang Masuk per Bulan
          </h4>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={1}>
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="masuk" fill="#004d99" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="dash-card">
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: '#ef4444', color: 'white', borderRadius: '4px', padding: '4px' }}><ArrowUpCircle size={16}/></div>
            Total Barang Keluar per Bulan
          </h4>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={1}>
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="keluar" fill="#0CA5EA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Tables */}
      <div className="dash-grid-3" style={{ marginTop: '1.5rem' }}>
        <div className="dash-card">
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: '#eab308', color: 'white', borderRadius: '4px', padding: '4px' }}><AlertCircle size={16}/></div>
            Stok Hampir Habis
          </h4>
          <div className="table-wrapper">
            <table className="dash-table">
              <thead><tr><th>Barang</th><th>Stok</th></tr></thead>
              <tbody>
                {data.lowStock.length > 0 ? data.lowStock.map((item, i) => (
                  <tr key={i}>
                    <td>{item.name}</td>
                    <td><span style={{ color: '#ef4444', fontWeight: 'bold' }}>{item.stock}</span></td>
                  </tr>
                )) : <tr><td colSpan={2} style={{ textAlign: 'center' }}>Stok aman semua</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dash-card">
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: '#0CA5EA', color: 'white', borderRadius: '4px', padding: '4px' }}><ArrowDownCircle size={16}/></div>
            Data Masuk Terakhir
          </h4>
          <div className="table-wrapper">
            <table className="dash-table">
              <thead><tr><th>Tanggal</th><th>Barang</th><th>Jumlah</th></tr></thead>
              <tbody>
                {data.recentStockIn.length > 0 ? data.recentStockIn.map((item, i) => (
                  <tr key={i}>
                    <td>{item.date}</td>
                    <td>{item.product}</td>
                    <td><span className="badge badge-blue">{item.qty}</span></td>
                  </tr>
                )) : <tr><td colSpan={3} style={{ textAlign: 'center' }}>Belum ada data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dash-card">
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: '#ef4444', color: 'white', borderRadius: '4px', padding: '4px' }}><ArrowUpCircle size={16}/></div>
            Data Keluar Terakhir
          </h4>
          <div className="table-wrapper">
            <table className="dash-table">
              <thead><tr><th>Tanggal</th><th>Barang</th><th>Jumlah</th></tr></thead>
              <tbody>
                {data.recentStockOut.length > 0 ? data.recentStockOut.map((item, i) => (
                  <tr key={i}>
                    <td>{item.date}</td>
                    <td>{item.product}</td>
                    <td><span className="badge" style={{ backgroundColor: '#ef4444', color: 'white' }}>{item.qty}</span></td>
                  </tr>
                )) : <tr><td colSpan={3} style={{ textAlign: 'center' }}>Belum ada data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
