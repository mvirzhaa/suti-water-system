'use client';

import { useState, useEffect } from 'react';
import { stockInService } from '@/services/stock-in.service';
import { productService } from '@/services/product.service';
import { supplierService } from '@/services/supplier.service';
import { History, Plus, Image as ImageIcon, Trash2, CheckCircle, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getApiErrorMessage } from '@/lib/api-error';
import type { Product, StockInRecord, Supplier } from '@/types/api';

// Format currency
const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

// Zod Schema
const stockInSchema = z.object({
  entryDate: z.string().min(1, 'Tanggal wajib diisi'),
  supplierId: z.string().min(1, 'Pemasok wajib dipilih'),
  productId: z.string().min(1, 'Barang wajib dipilih'),
  quantity: z.number().min(1, 'Kuantitas minimal 1'),
  pricePerUnit: z.number().min(0, 'Harga tidak boleh negatif'),
  nota: z.any().optional(), // File handle
});
type StockInFormData = z.infer<typeof stockInSchema>;

export default function StockInPage() {
  const [data, setData] = useState<StockInRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Form State
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<StockInFormData>({
    resolver: zodResolver(stockInSchema),
    defaultValues: { quantity: 0, pricePerUnit: 0 }
  });

  const selectedProductId = watch('productId');
  const quantity = watch('quantity') || 0;
  const pricePerUnit = watch('pricePerUnit') || 0;
  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Derived values for the form UI
  const currentStock = selectedProduct?.stock || 0;
  const unit = selectedProduct?.unit || 'Pcs';
  const totalCost = quantity * pricePerUnit;
  const estimatedTotalStock = currentStock + Number(quantity);

  useEffect(() => {
    fetchData();
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await stockInService.getAll();
      setData(res.data);
    } catch (error) {
      console.error('Error fetching stock in', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await productService.getAll();
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await supplierService.getAll();
      setSuppliers(res.data);
    } catch (error) {
      console.error('Error fetching suppliers', error);
    }
  };

  const onSubmit = async (formData: StockInFormData) => {
    try {
      const payload = new FormData();
      payload.append('productId', formData.productId);
      payload.append('quantity', formData.quantity.toString());
      payload.append('pricePerUnit', formData.pricePerUnit.toString());
      payload.append('entryDate', formData.entryDate);
      if (formData.supplierId) payload.append('supplierId', formData.supplierId);
      
      const fileInput = document.getElementById('nota-upload') as HTMLInputElement;
      if (fileInput && fileInput.files && fileInput.files[0]) {
        payload.append('nota', fileInput.files[0]);
      }

      await stockInService.create(payload);
      
      setIsAddModalOpen(false);
      reset();
      fetchData(); // Refresh table
      
      setIsSuccessModalOpen(true);
      setTimeout(() => setIsSuccessModalOpen(false), 2000); // Auto close success modal
    } catch (error: unknown) {
      alert(getApiErrorMessage(error, 'Terjadi kesalahan saat menyimpan data'));
    }
  };

  const totalKeseluruhanUnit = data.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalKeseluruhanHarga = data.reduce((acc, curr) => acc + Number(curr.totalCost), 0);

  return (
    <div>
      {/* Main Container */}
      <div className="dash-card">
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', color: '#1e293b' }}>
            <div style={{ backgroundColor: '#0CA5EA', padding: '0.5rem', borderRadius: '0.5rem', color: 'white' }}>
              <History size={20} />
            </div>
            Riwayat Barang Masuk
          </h2>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            style={{ 
              backgroundColor: '#006FB2', 
              color: 'white', 
              border: 'none', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={18} /> Tambah Data Barang Masuk
          </button>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Kode Barang</th>
                <th>Tanggal Masuk</th>
                <th>Pemasok</th>
                <th>Barang</th>
                <th>Satuan</th>
                <th>Harga</th>
                <th>Jumlah</th>
                <th>Total Harga</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ textAlign: 'center' }}>Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center' }}>Belum ada data barang masuk</td></tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.product?.sku || '-'}</td>
                    <td>{new Date(item.entryDate).toLocaleDateString('id-ID')}</td>
                    <td>{item.suppl?.name || item.supplier || '-'}</td>
                    <td>{item.product?.name}</td>
                    <td>{item.product?.unit}</td>
                    <td>{formatRupiah(item.pricePerUnit)}</td>
                    <td>{item.quantity}</td>
                    <td>{formatRupiah(item.totalCost)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {item.notaUrl && (
                          <a href={item.notaUrl} target="_blank" rel="noreferrer" style={{ backgroundColor: '#0CA5EA', color: 'white', padding: '0.25rem', borderRadius: '50%', display: 'flex' }}>
                            <ImageIcon size={14} />
                          </a>
                        )}
                        <button style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.25rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Footer Summary */}
            {!loading && data.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={7} style={{ textAlign: 'right', fontWeight: 600, borderTop: '2px solid #e2e8f0' }}>Total Keseluruhan :</td>
                  <td style={{ fontWeight: 700, borderTop: '2px solid #e2e8f0' }}>{totalKeseluruhanUnit.toLocaleString('id-ID')}</td>
                  <td colSpan={2} style={{ fontWeight: 700, borderTop: '2px solid #e2e8f0' }}>{formatRupiah(totalKeseluruhanHarga)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="modal-panel stock-form-modal" style={{ backgroundColor: 'white', borderRadius: '1rem', width: '600px', maxWidth: '90%', padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
              <div style={{ backgroundColor: '#0CA5EA', padding: '0.4rem', borderRadius: '0.5rem', color: 'white' }}>
                <FileText size={20} />
              </div>
              Formulir Data Barang Masuk
            </h2>
            <button onClick={() => setIsAddModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Tanggal Masuk</label>
                <div>
                  <input type="date" {...register('entryDate')} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none' }} />
                  {errors.entryDate && <span style={{ color: 'red', fontSize: '0.75rem' }}>{errors.entryDate.message}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Pemasok</label>
                <div>
                  <select {...register('supplierId')} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none', backgroundColor: 'white' }}>
                    <option value="">Pilih Pemasok...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.supplierId && <span style={{ color: 'red', fontSize: '0.75rem' }}>{errors.supplierId.message}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Barang</label>
                <div>
                  <select {...register('productId')} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none', backgroundColor: 'white' }}>
                    <option value="">Pilih Barang...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {errors.productId && <span style={{ color: 'red', fontSize: '0.75rem' }}>{errors.productId.message}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Satuan</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                    <input type="radio" checked={unit.toLowerCase() === 'kardus'} readOnly /> Kardus
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                    <input type="radio" checked={unit.toLowerCase() === 'galon'} readOnly /> Galon
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Stok</label>
                <input type="text" value={currentStock} readOnly style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none', backgroundColor: '#f1f5f9' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Kuantitas</label>
                <div>
                  <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '0.25rem', overflow: 'hidden' }}>
                    <input type="number" placeholder="Barang Masuk..." {...register('quantity', { valueAsNumber: true })} style={{ flex: 1, padding: '0.5rem', border: 'none', outline: 'none' }} />
                    <span style={{ backgroundColor: '#f8fafc', padding: '0.5rem 1rem', borderLeft: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.875rem' }}>Jumlah</span>
                  </div>
                  {errors.quantity && <span style={{ color: 'red', fontSize: '0.75rem' }}>{errors.quantity.message}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Harga</label>
                <div>
                  <input type="number" placeholder="Harga per unit" {...register('pricePerUnit', { valueAsNumber: true })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none' }} />
                  {errors.pricePerUnit && <span style={{ color: 'red', fontSize: '0.75rem' }}>{errors.pricePerUnit.message}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Total</label>
                <input type="text" value={formatRupiah(totalCost)} readOnly style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none', backgroundColor: '#f1f5f9' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Total Stok</label>
                <input type="text" value={estimatedTotalStock} readOnly style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none', backgroundColor: '#f1f5f9' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Upload Nota</label>
                <input type="file" id="nota-upload" accept="image/*,application/pdf" style={{ fontSize: '0.875rem' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#006FB2', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                  {isSubmitting ? 'Menyimpan...' : 'Tambahkan Sekarang!'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }}>
          <div className="modal-panel" style={{ backgroundColor: 'white', borderRadius: '1rem', width: '300px', padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <CheckCircle size={80} color="#22c55e" style={{ margin: '0 auto 1rem auto' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Data Berhasil</h2>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Di Tambahkan</h2>
          </div>
        </div>
      )}

    </div>
  );
}
