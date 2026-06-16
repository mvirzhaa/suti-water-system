'use client';

import { useState, useEffect, useRef } from 'react';
import { stockOutService } from '@/services/stock-out.service';
import { productService } from '@/services/product.service';
import { discountService } from '@/services/discount.service';
import { agentService } from '@/services/agent.service';
import { ArrowUpFromLine, Plus, Image as ImageIcon, Trash2, FileText, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/store/useAuthStore';
import Swal from 'sweetalert2';
import { WATER_SIZES } from '@/lib/water-sizes';
import type { Agent, Discount, Product, StockOutRecord } from '@/types/api';

// Format currency
const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

// Zod Schema
const stockOutSchema = z.object({
  exitDate: z.string().min(1, 'Tanggal wajib diisi'),
  agentId: z.string().optional(),
  buyerName: z.string().optional(), // For general buyers
  buyerAddress: z.string().optional(), // Maps to 'notes' in backend
  productId: z.string().min(1, 'Barang wajib dipilih'),
  quantity: z.number().min(1, 'Kuantitas minimal 1'),
  pricePerUnit: z.number().min(0, 'Harga tidak boleh negatif'),
  discountId: z.string().optional(),
  size: z.enum(WATER_SIZES).optional(),
  nota: z.any().optional(),
});
type StockOutFormData = z.infer<typeof stockOutSchema>;

export default function StockOutPage() {
  const [data, setData] = useState<StockOutRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const LIMIT = 15;

  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'PIMPINAN';
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewNotaUrl, setPreviewNotaUrl] = useState<string | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileUrl(URL.createObjectURL(file));
    } else {
      setSelectedFileUrl(null);
    }
  };

  // Ref untuk file input nota
  const notaInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm<StockOutFormData>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: { quantity: 0, pricePerUnit: 0 }
  });

  const selectedProductId = watch('productId');
  const selectedDiscountId = watch('discountId');
  const quantity = watch('quantity') || 0;
  
  const selectedProduct = products.find(p => p.id === selectedProductId);
  // Hanya tampilkan diskon yang aktif dan masa berlakunya valid
  const today = new Date().toISOString().slice(0, 10);
  const activeDiscounts = discounts.filter(d =>
    d.isActive &&
    d.startDate <= today &&
    (!d.endDate || d.endDate >= today)
  );
  const selectedDiscount = activeDiscounts.find(d => d.id === selectedDiscountId);

  // Derived values for the form UI
  const currentStock = selectedProduct?.stock || 0;
  const unit = selectedProduct?.unit || 'Pcs';
  const sku = selectedProduct?.sku || '';
  
  // Update price when product changes
  useEffect(() => {
    if (selectedProduct) {
      setValue('pricePerUnit', Number(selectedProduct.priceSell));
    }
  }, [selectedProduct, setValue]);

  const pricePerUnit = watch('pricePerUnit') || 0;
  const subTotal = quantity * pricePerUnit;
  
  // Hitung Diskon berdasarkan pilihan user
  let discountAmount = 0;
  let discountDisplay = 'Tidak ada diskon';
  if (selectedDiscount) {
    if (selectedDiscount.type === 'PERCENTAGE') {
      discountAmount = subTotal * (Number(selectedDiscount.value) / 100);
      discountDisplay = `${selectedDiscount.value}% = ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(discountAmount)}`;
    } else {
      discountAmount = Number(selectedDiscount.value);
      discountDisplay = `Rp ${Number(selectedDiscount.value).toLocaleString('id-ID')}`;
    }
  }
  
  const totalHarga = subTotal - discountAmount;
  const estimatedTotalStock = currentStock - Number(quantity);

  useEffect(() => {
    fetchData(page);
    fetchProducts();
    fetchDiscounts();
    fetchAgents();
  }, []);

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const fetchData = async (currentPage = 1) => {
    try {
      setLoading(true);
      const res = await stockOutService.getAll({ page: currentPage, limit: LIMIT });
      setData(res.data);
      if (res.meta) {
        setTotalPages(res.meta.totalPages ?? 1);
        setTotalItems(res.meta.total ?? 0);
      }
    } catch (error) {
      console.error('Error fetching stock out', error);
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

  const fetchDiscounts = async () => {
    try {
      const res = await discountService.getAllActive();
      // Asumsi res.data adalah array diskon
      setDiscounts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching discounts', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await agentService.getAll();
      setAgents(res.data);
    } catch (error) {
      console.error('Error fetching agents', error);
    }
  };

  const onSubmit = async (formData: StockOutFormData) => {
    if (estimatedTotalStock < 0) {
      Swal.fire('Stok Tidak Cukup', 'Stok tidak mencukupi untuk jumlah barang keluar ini!', 'warning');
      return;
    }

    try {
      const payload = new FormData();
      payload.append('productId', formData.productId);
      payload.append('quantity', formData.quantity.toString());
      payload.append('pricePerUnit', formData.pricePerUnit.toString());
      payload.append('exitDate', formData.exitDate);
      
      if (formData.agentId) {
        payload.append('agentId', formData.agentId);
      } else if (formData.buyerName) {
        payload.append('buyerName', formData.buyerName);
      }
      
      if (formData.buyerAddress) payload.append('notes', `Alamat: ${formData.buyerAddress}`);
      if (formData.discountId) payload.append('discountId', formData.discountId);
      if (formData.size) payload.append('size', formData.size);
      
      const fileInput = notaInputRef.current;
      if (fileInput && fileInput.files && fileInput.files[0]) {
        payload.append('nota', fileInput.files[0]);
      }

      await stockOutService.create(payload);
      
      setIsAddModalOpen(false);
      reset();
      setSelectedFileUrl(null);
      if (notaInputRef.current) notaInputRef.current.value = '';
      setPage(1);
      await fetchData(1);
      Swal.fire({ title: 'Berhasil!', text: 'Data barang keluar berhasil ditambahkan.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error: unknown) {
      Swal.fire('Gagal!', getApiErrorMessage(error, 'Terjadi kesalahan saat menyimpan data'), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus data barang keluar?',
      text: 'Stok produk akan dikembalikan secara otomatis. Tindakan ini tidak bisa dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      try {
        await stockOutService.delete(id);
        const newPage = data.length === 1 && page > 1 ? page - 1 : page;
        setPage(newPage);
        await fetchData(newPage);
        Swal.fire('Terhapus!', 'Data barang keluar berhasil dihapus dan stok telah dikembalikan.', 'success');
      } catch (error: unknown) {
        Swal.fire('Gagal!', getApiErrorMessage(error, 'Gagal menghapus data barang keluar.'), 'error');
      }
    }
  };

  const totalKeseluruhanUnit = data.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalKeseluruhanHarga = data.reduce((acc, curr) => acc + Number(curr.totalPrice), 0);

  return (
    <div>
      {/* Main Container */}
      <div className="dash-card">
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', color: '#1e293b' }}>
            <div style={{ backgroundColor: '#0CA5EA', padding: '0.5rem', borderRadius: '0.5rem', color: 'white' }}>
              <ArrowUpFromLine size={20} />
            </div>
            Riwayat Barang Keluar
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
            <Plus size={18} /> Tambah Data Barang Keluar
          </button>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Kode Barang</th>
                <th>Tanggal Keluar</th>
                <th>Barang</th>
                <th>Ukuran</th>
                <th>Nama Agen/Pembeli</th>
                <th>Alamat Pembeli</th>
                <th>Harga</th>
                <th>Diskon</th>
                <th>Jumlah</th>
                <th>Total Harga</th>
                <th>Sisa Stok</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={13} style={{ textAlign: 'center' }}>Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={13} style={{ textAlign: 'center' }}>Belum ada data barang keluar</td></tr>
              ) : (
                data.map((item, index) => {
                  const alamat = item.notes?.replace('Alamat: ', '') || '-';
                  const diskonStr = item.discount ? `(${item.discount.value}%)` : 'Rp. -';
                  return (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.product?.sku || '-'}</td>
                      <td>{new Date(item.exitDate).toLocaleDateString('id-ID')}</td>
                      <td>{item.product?.name}</td>
                      <td>{item.size || '-'}</td>
                      <td>{item.agent?.name || item.buyerName || '-'}</td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alamat}</td>
                      <td>{formatRupiah(item.pricePerUnit)}</td>
                      <td>{item.discountAmount > 0 ? `${formatRupiah(item.discountAmount)} ${diskonStr}` : 'Rp. -'}</td>
                      <td>{item.quantity}</td>
                      <td>{formatRupiah(item.totalPrice)}</td>
                      <td style={{ fontWeight: 600 }}>{item.productStockSnapshot ?? '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                          {item.notaUrl ? (
                            <button onClick={() => setPreviewNotaUrl(item.notaUrl!)} style={{ backgroundColor: '#0CA5EA', color: 'white', padding: '0.25rem', border: 'none', borderRadius: '50%', display: 'flex', cursor: 'pointer' }} title="Lihat Nota">
                              <ImageIcon size={14} />
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tidak ada nota</span>
                          )}
                          <button style={{ backgroundColor: '#0CA5EA', color: 'white', border: 'none', padding: '0.25rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }} onClick={() => router.push(`/dashboard/stock-out/surat-penagihan/${item.id}`)} title="Cetak Surat Penagihan">
                            <FileText size={14} />
                          </button>
                          <button style={{ backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '0.25rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }} onClick={() => router.push(`/dashboard/stock-out/surat-jalan/${item.id}`)} title="Cetak Surat Jalan">
                            <Truck size={14} />
                          </button>
                          {canDelete && (
                            <button style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.25rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }} onClick={() => handleDelete(item.id)} title="Hapus data barang keluar">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {/* Footer Summary */}
            {!loading && data.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={9} style={{ textAlign: 'right', fontWeight: 600, borderTop: '2px solid #e2e8f0' }}>Total Keseluruhan :</td>
                  <td style={{ fontWeight: 700, borderTop: '2px solid #e2e8f0' }}>{totalKeseluruhanUnit.toLocaleString('id-ID')}</td>
                  <td colSpan={2} style={{ fontWeight: 700, borderTop: '2px solid #e2e8f0' }}>{formatRupiah(totalKeseluruhanHarga)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Menampilkan {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, totalItems)} dari {totalItems} data
            </span>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <button type="button" onClick={() => setPage(1)} disabled={page === 1}
                style={{ padding: '0.3rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', backgroundColor: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: '0.8rem' }}>«</button>
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '0.3rem 0.7rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', backgroundColor: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: '0.8rem' }}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                return (
                  <button key={p} type="button" onClick={() => setPage(p)}
                    style={{ padding: '0.3rem 0.65rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', backgroundColor: p === page ? '#006FB2' : 'white', color: p === page ? 'white' : '#1e293b', cursor: 'pointer', fontWeight: p === page ? 700 : 400, fontSize: '0.8rem' }}
                  >{p}</button>
                );
              })}
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '0.3rem 0.7rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', backgroundColor: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontSize: '0.8rem' }}>›</button>
              <button type="button" onClick={() => setPage(totalPages)} disabled={page === totalPages}
                style={{ padding: '0.3rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', backgroundColor: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontSize: '0.8rem' }}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="modal-panel stock-form-modal" style={{ backgroundColor: 'white', borderRadius: '1rem', width: '650px', maxWidth: '95%', padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
              <div style={{ backgroundColor: '#0CA5EA', padding: '0.4rem', borderRadius: '0.5rem', color: 'white' }}>
                <FileText size={20} />
              </div>
              Formulir Data Barang Keluar
            </h2>
            <button onClick={() => setIsAddModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '1rem' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Kode Barang</label>
                <input type="text" value={sku} readOnly style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none', backgroundColor: '#f1f5f9' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Stok Tersedia</label>
                <input type="text" value={currentStock} readOnly style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none', backgroundColor: '#f1f5f9' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Barang Keluar</label>
                <div>
                  <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '0.25rem', overflow: 'hidden' }}>
                    <input type="number" placeholder="Jumlah Keluar..." {...register('quantity', { valueAsNumber: true })} style={{ flex: 1, padding: '0.5rem', border: 'none', outline: 'none' }} />
                    <span style={{ backgroundColor: '#f8fafc', padding: '0.5rem 1rem', borderLeft: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.875rem' }}>Jumlah</span>
                  </div>
                  {errors.quantity && <span style={{ color: 'red', fontSize: '0.75rem' }}>{errors.quantity.message}</span>}
                  {estimatedTotalStock < 0 && <span style={{ color: 'red', fontSize: '0.75rem' }}>Stok tidak mencukupi!</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Total</label>
                <input type="text" value={formatRupiah(subTotal)} readOnly style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none', backgroundColor: '#f1f5f9' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Tanggal Keluar</label>
                <div>
                  <input type="date" {...register('exitDate')} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none' }} />
                  {errors.exitDate && <span style={{ color: 'red', fontSize: '0.75rem' }}>{errors.exitDate.message}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '1rem' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Ukuran</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  {WATER_SIZES.map((s) => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input type="radio" value={s} {...register('size')} /> {s}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Nama Agen</label>
                <div>
                  <select {...register('agentId')} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none', backgroundColor: 'white' }}>
                    <option value="">Pilih Agen...</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  {errors.agentId && <span style={{ color: 'red', fontSize: '0.75rem' }}>{errors.agentId.message}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'flex-start', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, paddingTop: '0.5rem' }}>Alamat Pembeli</label>
                <textarea rows={3} placeholder="Alamat lengkap..." {...register('buyerAddress')} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none', resize: 'vertical' }}></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Harga Jual</label>
                <div>
                  <input type="number" {...register('pricePerUnit', { valueAsNumber: true })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none', backgroundColor: 'white' }} />
                  {errors.pricePerUnit && <span style={{ color: 'red', fontSize: '0.75rem' }}>{errors.pricePerUnit.message}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Diskon</label>
                <div>
                  <select {...register('discountId')} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none', backgroundColor: 'white' }}>
                    <option value="">Tidak pakai diskon</option>
                    {activeDiscounts.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {d.type === 'PERCENTAGE' ? `${d.value}%` : `Rp ${Number(d.value).toLocaleString('id-ID')}`}
                      </option>
                    ))}
                  </select>
                  {selectedDiscount && (
                    <span style={{ fontSize: '0.75rem', color: '#0CA5EA', marginTop: '0.2rem', display: 'block' }}>
                      Potongan: {discountDisplay}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Total Harga</label>
                <input type="text" value={formatRupiah(totalHarga)} readOnly style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none', backgroundColor: '#f1f5f9', fontWeight: 'bold', color: '#0CA5EA' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Stok Akhir</label>
                <input type="text" value={estimatedTotalStock} readOnly style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', outline: 'none', backgroundColor: '#f1f5f9', fontWeight: 'bold', color: estimatedTotalStock < 0 ? 'red' : 'black' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'flex-start', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, paddingTop: '0.5rem' }}>Upload Nota</label>
                <div>
                  <input ref={notaInputRef} type="file" accept="image/*,application/pdf" style={{ fontSize: '0.875rem' }} onChange={handleFileChange} />
                  {selectedFileUrl && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img src={selectedFileUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }} />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" disabled={isSubmitting || estimatedTotalStock < 0} style={{ backgroundColor: '#006FB2', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '0.5rem', fontWeight: 600, cursor: estimatedTotalStock < 0 ? 'not-allowed' : 'pointer', opacity: estimatedTotalStock < 0 ? 0.5 : 1 }}>
                  {isSubmitting ? 'Menyimpan...' : 'Tambahkan Sekarang!'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Nota Preview Modal */}
      {previewNotaUrl && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }} onClick={() => setPreviewNotaUrl(null)}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewNotaUrl(null)} style={{ position: 'absolute', top: '-1rem', right: '-1rem', background: 'white', color: 'black', border: 'none', borderRadius: '50%', width: '30px', height: '30px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 101 }}>&times;</button>
            <img src={previewNotaUrl} alt="Preview Nota" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '0.5rem', backgroundColor: 'white' }} />
          </div>
        </div>
      )}

    </div>
  );
}
