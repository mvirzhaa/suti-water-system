'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  Home, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Database, 
  FileText, 
  LogOut,
  ChevronDown
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const [isMasterOpen, setIsMasterOpen] = useState(pathname.includes('/master'));

  useEffect(() => {
    if (pathname.includes('/master')) {
      setIsMasterOpen(true);
    }
  }, [pathname]);

  const navItems = [
    { name: 'Halaman Utama', href: '/dashboard', icon: Home },
    { name: 'Barang Masuk', href: '/dashboard/stock-in', icon: ArrowDownToLine },
    { name: 'Barang Keluar', href: '/dashboard/stock-out', icon: ArrowUpFromLine },
    { name: 'Master Data', href: '/dashboard/master', icon: Database, hasDropdown: true },
    { name: 'Laporan', href: '/dashboard/reports', icon: FileText },
  ];

  return (
    <aside style={{ 
      width: '260px', 
      backgroundColor: '#f8fafc',
      borderRight: '1px solid #e2e8f0',
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 40
    }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <svg width="40" height="40" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 0C50 0 10 50 10 80C10 102.091 27.9086 120 50 120C72.0914 120 90 102.091 90 80C90 50 50 0 50 0Z" fill="#0CA5EA"/>
          <path d="M25 85L45 60L55 75L75 45L90 80H10L25 85Z" fill="#84CC16"/>
        </svg>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e3a8a', lineHeight: 1.1 }}>Suti Water</h2>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0CA5EA', lineHeight: 1.1 }}>System</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}`));
          const Icon = item.icon;
          
          if (item.name === 'Master Data') {
            return (
              <div key="master-data">
                <div 
                  onClick={() => setIsMasterOpen(!isMasterOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    color: isActive ? '#0CA5EA' : '#64748b',
                    backgroundColor: isActive ? '#f0f9ff' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon size={20} color={'#0CA5EA'} />
                    <span>{item.name}</span>
                  </div>
                  <ChevronDown size={16} style={{ transform: isMasterOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                </div>
                {/* Submenus */}
                {isMasterOpen && (
                  <div style={{ paddingLeft: '2.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Link href="/dashboard/master/suppliers" style={{ textDecoration: 'none', color: pathname.includes('suppliers') ? '#0CA5EA' : '#64748b', fontSize: '0.9rem', fontWeight: pathname.includes('suppliers') ? 600 : 400 }}>Pemasok</Link>
                    <Link href="/dashboard/master/products" style={{ textDecoration: 'none', color: pathname.includes('products') ? '#0CA5EA' : '#64748b', fontSize: '0.9rem', fontWeight: pathname.includes('products') ? 600 : 400 }}>Barang</Link>
                    <Link href="/dashboard/master/agents" style={{ textDecoration: 'none', color: pathname.includes('agents') ? '#0CA5EA' : '#64748b', fontSize: '0.9rem', fontWeight: pathname.includes('agents') ? 600 : 400 }}>Agen</Link>
                    <Link href="/dashboard/master/users" style={{ textDecoration: 'none', color: pathname.includes('users') ? '#0CA5EA' : '#64748b', fontSize: '0.9rem', fontWeight: pathname.includes('users') ? 600 : 400 }}>Pengguna</Link>
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link 
              key={item.name} 
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                color: isActive ? '#0CA5EA' : '#64748b',
                backgroundColor: isActive ? '#f0f9ff' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={20} color={'#0CA5EA'} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button 
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            color: '#64748b',
            background: 'none',
            border: 'none',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <LogOut size={20} color="#0CA5EA" />
          Keluar Aplikasi
        </button>

        <button style={{
          width: '100%',
          backgroundColor: '#0CA5EA',
          color: 'white',
          border: 'none',
          padding: '1rem',
          borderRadius: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(12, 165, 234, 0.2)'
        }}>
          <span style={{ fontSize: '1.2rem' }}>%</span> Buat Kupon Sekarang!
        </button>
      </div>
    </aside>
  );
}
