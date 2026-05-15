'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck } from 'lucide-react';
import { api } from '@/lib/axios';

type AuditLogEntry = {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  createdAt: string;
  user?: { name: string; role: string } | null;
};

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  CREATE: { bg: '#dcfce7', color: '#16a34a' },
  UPDATE: { bg: '#dbeafe', color: '#1d4ed8' },
  DELETE: { bg: '#fee2e2', color: '#dc2626' },
  DELETE_STOCK_IN: { bg: '#fee2e2', color: '#dc2626' },
  DELETE_STOCK_OUT: { bg: '#fee2e2', color: '#dc2626' },
  STOCK_IN: { bg: '#f0fdf4', color: '#15803d' },
  STOCK_OUT: { bg: '#fff7ed', color: '#c2410c' },
  LOGIN: { bg: '#f0f9ff', color: '#0369a1' },
};

const getActionStyle = (action: string) =>
  ACTION_COLORS[action] ?? { bg: '#f1f5f9', color: '#475569' };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const LIMIT = 20;

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (filterEntity) params.entity = filterEntity;
      if (filterAction) params.action = filterAction;
      const res = await api.get('/audit-logs', { params });
      setLogs(res.data.data ?? []);
      const meta = res.data.meta;
      if (meta) setTotalPages(meta.totalPages ?? 1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterEntity, filterAction]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset ke halaman 1 saat filter berubah
  const handleFilter = (entity: string, action: string) => {
    setFilterEntity(entity);
    setFilterAction(action);
    setPage(1);
  };

  const ENTITY_OPTIONS = ['PRODUCT', 'SUPPLIER', 'AGENT', 'USER', 'DISCOUNT', 'STOCK_IN', 'STOCK_OUT'];
  const ACTION_OPTIONS = ['CREATE', 'UPDATE', 'DELETE', 'STOCK_IN', 'STOCK_OUT', 'DELETE_STOCK_IN', 'DELETE_STOCK_OUT'];

  return (
    <div>
      <div className="dash-card">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', color: '#1e293b' }}>
            <div style={{ backgroundColor: '#0CA5EA', padding: '0.5rem', borderRadius: '0.5rem', color: 'white', display: 'flex' }}>
              <ShieldCheck size={20} />
            </div>
            Riwayat Aktivitas Sistem
          </h2>

          {/* Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              value={filterEntity}
              onChange={(e) => handleFilter(e.target.value, filterAction)}
              style={{ padding: '0.4rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.85rem', outline: 'none', backgroundColor: 'white' }}
            >
              <option value="">Semua Entitas</option>
              {ENTITY_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select
              value={filterAction}
              onChange={(e) => handleFilter(filterEntity, e.target.value)}
              style={{ padding: '0.4rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.85rem', outline: 'none', backgroundColor: 'white' }}
            >
              <option value="">Semua Aksi</option>
              {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Tabel */}
        <div className="table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Pengguna</th>
                <th>Aksi</th>
                <th>Entitas</th>
                <th>ID Entitas</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Memuat data...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Tidak ada data aktivitas</td></tr>
              ) : (
                logs.map((log) => {
                  const style = getActionStyle(log.action);
                  return (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#64748b' }}>
                        {formatDate(log.createdAt)}
                      </td>
                      <td>
                        {log.user ? (
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.user.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.user.role}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Sistem</span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '0.2rem 0.6rem',
                          borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700,
                          backgroundColor: style.bg, color: style.color,
                          whiteSpace: 'nowrap',
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>{log.entity}</td>
                      <td style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.entityId ?? '-'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{log.ipAddress ?? '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '0.35rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', backgroundColor: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, fontSize: '0.85rem' }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Halaman {page} dari {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '0.35rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', backgroundColor: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1, fontSize: '0.85rem' }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
