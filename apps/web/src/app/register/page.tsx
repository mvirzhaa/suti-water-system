'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData, authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { getApiErrorMessage } from '@/lib/api-error';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setErrorMsg(null);
      // Panggil API register
      await authService.register({
        name: data.name,
        email: data.email,
        password: data.password
      });
      
      // Jika register berhasil, langsung login otomatis
      const loginRes = await authService.login({
        email: data.email,
        password: data.password
      });
      
      setAuth(loginRes.data.user, loginRes.data.accessToken);
      router.push('/dashboard');
    } catch (error: unknown) {
      setErrorMsg(getApiErrorMessage(error, 'Terjadi kesalahan saat pendaftaran'));
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
            <svg width="80" height="100" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
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

          <h1 className="auth-title" style={{ marginBottom: '1.5rem' }}>Buat akun baru</h1>

          {errorMsg && (
            <div style={{ width: '100%', padding: '0.75rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          <form className="auth-form register-form" onSubmit={handleSubmit(onSubmit)}>
            
            <div className="form-group">
              <input 
                type="text" 
                placeholder="Nama Lengkap" 
                className="auth-input"
                {...register('name')}
              />
              {errors.name && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginLeft: '1rem' }}>{errors.name.message}</span>}
            </div>

            <div className="form-group">
              <input 
                type="email" 
                placeholder="Email" 
                className="auth-input"
                {...register('email')}
              />
              {errors.email && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginLeft: '1rem' }}>{errors.email.message}</span>}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <input 
                  type="password" 
                  placeholder="Kata Sandi" 
                  className="auth-input"
                  {...register('password')}
                />
                {errors.password && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{errors.password.message}</span>}
              </div>
              <div className="form-group">
                <input 
                  type="password" 
                  placeholder="Konfirmasi Kata Sandi" 
                  className="auth-input"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{errors.confirmPassword.message}</span>}
              </div>
            </div>

            <div className="form-row" style={{ marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 0 }} disabled={isSubmitting}>
                {isSubmitting ? 'Memproses...' : 'Buat Akun Sekarang'}
              </button>
              
              <button type="button" className="btn btn-google" style={{ marginTop: 0 }} onClick={handleGoogleLogin}>
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="20" height="20" />
                Lanjutkan dengan google
              </button>
            </div>
          </form>

          <p className="auth-links">
            Sudah punya akun? <Link href="/login" className="auth-link">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
