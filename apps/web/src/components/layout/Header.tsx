'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

type HeaderProps = {
  onMenuClick: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();

  // Simple title mapper
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Halaman Utama';
    if (pathname.includes('/stock-in')) return 'Barang Masuk';
    if (pathname.includes('/stock-out')) return 'Barang Keluar';
    if (pathname.includes('/master')) return 'Master Data';
    if (pathname.includes('/reports')) return 'Laporan';
    return 'Dashboard';
  };

  return (
    <header className="dashboard-header">
      <div className="dashboard-title-group">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onMenuClick}
          aria-label="Buka menu"
        >
          <Menu size={22} />
        </button>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#1e293b',
          fontFamily: "'Poppins', sans-serif"
        }}>
          {getPageTitle()}
        </h1>
      </div>

      <div className="dashboard-user">
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
            {user?.name || 'Memuat...'}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
            {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role === 'PIMPINAN' ? 'Pimpinan' : 'Staff Gudang'}
          </p>
        </div>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#64748b' }}>
              {user?.name?.charAt(0) || 'U'}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
