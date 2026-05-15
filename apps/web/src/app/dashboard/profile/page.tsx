'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Phone, Lock, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/axios';
import { getApiErrorMessage } from '@/lib/api-error';

// ==========================================
// SCHEMAS
// ==========================================

const profileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Kata sandi lama wajib diisi'),
    newPassword: z.string().min(6, 'Kata sandi baru minimal 6 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirmPassword'],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

type ViewMode = 'view' | 'edit-profile' | 'edit-password';

// ==========================================
// KOMPONEN UTAMA
// ==========================================

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [mode, setMode] = useState<ViewMode>('view');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Form: ubah profil
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
    reset: resetProfile,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    },
  });

  // Form: ubah kata sandi
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPassword,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  // Buka mode edit profil — isi form dengan data terkini
  const openEditProfile = () => {
    resetProfile({
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    });
    setAvatarPreview(null);
    setMode('edit-profile');
  };

  const openEditPassword = () => {
    resetPassword();
    setMode('edit-password');
  };

  // Handle preview avatar sebelum upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Submit: update profil
  const onSubmitProfile = async (values: ProfileFormValues) => {
    try {
      const res = await api.patch('/auth/me', {
        name: values.name,
        phone: values.phone || undefined,
      });
      // Update Zustand store agar header ikut berubah
      updateUser({ name: res.data.data.name, phone: res.data.data.phone });
      Swal.fire('Berhasil!', 'Data profil berhasil diperbarui.', 'success');
      setMode('view');
    } catch (error: unknown) {
      Swal.fire('Gagal!', getApiErrorMessage(error, 'Gagal memperbarui profil.'), 'error');
    }
  };

  // Submit: ubah kata sandi
  const onSubmitPassword = async (values: PasswordFormValues) => {
    try {
      await api.patch('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      Swal.fire('Berhasil!', 'Kata sandi berhasil diubah.', 'success');
      resetPassword();
      setMode('view');
    } catch (error: unknown) {
      Swal.fire('Gagal!', getApiErrorMessage(error, 'Gagal mengubah kata sandi.'), 'error');
    }
  };

  // Foto yang ditampilkan: preview baru > avatar dari store > inisial
  const displayAvatar = avatarPreview ?? user?.avatarUrl ?? null;
  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <div>
      <h1 className="section-title" style={{ marginTop: 0 }}>Data Pengguna</h1>

      <div className="dash-card" style={{ maxWidth: '900px' }}>

        {/* ── Header kartu ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#0CA5EA', padding: '0.5rem', borderRadius: '0.5rem', color: 'white', display: 'flex' }}>
            <FileText size={20} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
            {mode === 'view' && 'Detail Data Pengguna'}
            {mode === 'edit-profile' && 'Ubah Detail Data Pengguna'}
            {mode === 'edit-password' && 'Ubah Kata Sandi Baru'}
          </h2>
        </div>

        {/* ══════════════════════════════════════
            MODE: VIEW
        ══════════════════════════════════════ */}
        {mode === 'view' && (
          <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                backgroundColor: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '4px solid #e2e8f0',
              }}>
                {displayAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '3.5rem', fontWeight: 700, color: '#94a3b8' }}>{userInitial}</span>
                )}
              </div>
            </div>

            {/* Info + tombol */}
            <div style={{ flex: 1, minWidth: '260px' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '2rem' }}>
                <tbody>
                  {[
                    { label: 'Nama Pengguna', value: user?.name?.split(' ')[0] ?? '-' },
                    { label: 'Nama', value: user?.name ?? '-' },
                    { label: 'Email', value: user?.email ?? '-' },
                    { label: 'No. Telp/No. Whatsapp', value: user?.phone ?? '-' },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td style={{ padding: '0.6rem 0', fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', width: '200px', verticalAlign: 'top' }}>
                        {row.label}
                      </td>
                      <td style={{ padding: '0.6rem 0', color: '#1e293b', fontSize: '0.9rem', verticalAlign: 'top' }}>
                        <span style={{ marginRight: '0.5rem', color: '#64748b' }}>:</span>
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={openEditProfile}
                  style={{
                    backgroundColor: '#006FB2',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Ubah Data Profil
                </button>
                <button
                  onClick={openEditPassword}
                  style={{
                    backgroundColor: '#0CA5EA',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Ubah Kata Sandi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            MODE: EDIT PROFIL
        ══════════════════════════════════════ */}
        {mode === 'edit-profile' && (
          <form onSubmit={handleSubmitProfile(onSubmitProfile)}>
            <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

              {/* Avatar + upload */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  backgroundColor: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '4px solid #e2e8f0',
                }}>
                  {displayAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '3.5rem', fontWeight: 700, color: '#94a3b8' }}>{userInitial}</span>
                  )}
                </div>
                {/* Upload area */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                  <span>seret dan lepas file di sini atau</span>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.25rem',
                      padding: '0.15rem 0.6rem',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    Browse
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              {/* Form fields */}
              <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                {/* Nama Pengguna (readonly — derived dari nama) */}
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Nama Pengguna</label>
                  <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '0.375rem', overflow: 'hidden' }}>
                    <div style={{ padding: '0.55rem 0.75rem', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', display: 'flex', alignItems: 'center' }}>
                      <User size={15} color="#94a3b8" />
                    </div>
                    <input
                      type="text"
                      value={user?.name?.split(' ')[0] ?? ''}
                      readOnly
                      style={{ flex: 1, padding: '0.55rem 0.75rem', border: 'none', outline: 'none', backgroundColor: '#f8fafc', color: '#64748b' }}
                    />
                  </div>
                </div>

                {/* Nama */}
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Nama</label>
                  <div>
                    <div style={{ display: 'flex', border: `1px solid ${profileErrors.name ? '#ef4444' : '#cbd5e1'}`, borderRadius: '0.375rem', overflow: 'hidden' }}>
                      <div style={{ padding: '0.55rem 0.75rem', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', display: 'flex', alignItems: 'center' }}>
                        <User size={15} color="#94a3b8" />
                      </div>
                      <input
                        type="text"
                        {...registerProfile('name')}
                        style={{ flex: 1, padding: '0.55rem 0.75rem', border: 'none', outline: 'none' }}
                      />
                    </div>
                    {profileErrors.name && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.2rem', display: 'block' }}>{profileErrors.name.message}</span>}
                  </div>
                </div>

                {/* Email (readonly) */}
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Email</label>
                  <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '0.375rem', overflow: 'hidden' }}>
                    <div style={{ padding: '0.55rem 0.75rem', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', display: 'flex', alignItems: 'center' }}>
                      <Mail size={15} color="#94a3b8" />
                    </div>
                    <input
                      type="email"
                      {...registerProfile('email')}
                      readOnly
                      style={{ flex: 1, padding: '0.55rem 0.75rem', border: 'none', outline: 'none', backgroundColor: '#f8fafc', color: '#64748b' }}
                    />
                  </div>
                </div>

                {/* No. Telp */}
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>No. Telp/No. Whatsapp</label>
                  <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '0.375rem', overflow: 'hidden' }}>
                    <div style={{ padding: '0.55rem 0.75rem', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', display: 'flex', alignItems: 'center' }}>
                      <Phone size={15} color="#94a3b8" />
                    </div>
                    <input
                      type="text"
                      {...registerProfile('phone')}
                      style={{ flex: 1, padding: '0.55rem 0.75rem', border: 'none', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Tombol */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setMode('view')}
                    style={{ border: '1px solid #cbd5e1', background: 'white', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isProfileSubmitting}
                    style={{ backgroundColor: '#006FB2', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, cursor: isProfileSubmitting ? 'not-allowed' : 'pointer', opacity: isProfileSubmitting ? 0.7 : 1, fontSize: '0.875rem' }}
                  >
                    {isProfileSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════
            MODE: UBAH KATA SANDI
        ══════════════════════════════════════ */}
        {mode === 'edit-password' && (
          <form onSubmit={handleSubmitPassword(onSubmitPassword)}>
            <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* Kata Sandi Lama */}
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Kata Sandi Lama</label>
                <div>
                  <input
                    type="password"
                    placeholder="Masukan Kata Sandi Lama"
                    {...registerPassword('currentPassword')}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', border: `1px solid ${passwordErrors.currentPassword ? '#ef4444' : '#cbd5e1'}`, borderRadius: '0.375rem', outline: 'none' }}
                  />
                  {passwordErrors.currentPassword && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.2rem', display: 'block' }}>{passwordErrors.currentPassword.message}</span>}
                </div>
              </div>

              {/* Kata Sandi Baru */}
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Kata Sandi Baru</label>
                <div>
                  <input
                    type="password"
                    placeholder="Masukan Kata Sandi Baru"
                    {...registerPassword('newPassword')}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', border: `1px solid ${passwordErrors.newPassword ? '#ef4444' : '#cbd5e1'}`, borderRadius: '0.375rem', outline: 'none' }}
                  />
                  {passwordErrors.newPassword && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.2rem', display: 'block' }}>{passwordErrors.newPassword.message}</span>}
                </div>
              </div>

              {/* Konfirmasi Kata Sandi */}
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Konfirmasi Kata Sandi baru</label>
                <div>
                  <input
                    type="password"
                    placeholder="Konfirmasi Kata Sandi Baru"
                    {...registerPassword('confirmPassword')}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', border: `1px solid ${passwordErrors.confirmPassword ? '#ef4444' : '#cbd5e1'}`, borderRadius: '0.375rem', outline: 'none' }}
                  />
                  {passwordErrors.confirmPassword && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.2rem', display: 'block' }}>{passwordErrors.confirmPassword.message}</span>}
                </div>
              </div>

              {/* Tombol */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  style={{ border: '1px solid #cbd5e1', background: 'white', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPasswordSubmitting}
                  style={{ backgroundColor: '#006FB2', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, cursor: isPasswordSubmitting ? 'not-allowed' : 'pointer', opacity: isPasswordSubmitting ? 0.7 : 1, fontSize: '0.875rem' }}
                >
                  {isPasswordSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
