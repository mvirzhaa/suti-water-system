'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthCallback() {
  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Ambil token dari hash fragment (#token=xyz)
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const token = params.get('token');

        if (token) {
          // 1. Simpan token ke store
          setAccessToken(token);
          
          // 2. Ambil data profil user
          await fetchProfile();
          
          // 3. Redirect ke dashboard
          router.replace('/dashboard');
        } else {
          // Jika tidak ada token, balik ke login
          router.replace('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/login?error=auth_failed');
      }
    };

    handleAuth();
  }, [router, setAccessToken, fetchProfile]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      gap: '1rem',
      backgroundColor: '#f8fafc'
    }}>
      <div className="animate-spin" style={{ 
        width: '3rem', 
        height: '3rem', 
        border: '4px solid #e2e8f0', 
        borderTopColor: '#0CA5EA', 
        borderRadius: '50%' 
      }}></div>
      <p style={{ color: '#64748b', fontWeight: 500 }}>Menyiapkan akun Anda...</p>
    </div>
  );
}
