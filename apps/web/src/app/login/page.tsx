'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData, authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';

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
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Terjadi kesalahan saat login');
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
            src="https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=800&auto=format&fit=crop" 
            alt="Suti Water Splash" 
          />
        </div>

        {/* Right Side: Form */}
        <div className="auth-form-side">
          <div className="auth-logo">
            <svg width="100" height="120" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 0C50 0 10 50 10 80C10 102.091 27.9086 120 50 120C72.0914 120 90 102.091 90 80C90 50 50 0 50 0Z" fill="url(#paint0_linear)"/>
              <path d="M25 85L45 60L55 75L75 45L90 80H10L25 85Z" fill="#84CC16"/>
              <text x="50" y="100" fill="white" fontSize="28" fontWeight="bold" fontFamily="Poppins" textAnchor="middle" letterSpacing="1">Suti</text>
              <defs>
                <linearGradient id="paint0_linear" x1="50" y1="0" x2="50" y2="120" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0CA5EA"/>
                  <stop offset="1" stopColor="#006FB2"/>
                </linearGradient>
              </defs>
            </svg>
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
