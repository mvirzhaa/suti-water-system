'use client';

import { useState, useEffect } from 'react';
import { agentService } from '@/services/agent.service';
import { Users, Plus, Edit, Trash2, FileText } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Swal from 'sweetalert2';
import { getApiErrorMessage } from '@/lib/api-error';
import type { Agent } from '@/types/api';

const agentSchema = z.object({
  name: z.string().min(1, 'Nama Agen wajib diisi'),
  pic: z.string().min(1, 'Penanggung Jawab wajib diisi'),
  phone: z.string().min(1, 'No Telp/WhatsApp wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),
});

type AgentFormValues = z.infer<typeof agentSchema>;

export default function AgentPage() {
  const [data, setData] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
  });

  const fetchData = async () => {
    try {
      const res = await agentService.getAll();
      setData(res.data);
    } catch (error) {
      console.error('Error fetching agents', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const res = await agentService.getAll();
        if (!ignore) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Error fetching agents', error);
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

  const openEditModal = (item: Agent) => {
    setValue('name', item.name);
    setValue('pic', item.pic || '');
    setValue('phone', item.phone || '');
    setValue('address', item.address || '');
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data agen akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await agentService.delete(id);
        fetchData();
        Swal.fire('Terhapus!', 'Data agen berhasil dihapus.', 'success');
      } catch {
        Swal.fire('Error', 'Gagal menghapus data agen.', 'error');
      }
    }
  };

  const onSubmit = async (values: AgentFormValues) => {
    try {
      if (editingId) {
        await agentService.update(editingId, values);
      } else {
        await agentService.create(values);
      }
      setIsModalOpen(false);
      fetchData();
      Swal.fire({
        title: 'Berhasil!',
        text: editingId ? 'Data agen berhasil diperbarui.' : 'Data agen berhasil ditambahkan.',
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
      <h1 className="section-title" style={{ marginTop: 0 }}>Agen</h1>

      <div className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', color: '#1e293b' }}>
            <div style={{ backgroundColor: '#0CA5EA', padding: '0.5rem', borderRadius: '0.5rem', color: 'white' }}>
              <Users size={20} />
            </div>
            Data Detail Agen
          </h2>

          <button
            onClick={openAddModal}
            style={{ backgroundColor: '#006FB2', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={18} /> Tambah Data Agen
          </button>
        </div>

        <div className="table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nama Agen</th>
                <th>Penanggung Jawab</th>
                <th style={{ textAlign: 'center' }}>No. HP/No. Whatsapp</th>
                <th>Alamat</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>Belum ada data agen</td></tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.name}</td>
                    <td>{item.pic || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{item.phone || '-'}</td>
                    <td style={{ maxWidth: '300px' }}>{item.address || '-'}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Agen */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="700px"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#0CA5EA', padding: '0.5rem', borderRadius: '0.5rem', color: 'white', display: 'flex' }}>
              <FileText size={24} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Formulir Data Agen</h2>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Baris: Nama Agen */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Nama Agen</label>
            <div>
              <input
                type="text"
                {...register('name')}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', outline: 'none' }}
              />
              {errors.name && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.name.message}</span>}
            </div>
          </div>

          {/* Baris: Penanggung Jawab */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Penanggung Jawab</label>
            <div>
              <input
                type="text"
                {...register('pic')}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', outline: 'none' }}
              />
              {errors.pic && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.pic.message}</span>}
            </div>
          </div>

          {/* Baris: No Telp */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>No. telp/No. Whatsapp</label>
            <div>
              <input
                type="text"
                {...register('phone')}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', outline: 'none' }}
              />
              {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.phone.message}</span>}
            </div>
          </div>

          {/* Baris: Alamat */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'start', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right', paddingTop: '0.5rem' }}>Alamat</label>
            <div>
              <textarea
                {...register('address')}
                rows={4}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', outline: 'none', resize: 'vertical' }}
              />
              {errors.address && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.address.message}</span>}
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
