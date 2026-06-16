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
            <img src="/images/logo-login2.png" alt="Suti Water Logo" width="100" height="120" style={{ objectFit: 'contain' }} />
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
