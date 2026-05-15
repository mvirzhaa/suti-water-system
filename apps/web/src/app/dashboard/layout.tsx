'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Tunggu sampai Zustand selesai hydrate dari localStorage
  // Sebelum hydration selesai, isAuthenticated selalu false (nilai default)
  // sehingga menyebabkan redirect palsu ke /login saat refresh
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Zustand persist middleware menyimpan state ke localStorage.
    // Saat komponen mount di client, store sudah ter-hydrate.
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Tampilkan loading sementara hydration belum selesai
  if (!hasHydrated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
      }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{
            width: '40px', height: '40px', margin: '0 auto 1rem',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #0CA5EA',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Memuat...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="dashboard-shell">
      <button
        className={`sidebar-overlay ${isSidebarOpen ? 'is-open' : ''}`}
        type="button"
        aria-label="Tutup menu"
        onClick={() => setIsSidebarOpen(false)}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="dashboard-content">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
}
