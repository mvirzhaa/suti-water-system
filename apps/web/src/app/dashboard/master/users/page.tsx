'use client';

import { useState, useEffect } from 'react';
import { userService } from '@/services/user.service';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Swal from 'sweetalert2';
import { getApiErrorMessage } from '@/lib/api-error';
import type { User } from '@/types/api';

const userSchema = z.object({
  username: z.string().optional(), // Dummy field to match design
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'PIMPINAN', 'STAFF'], { error: 'Pilih role' }),
  password: z.string().min(6, 'Password minimal 6 karakter').optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UserPage() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'STAFF'
    }
  });

  const fetchData = async () => {
    try {
      const res = await userService.getAll();
      setData(res.data);
    } catch (error) {
      console.error('Error fetching users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const res = await userService.getAll();
        if (!ignore) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Error fetching users', error);
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

  const openEditModal = (item: User) => {
    const username = item.email.split('@')[0];
    setValue('username', username);
    setValue('name', item.name);
    setValue('email', item.email);
    setValue('phone', item.phone || '');
    setValue('role', item.role);
    setValue('password', '');
    setValue('confirmPassword', '');
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data pengguna akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await userService.delete(id);
        fetchData();
        Swal.fire('Terhapus!', 'Data pengguna berhasil dihapus.', 'success');
      } catch {
        Swal.fire('Error', 'Gagal menghapus data pengguna.', 'error');
      }
    }
  };

  const onSubmit = async (values: UserFormValues) => {
    try {
      const payload: {
        name: string;
        email: string;
        phone?: string;
        role: UserFormValues['role'];
        password?: string;
      } = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: values.role,
      };

      if (values.password) {
        payload.password = values.password;
      }

      if (editingId) {
        await userService.update(editingId, payload);
      } else {
        if (!values.password) {
          Swal.fire('Gagal!', 'Password wajib diisi untuk pengguna baru.', 'error');
          return;
        }
        await userService.create(payload);
      }
      setIsModalOpen(false);
      fetchData();
      Swal.fire({
        title: 'Berhasil!',
        text: editingId ? 'Data pengguna berhasil diperbarui.' : 'Data pengguna berhasil ditambahkan.',
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
      <h1 className="section-title" style={{ marginTop: 0 }}>Data Pengguna</h1>

      <div className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', color: '#1e293b' }}>
            <div style={{ backgroundColor: '#0CA5EA', padding: '0.5rem', borderRadius: '0.5rem', color: 'white' }}>
              <FileText size={20} />
            </div>
            Masukan Data Pengguna
          </h2>

          <button
            onClick={openAddModal}
            style={{ backgroundColor: '#006FB2', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={18} /> Tambah Data Pengguna
          </button>
        </div>

        <div className="table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nama</th>
                <th>Nama Pengguna</th>
                <th>Email</th>
                <th style={{ textAlign: 'center' }}>No. Telp/No. Whatsapp</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>Belum ada data pengguna</td></tr>
              ) : (
                data.map((item, index) => {
                  const username = item.email.split('@')[0];
                  return (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.name}</td>
                      <td>{username}</td>
                      <td>{item.email}</td>
                      <td style={{ textAlign: 'center' }}>{item.phone || '-'}</td>
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

      {/* Modal Form Pengguna */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="700px"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#0CA5EA', padding: '0.5rem', borderRadius: '0.5rem', color: 'white', display: 'flex' }}>
              <FileText size={24} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Formulir Data Pengguna</h2>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Baris: Nama Pengguna */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Nama Pengguna</label>
            <div>
              <input
                type="text"
                {...register('username')}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', outline: 'none' }}
              />
            </div>
          </div>

          {/* Baris: Kata Sandi */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Kata Sandi</label>
            <div>
              <input
                type="password"
                {...register('password')}
                placeholder={editingId ? '(Kosongkan jika tidak ingin diubah)' : ''}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', outline: 'none' }}
              />
              {errors.password && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.password.message}</span>}
            </div>
          </div>

          {/* Baris: Konfirmasi Kata Sandi */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Konfirmasi Kata Sandi</label>
            <div>
              <input
                type="password"
                {...register('confirmPassword')}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', outline: 'none' }}
              />
              {errors.confirmPassword && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.confirmPassword.message}</span>}
            </div>
          </div>

          {/* Baris: Nama */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Nama Lengkap</label>
            <div>
              <input
                type="text"
                {...register('name')}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', outline: 'none' }}
              />
              {errors.name && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.name.message}</span>}
            </div>
          </div>

          {/* Baris: Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Email</label>
            <div>
              <input
                type="email"
                {...register('email')}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', outline: 'none' }}
              />
              {errors.email && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.email.message}</span>}
            </div>
          </div>

          {/* Baris: No Telp */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>No. Telp/No. Whatsapp</label>
            <div>
              <input
                type="text"
                {...register('phone')}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', outline: 'none' }}
              />
              {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.phone.message}</span>}
            </div>
          </div>

          {/* Baris: Role (Tambahan untuk fungsi backend) */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Role Akses</label>
            <div>
              <select
                {...register('role')}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', outline: 'none', backgroundColor: 'white' }}
              >
                <option value="STAFF">Staff (Kasir/Gudang)</option>
                <option value="PIMPINAN">Pimpinan (Viewer)</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
              {errors.role && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.role.message}</span>}
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
