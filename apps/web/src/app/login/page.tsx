'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData, authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { getApiErrorMessage } from '@/lib/api-error';

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

  const handleGoogleLogin = () => {
    window.location.href = authService.getGoogleAuthUrl();
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
            <img src="/images/logo-login2.png" alt="Suti Water Logo" width="100" height="120" />
          </div>

          <h1 className="auth-title">Selamat Datang</h1>

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
            
            <button type="button" className="btn btn-google" onClick={handleGoogleLogin}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="20" height="20" />
              Lanjutkan dengan google
            </button>
          </form>

          <p className="auth-links">
            Belum punya akun? <Link href="/register" className="auth-link">Buat Akun</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
