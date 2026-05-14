'use client';

import { useState, useEffect } from 'react';
import { supplierService } from '@/services/supplier.service';
import { Building2, Plus, Eye, Edit, Trash2, MapPin, Phone, Upload } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Swal from 'sweetalert2';
import { getApiErrorMessage } from '@/lib/api-error';
import type { Supplier } from '@/types/api';

const supplierSchema = z.object({
  name: z.string().min(1, 'Nama Perusahaan wajib diisi'),
  phone: z.string().min(1, 'No Telp/WhatsApp wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function SupplierPage() {
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
  });

  const fetchData = async () => {
    try {
      const res = await supplierService.getAll();
      setData(res.data);
    } catch (error) {
      console.error('Error fetching suppliers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const res = await supplierService.getAll();
        if (!ignore) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Error fetching suppliers', error);
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

  const openEditModal = (item: Supplier) => {
    setValue('name', item.name);
    setValue('phone', item.phone || '');
    setValue('address', item.address || '');
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data pemasok akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await supplierService.delete(id);
        Swal.fire('Terhapus!', 'Data pemasok berhasil dihapus.', 'success');
        fetchData();
      } catch {
        Swal.fire('Error', 'Gagal menghapus data pemasok.', 'error');
      }
    }
  };

  const onSubmit = async (values: SupplierFormValues) => {
    try {
      if (editingId) {
        await supplierService.update(editingId, values);
        Swal.fire('Berhasil!', 'Data pemasok berhasil diperbarui.', 'success');
      } else {
        await supplierService.create(values);
        Swal.fire('Berhasil!', 'Data pemasok berhasil ditambahkan.', 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      Swal.fire('Gagal!', getApiErrorMessage(error, 'Terjadi kesalahan sistem.'), 'error');
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

          <button
            onClick={openAddModal}
            style={{ backgroundColor: '#006FB2', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
          >
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
                        <button onClick={() => openEditModal(item)} style={{ backgroundColor: '#0CA5EA', color: 'white', border: 'none', padding: '0.35rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.35rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
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

      {/* Modal Form Pemasok */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="700px"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#0CA5EA', padding: '0.5rem', borderRadius: '0.5rem', color: 'white', display: 'flex' }}>
              <Building2 size={24} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Formulir Data Perusahaan Pemasok</h2>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Baris: Nama Pemasok */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Nama Perusahaan Pemasok</label>
            <div>
              <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '0.375rem', overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={16} color="#94a3b8" />
                </div>
                <input
                  type="text"
                  {...register('name')}
                  style={{ flex: 1, padding: '0.5rem', border: 'none', outline: 'none' }}
                />
              </div>
              {errors.name && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.name.message}</span>}
            </div>
          </div>

          {/* Baris: No Telp */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>No. Telp/No. Whatsapp</label>
            <div>
              <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '0.375rem', overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={16} color="#94a3b8" />
                </div>
                <input
                  type="text"
                  {...register('phone')}
                  style={{ flex: 1, padding: '0.5rem', border: 'none', outline: 'none' }}
                />
              </div>
              {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.phone.message}</span>}
            </div>
          </div>

          {/* Baris: Alamat Pemasok */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'start', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', paddingTop: '0.5rem' }}>Alamat Pemasok</label>
            <div>
              <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '0.375rem', overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', display: 'flex', justifyContent: 'center' }}>
                  <MapPin size={16} color="#94a3b8" style={{ marginTop: '0.2rem' }} />
                </div>
                <textarea
                  {...register('address')}
                  rows={4}
                  style={{ flex: 1, padding: '0.5rem', border: 'none', outline: 'none', resize: 'vertical' }}
                />
              </div>
              {errors.address && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.address.message}</span>}
            </div>
          </div>

          {/* Baris: Foto Pemasok */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'start', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', paddingTop: '0.5rem' }}>Foto Perusahaan Pemasok</label>
            <div>
              <div style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: '#f8fafc',
                color: '#64748b'
              }}>
                <Upload size={24} color="#94a3b8" />
                <div style={{ fontSize: '0.85rem' }}>
                  seret dan lepas file di sini atau <button type="button" style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '0.25rem', padding: '0.1rem 0.5rem', cursor: 'pointer' }}>Browse</button>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>* Opsional (Belum didukung oleh backend)</span>
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
