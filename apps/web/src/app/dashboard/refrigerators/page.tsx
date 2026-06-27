'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Swal from 'sweetalert2';
import {
  Snowflake,
  Plus,
  Search,
  Box,
  Wallet,
  AlertCircle,
  MapPin,
  Edit,
  Trash2,
  History,
  PlusCircle,
  Percent,
  Calculator,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/store/useAuthStore';
import { refrigeratorService } from '@/services/refrigerator.service';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatRupiah, formatNumber, formatDate, formatDateTime, todayISO } from '@/lib/format';
import type { Refrigerator, RefrigeratorFill, RefrigeratorSummary, WeeklyReport } from '@/types/refrigerator';

const BRAND = '#0CA5EA';
const BRAND_DARK = '#006FB2';
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem',
  border: '1px solid #cbd5e1',
  borderRadius: '0.375rem',
  outline: 'none',
};
const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#334155',
  display: 'block',
  marginBottom: '0.4rem',
};
const errStyle: React.CSSProperties = {
  color: '#ef4444',
  fontSize: '0.8rem',
  marginTop: '0.25rem',
  display: 'block',
};

// ===========================================================================
//  HALAMAN UTAMA
// ===========================================================================

export default function RefrigeratorsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canDelete = role === 'SUPER_ADMIN' || role === 'PIMPINAN';

  const [items, setItems] = useState<Refrigerator[]>([]);
  const [summary, setSummary] = useState<RefrigeratorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Refrigerator | null>(null);
  const [fillTarget, setFillTarget] = useState<Refrigerator | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Refrigerator | null>(null);
  const [recapTarget, setRecapTarget] = useState<Refrigerator | null>(null);
  const [editFillTarget, setEditFillTarget] = useState<{ fill: RefrigeratorFill; refrigerator: Refrigerator } | null>(null);

  const fetchData = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        refrigeratorService.getAll({ limit: 100, search: search || undefined }),
        refrigeratorService.getSummary(),
      ]);
      setItems(list.data);
      setSummary(sum);
    } catch (error) {
      console.error('Error fetching refrigerators', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounce pencarian
  useEffect(() => {
    const t = setTimeout(() => fetchData(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput, fetchData]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (r: Refrigerator) => {
    setEditing(r);
    setFormOpen(true);
  };

  const handleDelete = async (r: Refrigerator) => {
    const result = await Swal.fire({
      title: 'Hapus kulkas ini?',
      html: `Kulkas <strong>${r.name}</strong> akan dinonaktifkan (soft delete).<br/>Riwayat pengisian tetap tersimpan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await refrigeratorService.delete(r.id);
      Swal.fire({ title: 'Terhapus!', text: `Kulkas "${r.name}" dihapus.`, icon: 'success', timer: 1500, showConfirmButton: false });
      fetchData(searchInput);
    } catch (error) {
      Swal.fire('Gagal!', getApiErrorMessage(error, 'Gagal menghapus kulkas.'), 'error');
    }
  };

  const summaryCards = [
    { icon: Snowflake, label: 'Total kulkas', value: formatNumber(summary?.totalRefrigerators ?? 0), color: BRAND },
    { icon: AlertCircle, label: 'Belum diisi hari ini', value: formatNumber(summary?.notFilledToday ?? 0), color: '#f59e0b' },
    { icon: Box, label: 'Kardus hari ini', value: formatNumber(summary?.boxCountToday ?? 0), color: '#8b5cf6' },
    { icon: Wallet, label: 'Nilai terisi hari ini', value: formatRupiah(summary?.totalCostToday ?? 0), color: '#10b981' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="section-title" style={{ marginTop: 0, marginBottom: '0.25rem' }}>Kulkas Suti</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Pantau dan catat pengisian suti di setiap kulkas.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link
            href="/dashboard/refrigerators/rekap"
            style={{ backgroundColor: 'white', color: BRAND_DARK, border: `1px solid ${BRAND_DARK}`, padding: '0.6rem 1.1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
          >
            <Calculator size={18} /> Rekap Pekanan
          </Link>
          <button
            onClick={openCreate}
            style={{ backgroundColor: BRAND_DARK, color: 'white', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={18} /> Tambah Kulkas
          </button>
        </div>
      </div>

      {/* Ringkasan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {summaryCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem' }}>
              <div style={{ display: 'grid', placeItems: 'center', width: '2.75rem', height: '2.75rem', borderRadius: '0.6rem', backgroundColor: `${c.color}1a`, color: c.color, flexShrink: 0 }}>
                <Icon size={22} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.label}</p>
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>{c.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pencarian */}
      <div style={{ position: 'relative', maxWidth: '360px', marginBottom: '1.5rem' }}>
        <Search size={16} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Cari kulkas / lokasi…"
          style={{ ...inputStyle, paddingLeft: '2.4rem' }}
        />
      </div>

      {/* Grid kartu */}
      {loading ? (
        <div className="dash-card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Memuat data kulkas…</div>
      ) : items.length === 0 ? (
        <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '3.5rem 1rem', textAlign: 'center' }}>
          <div style={{ display: 'grid', placeItems: 'center', width: '3rem', height: '3rem', borderRadius: '50%', backgroundColor: '#f1f5f9' }}>
            <Snowflake size={26} color="#94a3b8" />
          </div>
          <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>Belum ada kulkas</p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Tambahkan kulkas pertama untuk mulai mencatat pengisian.</p>
          <button onClick={openCreate} style={{ marginTop: '0.5rem', backgroundColor: BRAND_DARK, color: 'white', border: 'none', padding: '0.55rem 1.1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={18} /> Tambah Kulkas
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {items.map((r) => (
            <RefrigeratorCard
              key={r.id}
              refrigerator={r}
              canDelete={canDelete}
              onFill={() => setFillTarget(r)}
              onHistory={() => setHistoryTarget(r)}
              onRecap={() => setRecapTarget(r)}
              onEdit={() => openEdit(r)}
              onDelete={() => handleDelete(r)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <RefrigeratorFormModal
        open={formOpen}
        refrigerator={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          fetchData(searchInput);
        }}
      />
      <FillModal
        open={!!fillTarget}
        refrigerator={fillTarget}
        onClose={() => setFillTarget(null)}
        onSaved={() => {
          setFillTarget(null);
          fetchData(searchInput);
        }}
      />
      <HistoryModal
        open={!!historyTarget}
        refrigerator={historyTarget}
        onClose={() => setHistoryTarget(null)}
        onEditFill={(fill) => {
          if (historyTarget) setEditFillTarget({ fill, refrigerator: historyTarget });
        }}
      />
      <RecapModal open={!!recapTarget} refrigerator={recapTarget} canDelete={canDelete} onClose={() => setRecapTarget(null)} />
      <EditFillModal
        open={!!editFillTarget}
        fill={editFillTarget?.fill ?? null}
        refrigerator={editFillTarget?.refrigerator ?? null}
        onClose={() => setEditFillTarget(null)}
        onSaved={() => {
          setEditFillTarget(null);
          fetchData(searchInput);
        }}
      />
    </div>
  );
}

// ===========================================================================
//  KARTU KULKAS
// ===========================================================================

function RefrigeratorCard({
  refrigerator,
  canDelete,
  onFill,
  onHistory,
  onRecap,
  onEdit,
  onDelete,
}: {
  refrigerator: Refrigerator;
  canDelete: boolean;
  onFill: () => void;
  onHistory: () => void;
  onRecap: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const today = refrigerator.todayFill;
  const filledToday = (today?.fillCount ?? 0) > 0;

  const iconBtn = (bg: string): React.CSSProperties => ({
    backgroundColor: bg,
    color: 'white',
    border: 'none',
    padding: '0.4rem',
    borderRadius: '0.4rem',
    cursor: 'pointer',
    display: 'flex',
  });

  return (
    <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.1rem' }}>
      {/* Header kartu */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', minWidth: 0 }}>
          <div style={{ display: 'grid', placeItems: 'center', width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', backgroundColor: '#e0f2fe', color: BRAND, flexShrink: 0 }}>
            <Snowflake size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{refrigerator.name}</h3>
              {refrigerator.code ? (
                <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', backgroundColor: '#f1f5f9', color: '#475569', padding: '0.1rem 0.4rem', borderRadius: '0.3rem', flexShrink: 0 }}>{refrigerator.code}</span>
              ) : null}
              {refrigerator.profitSharingEnabled ? (
                <span title="Bagi hasil aktif" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem', fontSize: '0.62rem', backgroundColor: '#ecfdf5', color: '#059669', padding: '0.1rem 0.4rem', borderRadius: '0.3rem', flexShrink: 0 }}>
                  <Percent size={10} /> Bagi hasil
                </span>
              ) : null}
            </div>
            {refrigerator.location ? (
              <p style={{ margin: '0.2rem 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                <MapPin size={12} /> {refrigerator.location}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Hari ini sudah terisi */}
      <div style={{ flex: 1, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '0.6rem', padding: '0.85rem' }}>
        <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>Hari ini sudah terisi</p>
        {filledToday ? (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b' }}>{formatNumber(today!.boxCount)}</span>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>kardus</span>
              {today!.totalBottles > 0 ? (
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>{formatNumber(today!.totalBottles)} botol</span>
              ) : null}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Total nilai</span>
              <span style={{ fontWeight: 700, color: '#10b981' }}>{formatRupiah(today!.totalCost)}</span>
            </div>
          </div>
        ) : (
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Belum ada pengisian hari ini.</p>
        )}
      </div>

      {/* Footer aksi */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.85rem' }}>
        <button
          onClick={onFill}
          style={{ flex: 1, backgroundColor: BRAND, color: 'white', border: 'none', padding: '0.55rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 600, cursor: 'pointer' }}
        >
          <PlusCircle size={16} /> Rekap Pendapatan
        </button>
        <button onClick={onHistory} title="Riwayat pengisian" style={iconBtn('#64748b')}>
          <History size={16} />
        </button>
        <button onClick={onEdit} title="Edit kulkas" style={iconBtn(BRAND_DARK)}>
          <Edit size={16} />
        </button>
        {canDelete ? (
          <button onClick={onDelete} title="Hapus kulkas" style={iconBtn('#ef4444')}>
            <Trash2 size={16} />
          </button>
        ) : null}
      </div>
      {refrigerator.profitSharingEnabled ? (
        <button
          onClick={onRecap}
          style={{ marginTop: '0.5rem', width: '100%', backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 600, cursor: 'pointer' }}
        >
          <Percent size={15} /> Rekap & Bagi Hasil
        </button>
      ) : null}
      {today?.lastFillAt ? (
        <p style={{ margin: '0.6rem 0 0', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
          Pengisian terakhir: {formatDateTime(today.lastFillAt)}
        </p>
      ) : null}
    </div>
  );
}

// ===========================================================================
//  MODAL FORM KULKAS (Tambah / Edit)
// ===========================================================================

const shareRowSchema = z.object({
  instansiName: z.string().trim().min(1, 'Nama instansi wajib diisi').max(150),
  percentage: z.coerce.number().min(0.01, 'Persen > 0').max(100, 'Maks 100'),
});

const fridgeSchema = z
  .object({
    name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(150, 'Maksimal 150 karakter'),
    location: z.string().trim().max(150).optional(),
    code: z.string().trim().max(50).regex(/^[A-Za-z0-9_-]*$/, 'Hanya huruf, angka, - dan _').optional(),
    description: z.string().trim().max(1000).optional(),
    isActive: z.boolean(),
    profitSharingEnabled: z.boolean(),
    shares: z.array(shareRowSchema),
  })
  .superRefine((data, ctx) => {
    if (!data.profitSharingEnabled) return;
    if (data.shares.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['shares'], message: 'Tambahkan minimal satu instansi' });
      return;
    }
    const sum = data.shares.reduce((a, s) => a + (Number(s.percentage) || 0), 0);
    if (Math.abs(sum - 100) > 0.01) {
      ctx.addIssue({ code: 'custom', path: ['shares'], message: `Total persentase harus 100% (sekarang ${sum}%)` });
    }
  });

type FridgeFormInput = z.input<typeof fridgeSchema>;
type FridgeFormValues = z.output<typeof fridgeSchema>;

function RefrigeratorFormModal({
  open,
  refrigerator,
  onClose,
  onSaved,
}: {
  open: boolean;
  refrigerator: Refrigerator | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!refrigerator;
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FridgeFormInput, unknown, FridgeFormValues>({
    resolver: zodResolver(fridgeSchema),
    defaultValues: { name: '', location: '', code: '', description: '', isActive: true, profitSharingEnabled: false, shares: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'shares' });

  useEffect(() => {
    if (!open) return;
    reset({
      name: refrigerator?.name ?? '',
      location: refrigerator?.location ?? '',
      code: refrigerator?.code ?? '',
      description: refrigerator?.description ?? '',
      isActive: refrigerator?.isActive ?? true,
      profitSharingEnabled: refrigerator?.profitSharingEnabled ?? false,
      shares: (refrigerator?.shares ?? []).map((s) => ({ instansiName: s.instansiName, percentage: Number(s.percentage) })),
    });
  }, [open, refrigerator, reset]);

  const onSubmit = async (values: FridgeFormValues) => {
    const payload = {
      name: values.name,
      location: values.location || null,
      code: values.code || null,
      description: values.description || null,
      isActive: values.isActive,
      profitSharingEnabled: values.profitSharingEnabled,
      shares: values.profitSharingEnabled
        ? values.shares.map((s) => ({ instansiName: s.instansiName, percentage: Number(s.percentage) }))
        : [],
    };
    try {
      if (isEdit) {
        await refrigeratorService.update(refrigerator!.id, payload);
      } else {
        await refrigeratorService.create(payload);
      }
      Swal.fire({
        title: 'Berhasil!',
        text: isEdit ? 'Kulkas berhasil diperbarui.' : 'Kulkas baru berhasil ditambahkan.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      onSaved();
    } catch (error) {
      Swal.fire('Gagal!', getApiErrorMessage(error, 'Terjadi kesalahan sistem.'), 'error');
    }
  };

  const isActive = watch('isActive');
  const profitSharingEnabled = watch('profitSharingEnabled');
  const shareSum = (watch('shares') || []).reduce((a, s) => a + (Number(s?.percentage) || 0), 0);
  // Error level-array dari superRefine bisa di `.message` atau `.root.message`.
  const sharesRootError = errors.shares as unknown as { message?: string; root?: { message?: string } } | undefined;
  const sharesErrorMessage = sharesRootError?.message ?? sharesRootError?.root?.message;

  const radioStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      maxWidth="560px"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: BRAND, padding: '0.5rem', borderRadius: '0.5rem', color: 'white', display: 'flex' }}>
            <Snowflake size={22} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{isEdit ? 'Edit Kulkas' : 'Tambah Kulkas'}</h2>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Nama kulkas</label>
          <input type="text" placeholder="Mis. Kulkas Masjid" {...register('name')} style={inputStyle} />
          {errors.name && <span style={errStyle}>{errors.name.message}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Lokasi / Fakultas</label>
            <input type="text" placeholder="Mis. Teknik" {...register('location')} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Kode (opsional)</label>
            <input type="text" placeholder="Mis. TEK" {...register('code')} style={inputStyle} />
            {errors.code && <span style={errStyle}>{errors.code.message}</span>}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Deskripsi (opsional)</label>
          <textarea rows={2} {...register('description')} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.75rem 1rem' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Status aktif</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Kulkas nonaktif disembunyikan dari operasional.</p>
          </div>
          <button
            type="button"
            onClick={() => setValue('isActive', !isActive)}
            aria-pressed={isActive}
            style={{ width: '2.6rem', height: '1.5rem', borderRadius: '999px', border: 'none', cursor: 'pointer', backgroundColor: isActive ? BRAND : '#cbd5e1', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}
          >
            <span style={{ position: 'absolute', top: '0.15rem', left: isActive ? '1.25rem' : '0.15rem', width: '1.2rem', height: '1.2rem', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s' }} />
          </button>
        </div>

        {/* Sistem bagi hasil */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.85rem 1rem' }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Sistem bagi hasil?</p>
          <p style={{ margin: '0 0 0.6rem', fontSize: '0.75rem', color: '#94a3b8' }}>
            Aktifkan bila keuntungan kulkas ini dibagi ke instansi lain (mis. RSI 60% / BKSPPI 40%).
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <label style={radioStyle}>
              <input
                type="radio"
                name="profitSharing"
                checked={profitSharingEnabled === true}
                onChange={() => {
                  setValue('profitSharingEnabled', true);
                  if (fields.length === 0) append({ instansiName: '', percentage: 0 });
                }}
              />
              Ya, ada bagi hasil
            </label>
            <label style={radioStyle}>
              <input
                type="radio"
                name="profitSharing"
                checked={profitSharingEnabled === false}
                onChange={() => setValue('profitSharingEnabled', false)}
              />
              Tidak
            </label>
          </div>

          {profitSharingEnabled ? (
            <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {fields.map((field, index) => (
                <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 36px', gap: '0.5rem', alignItems: 'start' }}>
                  <div>
                    <input
                      placeholder="Nama instansi (mis. RSI)"
                      {...register(`shares.${index}.instansiName` as const)}
                      style={inputStyle}
                    />
                    {errors.shares?.[index]?.instansiName && (
                      <span style={errStyle}>{errors.shares[index]?.instansiName?.message}</span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="any"
                      placeholder="%"
                      {...register(`shares.${index}.percentage` as const)}
                      style={{ ...inputStyle, paddingRight: '1.8rem' }}
                    />
                    <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}>%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    title="Hapus instansi"
                    style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '2.35rem' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => append({ instansiName: '', percentage: 0 })}
                  style={{ backgroundColor: '#f1f5f9', color: '#334155', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  <Plus size={14} /> Tambah instansi
                </button>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: Math.abs(shareSum - 100) < 0.01 ? '#059669' : '#ef4444' }}>
                  Total: {shareSum}%
                </span>
              </div>

              {sharesErrorMessage && <span style={errStyle}>{sharesErrorMessage}</span>}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={onClose} style={{ backgroundColor: '#f1f5f9', color: '#334155', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
            Batal
          </button>
          <button type="submit" disabled={isSubmitting} style={{ backgroundColor: BRAND_DARK, color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Tambah kulkas'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ===========================================================================
//  MODAL PENGISIAN KULKAS
// ===========================================================================

const fillSchema = z.object({
  fillDate: z.string().min(1, 'Tanggal wajib diisi'),
  boxCount: z.coerce.number().int('Harus bilangan bulat').positive('Minimal 1 kardus'),
  pricePerBox: z.coerce.number().min(0, 'Tidak boleh negatif'),
  pricePerBottle: z.coerce.number().min(0, 'Tidak boleh negatif'),
  bottlesPerBox: z.coerce.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});
// z.coerce membuat tipe input berbeda dari output, jadi pakai bentuk 3-generic useForm.
type FillFormInput = z.input<typeof fillSchema>;
type FillFormValues = z.output<typeof fillSchema>;

function FillModal({
  open,
  refrigerator,
  onClose,
  onSaved,
}: {
  open: boolean;
  refrigerator: Refrigerator | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FillFormInput, unknown, FillFormValues>({
    resolver: zodResolver(fillSchema),
    defaultValues: { fillDate: todayISO(), boxCount: 1, pricePerBox: 0, pricePerBottle: 0, bottlesPerBox: 0, notes: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ fillDate: todayISO(), boxCount: 1, pricePerBox: 0, pricePerBottle: 0, bottlesPerBox: 0, notes: '' });
    }
  }, [open, refrigerator?.id, reset]);

  const boxCount = Number(watch('boxCount')) || 0;
  const pricePerBox = Number(watch('pricePerBox')) || 0;
  const bottlesPerBox = Number(watch('bottlesPerBox')) || 0;
  const pricePerBottle = Number(watch('pricePerBottle')) || 0;

  const totalCost = boxCount * pricePerBox;
  const totalBottles = boxCount * bottlesPerBox;
  const estRevenue = totalBottles * pricePerBottle;

  const onSubmit = async (values: FillFormValues) => {
    if (!refrigerator) return;
    try {
      await refrigeratorService.createFill(refrigerator.id, {
        fillDate: values.fillDate,
        boxCount: values.boxCount,
        pricePerBox: values.pricePerBox,
        pricePerBottle: values.pricePerBottle,
        bottlesPerBox: values.bottlesPerBox || 0,
        notes: values.notes || null,
      });
      Swal.fire({ title: 'Berhasil!', text: `Pengisian ${refrigerator.name} berhasil dicatat.`, icon: 'success', timer: 1500, showConfirmButton: false });
      onSaved();
    } catch (error) {
      Swal.fire('Gagal!', getApiErrorMessage(error, 'Gagal mencatat pengisian.'), 'error');
    }
  };

  const previewBox: React.CSSProperties = { textAlign: 'center' };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      maxWidth="560px"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: BRAND, padding: '0.5rem', borderRadius: '0.5rem', color: 'white', display: 'flex' }}>
            <PlusCircle size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Rekap Pendapatan</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              {refrigerator?.name}
              {refrigerator?.location ? ` • ${refrigerator.location}` : ''}
            </p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Tanggal pengisian</label>
          <input type="date" {...register('fillDate')} style={inputStyle} />
          {errors.fillDate && <span style={errStyle}>{errors.fillDate.message}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Jumlah kardus</label>
            <input type="number" min={1} {...register('boxCount')} style={inputStyle} />
            {errors.boxCount && <span style={errStyle}>{errors.boxCount.message}</span>}
          </div>
          <div>
            <label style={labelStyle}>Botol / kardus (opsional)</label>
            <input type="number" min={0} {...register('bottlesPerBox')} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Harga / kardus (Rp)</label>
            <input type="number" min={0} step="any" {...register('pricePerBox')} style={inputStyle} />
            {errors.pricePerBox && <span style={errStyle}>{errors.pricePerBox.message}</span>}
          </div>
          <div>
            <label style={labelStyle}>Harga jual / botol (Rp)</label>
            <input type="number" min={0} step="any" {...register('pricePerBottle')} style={inputStyle} />
            {errors.pricePerBottle && <span style={errStyle}>{errors.pricePerBottle.message}</span>}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Catatan (opsional)</label>
          <textarea rows={2} placeholder="Mis. titip ke petugas kebersihan" {...register('notes')} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {/* Preview total */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '0.5rem', padding: '0.85rem' }}>
          <div style={previewBox}>
            <p style={{ margin: 0, fontSize: '0.68rem', color: '#64748b' }}>Total nilai</p>
            <p style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>{formatRupiah(totalCost)}</p>
          </div>
          <div style={previewBox}>
            <p style={{ margin: 0, fontSize: '0.68rem', color: '#64748b' }}>Total botol</p>
            <p style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>{formatNumber(totalBottles)}</p>
          </div>
          <div style={previewBox}>
            <p style={{ margin: 0, fontSize: '0.68rem', color: '#64748b' }}>Est. penjualan</p>
            <p style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>{formatRupiah(estRevenue)}</p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={onClose} style={{ backgroundColor: '#f1f5f9', color: '#334155', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
            Batal
          </button>
          <button type="submit" disabled={isSubmitting} style={{ backgroundColor: BRAND_DARK, color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? 'Menyimpan…' : 'Simpan pengisian'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ===========================================================================
//  MODAL RIWAYAT PENGISIAN
// ===========================================================================

function HistoryModal({
  open,
  refrigerator,
  onClose,
  onEditFill,
}: {
  open: boolean;
  refrigerator: Refrigerator | null;
  onClose: () => void;
  onEditFill?: (fill: RefrigeratorFill) => void;
}) {
  const [rows, setRows] = useState<RefrigeratorFill[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !refrigerator) return;
    let ignore = false;
    setLoading(true);
    refrigeratorService
      .getFills(refrigerator.id, { page: 1, limit: 20 })
      .then((res) => {
        if (!ignore) setRows(res.data);
      })
      .catch((error) => console.error('Error fetching fills', error))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [open, refrigerator]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      maxWidth="800px"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: BRAND, padding: '0.5rem', borderRadius: '0.5rem', color: 'white', display: 'flex' }}>
            <History size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Riwayat Pengisian</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{refrigerator?.name}</p>
          </div>
        </div>
      }
    >
      {loading ? (
        <p style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>Memuat riwayat…</p>
      ) : rows.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>Belum ada riwayat pengisian untuk kulkas ini.</p>
      ) : (
        <div className="table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th style={{ textAlign: 'right' }}>Kardus</th>
                <th style={{ textAlign: 'right' }}>Harga/kardus</th>
                <th style={{ textAlign: 'right' }}>Total nilai</th>
                <th>Petugas</th>
                {onEditFill && <th style={{ textAlign: 'center' }}>Edit</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(f.fillDate)}</td>
                  <td style={{ textAlign: 'right' }}>{formatNumber(f.boxCount)}</td>
                  <td style={{ textAlign: 'right' }}>{formatRupiah(f.pricePerBox)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(f.totalCost)}</td>
                  <td style={{ color: '#64748b' }}>{f.user?.name ?? '-'}</td>
                  {onEditFill && (
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => onEditFill(f)}
                        title="Edit pengisian"
                        style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '0.25rem 0.6rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

// ===========================================================================
//  MODAL EDIT PENGISIAN KULKAS
// ===========================================================================

function EditFillModal({
  open,
  fill,
  refrigerator,
  onClose,
  onSaved,
}: {
  open: boolean;
  fill: RefrigeratorFill | null;
  refrigerator: Refrigerator | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fillDate: '',
    boxCount: 0,
    bottlesPerBox: 0,
    pricePerBox: 0,
    pricePerBottle: 0,
    notes: '',
  });

  useEffect(() => {
    if (fill) {
      setForm({
        fillDate: fill.fillDate.slice(0, 10),
        boxCount: fill.boxCount,
        bottlesPerBox: fill.bottlesPerBox,
        pricePerBox: Number(fill.pricePerBox),
        pricePerBottle: Number(fill.pricePerBottle),
        notes: fill.notes ?? '',
      });
    }
  }, [fill]);

  if (!fill || !refrigerator) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await refrigeratorService.updateFill(refrigerator.id, fill.id, {
        fillDate: form.fillDate,
        boxCount: form.boxCount,
        bottlesPerBox: form.bottlesPerBox,
        pricePerBox: form.pricePerBox,
        pricePerBottle: form.pricePerBottle,
        notes: form.notes || null,
      });
      Swal.fire({ title: 'Berhasil!', text: 'Data pengisian berhasil diperbarui.', icon: 'success', timer: 1500, showConfirmButton: false });
      onSaved();
    } catch (error) {
      Swal.fire('Gagal!', getApiErrorMessage(error, 'Gagal memperbarui data pengisian.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem',
    border: '1px solid #cbd5e1', borderRadius: '0.375rem', outline: 'none', fontSize: '0.9rem',
  };
  const labelStyle: React.CSSProperties = { fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.3rem' };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      maxWidth="500px"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#f59e0b', padding: '0.5rem', borderRadius: '0.5rem', color: 'white', display: 'flex' }}>
            <History size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Edit Pengisian Kulkas</h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>{refrigerator.name}</p>
          </div>
        </div>
      }
    >
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Tanggal Pengisian</label>
          <input type="date" style={inputStyle} value={form.fillDate} onChange={(e) => setForm(f => ({ ...f, fillDate: e.target.value }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle}>Jumlah Kardus</label>
            <input type="number" min={0} style={inputStyle} value={form.boxCount} onChange={(e) => setForm(f => ({ ...f, boxCount: Number(e.target.value) }))} />
          </div>
          <div>
            <label style={labelStyle}>Botol per Kardus</label>
            <input type="number" min={0} style={inputStyle} value={form.bottlesPerBox} onChange={(e) => setForm(f => ({ ...f, bottlesPerBox: Number(e.target.value) }))} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle}>Harga per Kardus (Rp)</label>
            <input type="number" min={0} style={inputStyle} value={form.pricePerBox} onChange={(e) => setForm(f => ({ ...f, pricePerBox: Number(e.target.value) }))} />
          </div>
          <div>
            <label style={labelStyle}>Harga per Botol (Rp)</label>
            <input type="number" min={0} style={inputStyle} value={form.pricePerBottle} onChange={(e) => setForm(f => ({ ...f, pricePerBottle: Number(e.target.value) }))} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Estimasi Total</label>
          <input readOnly style={{ ...inputStyle, backgroundColor: '#f1f5f9', fontWeight: 700, color: '#0CA5EA' }}
            value={formatRupiah(form.pricePerBox * form.boxCount)} />
        </div>
        <div>
          <label style={labelStyle}>Catatan</label>
          <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button onClick={onClose} style={{ padding: '0.6rem 1.5rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', backgroundColor: 'white', cursor: 'pointer', fontWeight: 600 }}>Batal</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '0.6rem 1.5rem', border: 'none', borderRadius: '0.5rem', backgroundColor: '#f59e0b', color: 'white', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ===========================================================================
//  MODAL REKAP PEKANAN & BAGI HASIL
// ===========================================================================

function currentWeekRange() {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 0 = Senin
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const iso = (d: Date) => {
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 10);
  };
  return { start: iso(monday), end: iso(sunday) };
}

const recapSchema = z
  .object({
    periodStart: z.string().min(1, 'Tanggal mulai wajib diisi'),
    periodEnd: z.string().min(1, 'Tanggal akhir wajib diisi'),
    actualRevenue: z.coerce.number().min(0, 'Tidak boleh negatif'),
    notes: z.string().max(1000).optional(),
  })
  .refine((d) => new Date(d.periodEnd) >= new Date(d.periodStart), {
    path: ['periodEnd'],
    message: 'Tanggal akhir tidak boleh sebelum tanggal mulai',
  });
type RecapInput = z.input<typeof recapSchema>;
type RecapValues = z.output<typeof recapSchema>;

function RecapModal({
  open,
  refrigerator,
  canDelete,
  onClose,
}: {
  open: boolean;
  refrigerator: Refrigerator | null;
  canDelete: boolean;
  onClose: () => void;
}) {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [modalCost, setModalCost] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RecapInput, unknown, RecapValues>({
    resolver: zodResolver(recapSchema),
    defaultValues: { periodStart: '', periodEnd: '', actualRevenue: 0, notes: '' },
  });

  const shares = refrigerator?.shares ?? [];

  const loadReports = useCallback(async (id: string) => {
    setLoadingReports(true);
    try {
      const res = await refrigeratorService.getReports(id, { page: 1, limit: 20 });
      setReports(res.data);
    } catch (e) {
      console.error('Error fetching reports', e);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !refrigerator) return;
    const wk = currentWeekRange();
    reset({ periodStart: wk.start, periodEnd: wk.end, actualRevenue: 0, notes: '' });
    loadReports(refrigerator.id);
  }, [open, refrigerator, reset, loadReports]);

  const periodStart = watch('periodStart');
  const periodEnd = watch('periodEnd');
  const actualRevenue = Number(watch('actualRevenue')) || 0;

  // Ambil modal kardus (otomatis) untuk rentang tanggal terpilih.
  useEffect(() => {
    if (!open || !refrigerator || !periodStart || !periodEnd) return;
    let ignore = false;
    setLoadingPreview(true);
    const t = setTimeout(() => {
      refrigeratorService
        .recapPreview(refrigerator.id, periodStart, periodEnd)
        .then((p) => {
          if (!ignore) setModalCost(Number(p.modalCost) || 0);
        })
        .catch((e) => console.error('Error preview rekap', e))
        .finally(() => {
          if (!ignore) setLoadingPreview(false);
        });
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [open, refrigerator, periodStart, periodEnd]);

  const netProfit = actualRevenue - modalCost;

  const onSubmit = async (values: RecapValues) => {
    if (!refrigerator) return;
    try {
      await refrigeratorService.createReport(refrigerator.id, {
        periodStart: values.periodStart,
        periodEnd: values.periodEnd,
        actualRevenue: values.actualRevenue,
        notes: values.notes || null,
      });
      Swal.fire({ title: 'Berhasil!', text: 'Rekap pekanan berhasil disimpan.', icon: 'success', timer: 1500, showConfirmButton: false });
      reset({ periodStart: values.periodStart, periodEnd: values.periodEnd, actualRevenue: 0, notes: '' });
      loadReports(refrigerator.id);
    } catch (error) {
      Swal.fire('Gagal!', getApiErrorMessage(error, 'Gagal menyimpan rekap.'), 'error');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!refrigerator) return;
    const r = await Swal.fire({
      title: 'Hapus rekap ini?',
      text: 'Data rekap & pembagian bagi hasil pekan ini akan dihapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    });
    if (!r.isConfirmed) return;
    try {
      await refrigeratorService.deleteReport(refrigerator.id, reportId);
      Swal.fire({ title: 'Terhapus!', icon: 'success', timer: 1200, showConfirmButton: false });
      loadReports(refrigerator.id);
    } catch (error) {
      Swal.fire('Gagal!', getApiErrorMessage(error, 'Gagal menghapus rekap.'), 'error');
    }
  };

  const sharesLabel = shares.map((s) => `${s.instansiName} ${Number(s.percentage)}%`).join(' • ');

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      maxWidth="820px"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#059669', padding: '0.5rem', borderRadius: '0.5rem', color: 'white', display: 'flex' }}>
            <Percent size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Rekap Pekanan & Bagi Hasil</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              {refrigerator?.name}
              {sharesLabel ? ` — ${sharesLabel}` : ''}
            </p>
          </div>
        </div>
      }
    >
      {/* Form rekap */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Periode mulai</label>
            <input type="date" {...register('periodStart')} style={inputStyle} />
            {errors.periodStart && <span style={errStyle}>{errors.periodStart.message}</span>}
          </div>
          <div>
            <label style={labelStyle}>Periode akhir</label>
            <input type="date" {...register('periodEnd')} style={inputStyle} />
            {errors.periodEnd && <span style={errStyle}>{errors.periodEnd.message}</span>}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Uang masuk aktual pekan ini (Rp)</label>
          <input type="number" min={0} step="any" placeholder="Total uang yang terkumpul" {...register('actualRevenue')} style={inputStyle} />
          {errors.actualRevenue && <span style={errStyle}>{errors.actualRevenue.message}</span>}
        </div>

        <div>
          <label style={labelStyle}>Catatan (opsional)</label>
          <textarea rows={2} {...register('notes')} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {/* Pratinjau laba & bagi hasil */}
        <div style={{ border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '0.5rem', padding: '0.85rem 1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Modal kardus {loadingPreview ? '…' : ''}</p>
              <p style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>{formatRupiah(modalCost)}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Uang masuk</p>
              <p style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>{formatRupiah(actualRevenue)}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Laba bersih</p>
              <p style={{ margin: 0, fontWeight: 700, color: netProfit >= 0 ? '#059669' : '#ef4444' }}>{formatRupiah(netProfit)}</p>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {shares.map((s) => {
              const amt = (netProfit * Number(s.percentage)) / 100;
              return (
                <div key={s.id} style={{ flex: '1 1 140px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.45rem', padding: '0.5rem 0.7rem' }}>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>{s.instansiName} ({Number(s.percentage)}%)</p>
                  <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>{formatRupiah(amt)}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? 'Menyimpan…' : 'Simpan rekap pekan ini'}
          </button>
        </div>
      </form>

      {/* Riwayat rekap */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#334155' }}>Riwayat rekap</h3>
        {loadingReports ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>Memuat riwayat…</p>
        ) : reports.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>Belum ada rekap pekanan.</p>
        ) : (
          <div className="table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Periode</th>
                  <th style={{ textAlign: 'right' }}>Uang masuk</th>
                  <th style={{ textAlign: 'right' }}>Modal</th>
                  <th style={{ textAlign: 'right' }}>Laba bersih</th>
                  <th>Bagi hasil</th>
                  {canDelete ? <th style={{ textAlign: 'center' }}>Aksi</th> : null}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(r.periodStart)} – {formatDate(r.periodEnd)}</td>
                    <td style={{ textAlign: 'right' }}>{formatRupiah(r.actualRevenue)}</td>
                    <td style={{ textAlign: 'right' }}>{formatRupiah(r.modalCost)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: Number(r.netProfit) >= 0 ? '#059669' : '#ef4444' }}>{formatRupiah(r.netProfit)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        {r.shares.map((s) => (
                          <span key={s.id} style={{ fontSize: '0.78rem', color: '#475569' }}>
                            {s.instansiName} ({Number(s.percentage)}%): <strong>{formatRupiah(s.amount)}</strong>
                          </span>
                        ))}
                      </div>
                    </td>
                    {canDelete ? (
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handleDeleteReport(r.id)} title="Hapus rekap" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.35rem', borderRadius: '50%', cursor: 'pointer', display: 'inline-flex' }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
