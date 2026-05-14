'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Home,
  ArrowDownToLine,
  ArrowUpFromLine,
  Database,
  FileText,
  LogOut,
  ChevronDown,
  X,
  BadgePercent
} from 'lucide-react';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const [manualMasterOpen, setManualMasterOpen] = useState<boolean | null>(null);
  const isMasterOpen = manualMasterOpen ?? pathname.includes('/master');

  const navItems = [
    { name: 'Halaman Utama', href: '/dashboard', icon: Home },
    { name: 'Barang Masuk', href: '/dashboard/stock-in', icon: ArrowDownToLine },
    { name: 'Barang Keluar', href: '/dashboard/stock-out', icon: ArrowUpFromLine },
    { name: 'Master Data', href: '/dashboard/master', icon: Database, hasDropdown: true },
    { name: 'Laporan', href: '/dashboard/reports', icon: FileText },
  ];

  return (
    <aside className={`dashboard-sidebar ${isOpen ? 'is-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <svg width="40" height="40" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 0C50 0 10 50 10 80C10 102.091 27.9086 120 50 120C72.0914 120 90 102.091 90 80C90 50 50 0 50 0Z" fill="#0CA5EA"/>
            <path d="M25 85L45 60L55 75L75 45L90 80H10L25 85Z" fill="#84CC16"/>
          </svg>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e3a8a', lineHeight: 1.1 }}>Suti Water</h2>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0CA5EA', lineHeight: 1.1 }}>System</span>
          </div>
        </div>
        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="Tutup menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="dashboard-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}`));
          const Icon = item.icon;

          if (item.name === 'Master Data') {
            return (
              <div key="master-data">
                <div
                  onClick={() => setManualMasterOpen(!isMasterOpen)}
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
                <AnimatePresence>
                  {isMasterOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ paddingLeft: '2.5rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {[
                          { name: 'Pemasok', path: 'suppliers' },
                          { name: 'Barang', path: 'products' },
                          { name: 'Agen', path: 'agents' },
                          { name: 'Pengguna', path: 'users' },
                        ].map((subItem) => {
                          const isSubActive = pathname.includes(subItem.path);
                          return (
                            <Link
                              key={subItem.path}
                              href={`/dashboard/master/${subItem.path}`}
                              onClick={onClose}
                              style={{
                                textDecoration: 'none',
                                color: isSubActive ? '#0CA5EA' : '#64748b',
                                fontSize: '0.95rem',
                                fontWeight: isSubActive ? 600 : 500,
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                backgroundColor: isSubActive ? '#f0f9ff' : 'transparent',
                                transition: 'all 0.2s',
                                display: 'block'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSubActive) e.currentTarget.style.color = '#0CA5EA';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSubActive) e.currentTarget.style.color = '#64748b';
                              }}
                            >
                              {subItem.name}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
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

        <Link
          href="/dashboard/discounts"
          onClick={onClose}
          style={{
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
          boxShadow: '0 4px 6px -1px rgba(12, 165, 234, 0.2)',
          textDecoration: 'none',
        }}>
          <BadgePercent size={24} /> Buat Kupon Sekarang!
        </Link>
      </div>
    </aside>
  );
}
