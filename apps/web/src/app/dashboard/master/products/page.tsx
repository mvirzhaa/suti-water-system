'use client';

import { useState, useEffect } from 'react';
import { productService } from '@/services/product.service';
import { Box, Plus, Edit, Trash2, FileText } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Swal from 'sweetalert2';
import { getApiErrorMessage } from '@/lib/api-error';
import type { Product } from '@/types/api';

// Format currency
const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

const productSchema = z.object({
  sku: z.string().min(1, 'Kode Barang wajib diisi'),
  name: z.string().min(1, 'Nama Barang wajib diisi'),
  description: z.string().min(1, 'Jenis Barang wajib diisi'),
  unit: z.enum(['Kardus', 'Galon'], { error: 'Pilih satuan barang' }),
  priceBuy: z.coerce.number().min(0, 'Harga beli tidak boleh negatif'),
  priceSell: z.coerce.number().min(1, 'Harga jual wajib diisi'),
});

type ProductFormValues = z.infer<typeof productSchema>;
type ProductFormInput = z.input<typeof productSchema>;

export default function ProductPage() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      unit: 'Kardus'
    }
  });

  const fetchData = async () => {
    try {
      const res = await productService.getAll();
      setData(res.data);
    } catch (error) {
      console.error('Error fetching products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const res = await productService.getAll();
        if (!ignore) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Error fetching products', error);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  const openAddModal = () => {
    reset();
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Product) => {
    setValue('sku', item.sku || '');
    setValue('name', item.name);
    setValue('description', item.description || '');
    setValue('unit', item.unit === 'Galon' ? 'Galon' : 'Kardus');
    setValue('priceBuy', item.priceBuy ?? item.priceSell);
    setValue('priceSell', item.priceSell);
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data barang akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await productService.delete(id);
        fetchData();
        Swal.fire('Terhapus!', 'Data barang berhasil dihapus.', 'success');
      } catch {
        Swal.fire('Error', 'Gagal menghapus data barang.', 'error');
      }
    }
  };

  const onSubmit = async (values: ProductFormValues) => {
    try {
      const payload = { ...values };
      if (editingId) {
        await productService.update(editingId, payload);
      } else {
        await productService.create(payload);
      }
      setIsModalOpen(false);
      fetchData();
      Swal.fire({
        title: 'Berhasil!',
        text: editingId ? 'Data barang berhasil diperbarui.' : 'Data barang berhasil ditambahkan.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: unknown) {
      Swal.fire('Gagal!', getApiErrorMessage(error, 'Terjadi kesalahan sistem.'), 'error');
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

          <button
            onClick={openAddModal}
            style={{ backgroundColor: '#006FB2', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
          >
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
                <th>Harga Beli</th>
                <th>Harga Jual</th>
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
                  return (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.sku || '-'}</td>
                      <td>{item.name}</td>
                      <td>{item.description || '-'}</td>
                      <td>{item.unit}</td>
                      <td>{item.priceBuy != null ? formatRupiah(item.priceBuy) : '-'}</td>
                      <td>{formatRupiah(item.priceSell)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button onClick={() => openEditModal(item)} style={{ backgroundColor: '#0CA5EA', color: 'white', border: 'none', padding: '0.35rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.35rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
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

      {/* Modal Form Barang */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="700px"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#0CA5EA', padding: '0.5rem', borderRadius: '0.5rem', color: 'white', display: 'flex' }}>
              <FileText size={24} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Formulir Data Barang</h2>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Baris: Kode Barang */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Kode Barang</label>
            <div>
              <input
                type="text"
                placeholder="SW0001"
                {...register('sku')}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', outline: 'none' }}
              />
              {errors.sku && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.sku.message}</span>}
            </div>
          </div>

          {/* Baris: Nama Barang */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Nama Barang</label>
            <div>
              <input
                type="text"
                {...register('name')}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', outline: 'none' }}
              />
              {errors.name && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.name.message}</span>}
            </div>
          </div>

          {/* Baris: Jenis Barang */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Jenis Barang</label>
            <div>
              <input
                type="text"
                {...register('description')}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', outline: 'none' }}
              />
              {errors.description && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.description.message}</span>}
            </div>
          </div>

          {/* Baris: Satuan Barang (Radio) */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Satuan Barang</label>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                <input
                  type="radio"
                  value="Kardus"
                  {...register('unit')}
                  style={{ cursor: 'pointer' }}
                />
                Kardus
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                <input
                  type="radio"
                  value="Galon"
                  {...register('unit')}
                  style={{ cursor: 'pointer' }}
                />
                Galon
              </label>
            </div>
          </div>

          {/* Baris: Harga Beli */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Harga Beli</label>
            <div>
              <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '0.375rem', overflow: 'hidden' }}>
                <div style={{ padding: '0.6rem', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#64748b' }}>
                  Rp.
                </div>
                <input
                  type="number"
                  {...register('priceBuy')}
                  style={{ flex: 1, padding: '0.6rem', border: 'none', outline: 'none' }}
                />
              </div>
              {errors.priceBuy && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.priceBuy.message}</span>}
            </div>
          </div>

          {/* Baris: Harga Jual */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Harga Jual</label>
            <div>
              <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '0.375rem', overflow: 'hidden' }}>
                <div style={{ padding: '0.6rem', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#64748b' }}>
                  Rp.
                </div>
                <input
                  type="number"
                  {...register('priceSell')}
                  style={{ flex: 1, padding: '0.6rem', border: 'none', outline: 'none' }}
                />
              </div>
              {errors.priceSell && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.priceSell.message}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: '#006FB2',
                color: 'white',
                border: 'none',
                padding: '0.6rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Menyimpan...' : 'Tambahkan Sekarang!'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
