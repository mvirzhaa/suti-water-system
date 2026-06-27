'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData, authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { getApiErrorMessage } from '@/lib/api-error';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setErrorMsg(null);
      const res = await authService.login(data);
      
      // Simpan data user & token ke Zustand (akan tersimpan juga di localStorage)
      setAuth(res.data.user, res.data.accessToken);
      
      // Redirect ke Dashboard
      router.push('/dashboard');
    } catch (error: unknown) {
      setErrorMsg(getApiErrorMessage(error, 'Terjadi kesalahan saat login'));
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Left Side: Image */}
        <div className="auth-image-side">
          <img 
            src="/images/logo-login.png" 
            alt="Suti Water Splash" 
          />
        </div>

        {/* Right Side: Form */}
        <div className="auth-form-side">
          <div className="auth-logo">
            <img src="/images/logo-login2.png" alt="Suti Water Logo" width="100" height="120" style={{ objectFit: 'contain' }} />
          </div>

          <h1 className="auth-title">Selamat Datang</h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', marginBottom: '0.75rem', maxWidth: '300px' }}>
            Sistem internal SUTI Water. Masuk menggunakan akun yang telah diverifikasi oleh administrator.
          </p>

          {errorMsg && (
            <div style={{ width: '100%', maxWidth: '360px', padding: '0.75rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <input 
                type="email" 
                placeholder="Email Pengguna" 
                className="auth-input"
                {...register('email')}
              />
              {errors.email && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginLeft: '1rem' }}>{errors.email.message}</span>}
            </div>
            
            <div className="form-group">
              <input 
                type="password" 
                placeholder="Kata Sandi" 
                className="auth-input"
                {...register('password')}
              />
              {errors.password && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginLeft: '1rem' }}>{errors.password.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
            Belum punya akun? Hubungi administrator untuk mendapatkan akses.
          </p>
          <Link href="/" style={{ fontSize: '0.78rem', color: '#0CA5EA', textDecoration: 'none', marginTop: '0.5rem', display: 'block', textAlign: 'center' }}>
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
