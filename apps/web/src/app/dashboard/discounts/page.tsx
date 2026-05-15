'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { BadgePercent, Camera, CheckCircle, Loader2, List, Plus, ToggleLeft, ToggleRight, Trash2, Edit } from 'lucide-react';
import Swal from 'sweetalert2';
import { discountService, type DiscountRecord } from '@/services/discount.service';
import { getApiErrorMessage } from '@/lib/api-error';

// ─── Types ────────────────────────────────────────────────────────────────────

type VoucherForm = {
  title: string;
  info: string;
  percent: number;
  footer: string;
  promoTitle: string;
  promoInfo: string;
  promoFooter: string;
  promoLabel: string;
  promoCode: string;
  minQuantity: number;
  startDate: string;
  endDate: string;
  couponColor: string;
  percentColor: string;
  textColor: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const todayInput = () => new Date().toISOString().slice(0, 10);
const addDaysInput = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const COUPON_COLORS = ['#006FB2', '#00558C', '#4AB3E9', '#0CA5EA'];
const PERCENT_COLORS = ['#00558C', '#006FB2'];
const TEXT_COLORS = ['#ffffff', '#0f172a'];

const INITIAL: VoucherForm = {
  title: 'SPECIAL PEMBELIAN TERBANYAK',
  info: 'Voucher Diskon',
  percent: 8,
  footer: '*Syarat & Ketentuan Berlaku',
  promoTitle: 'Diskon',
  promoInfo: 'Voucher Diskon',
  promoFooter: 'Pembelian anda sudah melewati 500 kardus dan anda mendapatkan potongan harga',
  promoLabel: 'Kode Promo',
  promoCode: 'SUTINGASIHDISKON8%',
  minQuantity: 500,
  startDate: todayInput(),
  endDate: addDaysInput(18),
  couponColor: COUPON_COLORS[3]!,
  percentColor: PERCENT_COLORS[1]!,
  textColor: TEXT_COLORS[0]!,
};

// ─── SVG Assets ───────────────────────────────────────────────────────────────

const sutiLogo = (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/images/logo-login2.png" alt="Suti Water" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
);

const bottleSet = (
  <svg viewBox="0 0 220 120" aria-hidden="true" style={{ width: '100%', height: 'auto' }}>
    <ellipse cx="110" cy="104" rx="90" ry="10" fill="rgba(0,0,0,.14)" />
    {[30, 58, 146, 176].map((x, i) => (
      <g key={x} transform={`translate(${x} ${i % 2 === 0 ? 18 : 8})`}>
        <rect x="9" y="6" width="20" height="12" rx="3" fill="#1f8fd3" />
        <rect x="4" y="18" width="30" height="78" rx="9" fill="#dff6ff" stroke="#98d9f6" />
        <rect x="7" y="48" width="24" height="18" rx="3" fill="#0CA5EA" />
        <text x="19" y="61" fill="white" fontSize="8" fontWeight="700" textAnchor="middle">SW</text>
      </g>
    ))}
    <g transform="translate(74 0)">
      <rect x="21" y="8" width="34" height="14" rx="4" fill="#1f8fd3" />
      <rect x="10" y="20" width="56" height="86" rx="18" fill="#dff6ff" stroke="#82cff2" strokeWidth="2" />
      <rect x="16" y="55" width="44" height="24" rx="6" fill="#0CA5EA" />
      <text x="38" y="72" fill="white" fontSize="13" fontWeight="800" textAnchor="middle">Suti</text>
    </g>
  </svg>
);

// ─── Upload Box ───────────────────────────────────────────────────────────────

type UploadBoxProps = { label: string; preview?: string | null; onChange: (v: string) => void };

function UploadBox({ label, preview, onChange }: UploadBoxProps) {
  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <label style={{
      width: '100px', height: '100px',
      border: '1.5px dashed #cbd5e1', borderRadius: '0.5rem',
      display: 'grid', placeItems: 'center',
      overflow: 'hidden', cursor: 'pointer', backgroundColor: '#f8fafc',
    }}>
      <input type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', color: '#94a3b8', padding: '0.5rem', textAlign: 'center' }}>
          <Camera size={24} />
          <span style={{ fontSize: '0.6rem', lineHeight: 1.3 }}>{label}</span>
        </div>
      )}
    </label>
  );
}

// ─── Colour Picker ────────────────────────────────────────────────────────────

function ColourPicker({ colors, value, onChange }: { colors: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      {colors.map((c) => (
        <button
          key={c} type="button"
          onClick={() => onChange(c)}
          style={{
            width: '28px', height: '28px', borderRadius: '6px',
            backgroundColor: c, border: 'none', cursor: 'pointer',
            outline: value === c ? '3px solid #0CA5EA' : '2px solid #e2e8f0',
            outlineOffset: '1px',
          }}
        />
      ))}
    </div>
  );
}

// ─── Form Field Wrapper ───────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '0.75rem' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', textAlign: 'right' }}>{label}</label>
      <div>{children}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem',
  border: '1px solid #cbd5e1', borderRadius: '0.375rem', outline: 'none',
  fontSize: '0.875rem', color: '#1e293b',
};

// ─── Section Divider ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '0.75rem', fontWeight: 700, color: '#0CA5EA',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem', marginTop: '0.5rem',
    }}>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DiscountsPage() {
  const [tab, setTab] = useState<'list' | 'create'>('list');
  const [discounts, setDiscounts] = useState<DiscountRecord[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [form, setForm] = useState<VoucherForm>(INITIAL);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [promoPreview, setPromoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState(false);

  const set = <K extends keyof VoucherForm>(k: K, v: VoucherForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Fetch daftar kupon
  const fetchDiscounts = async () => {
    try {
      setLoadingList(true);
      const res = await discountService.getAll();
      setDiscounts(Array.isArray(res.data) ? res.data : []);
    } catch {
      // silent
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  // Toggle aktif/nonaktif
  const handleToggle = async (d: DiscountRecord) => {
    const action = d.isActive ? 'nonaktifkan' : 'aktifkan';
    const result = await Swal.fire({
      title: `${d.isActive ? 'Nonaktifkan' : 'Aktifkan'} kupon ini?`,
      text: `Kupon "${d.name}" akan di${action}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: d.isActive ? '#64748b' : '#006FB2',
      cancelButtonColor: '#e2e8f0',
      confirmButtonText: `Ya, ${action}`,
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await discountService.toggleActive(d.id, !d.isActive);
      Swal.fire('Berhasil!', `Kupon berhasil di${action}.`, 'success');
      fetchDiscounts();
    } catch (err: unknown) {
      Swal.fire('Gagal!', getApiErrorMessage(err, 'Gagal mengubah status kupon.'), 'error');
    }
  };

  // Hapus kupon
  const handleDelete = async (d: DiscountRecord) => {
    const result = await Swal.fire({
      title: 'Hapus kupon ini?',
      text: `Kupon "${d.name}" akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await discountService.delete(d.id);
      Swal.fire('Terhapus!', 'Kupon berhasil dihapus.', 'success');
      fetchDiscounts();
    } catch (err: unknown) {
      Swal.fire('Gagal!', getApiErrorMessage(err, 'Gagal menghapus kupon.'), 'error');
    }
  };

  const description = useMemo(() =>
    [form.promoInfo, form.promoFooter, `${form.promoLabel}: ${form.promoCode}`]
      .filter(Boolean).join(' | '),
    [form.promoInfo, form.promoFooter, form.promoLabel, form.promoCode]);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.promoCode.trim()) {
      Swal.fire('Data belum lengkap', 'Judul besar dan kode promo wajib diisi.', 'warning'); return;
    }
    if (form.percent <= 0 || form.percent > 100) {
      Swal.fire('Persen tidak valid', 'Persen diskon harus antara 1–100.', 'warning'); return;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      Swal.fire('Tanggal tidak valid', 'Tanggal mulai tidak boleh melewati tanggal selesai.', 'warning'); return;
    }
    try {
      setIsSubmitting(true);
      await discountService.create({
        name: form.title, description,
        type: 'PERCENTAGE', value: form.percent,
        applicableTo: 'ALL',
        minQuantity: form.minQuantity || undefined,
        startDate: form.startDate, endDate: form.endDate,
      });
      setCreated(true);
      Swal.fire('Berhasil!', 'Kupon diskon berhasil dibuat.', 'success');
      fetchDiscounts(); // refresh daftar kupon
    } catch (err: unknown) {
      Swal.fire('Gagal!', getApiErrorMessage(err, 'Gagal membuat kupon.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="dash-card">

        {/* ── Header kartu ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#0CA5EA', padding: '0.5rem', borderRadius: '0.5rem', color: 'white', display: 'flex' }}>
              <BadgePercent size={20} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Kupon Diskon</h2>
          </div>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setTab('list')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 1rem', borderRadius: '0.5rem', border: 'none',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                backgroundColor: tab === 'list' ? '#006FB2' : '#f1f5f9',
                color: tab === 'list' ? 'white' : '#64748b',
              }}
            >
              <List size={15} /> Daftar Kupon
            </button>
            <button
              type="button"
              onClick={() => setTab('create')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 1rem', borderRadius: '0.5rem', border: 'none',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                backgroundColor: tab === 'create' ? '#006FB2' : '#f1f5f9',
                color: tab === 'create' ? 'white' : '#64748b',
              }}
            >
              <Plus size={15} /> Buat Kupon
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════
            TAB: DAFTAR KUPON
        ══════════════════════════════════════ */}
        {tab === 'list' && (
          <div>
            {loadingList ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Memuat data...</div>
            ) : discounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                <BadgePercent size={40} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
                <p style={{ margin: 0 }}>Belum ada kupon diskon.</p>
                <button
                  type="button"
                  onClick={() => setTab('create')}
                  style={{ marginTop: '1rem', backgroundColor: '#006FB2', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Buat Kupon Pertama
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {discounts.map((d) => {
                  const start = new Date(d.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                  const end = d.endDate ? new Date(d.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '∞';
                  const valueLabel = d.type === 'PERCENTAGE' ? `${d.value}%` : `Rp ${Number(d.value).toLocaleString('id-ID')}`;
                  return (
                    <div key={d.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1rem 1.25rem', borderRadius: '0.75rem',
                      border: `1px solid ${d.isActive ? '#bae6fd' : '#e2e8f0'}`,
                      backgroundColor: d.isActive ? '#f0f9ff' : '#f8fafc',
                      gap: '1rem', flexWrap: 'wrap',
                    }}>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{d.name}</span>
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            backgroundColor: d.isActive ? '#0CA5EA' : '#94a3b8',
                            color: 'white',
                          }}>
                            {d.isActive ? 'AKTIF' : 'NONAKTIF'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <span>Diskon: <strong style={{ color: '#006FB2' }}>{valueLabel}</strong></span>
                          <span>Berlaku: {start} — {end}</span>
                          {d.minQuantity && <span>Min. {d.minQuantity} unit</span>}
                          <span>Digunakan: {d.usageCount}×</span>
                        </div>
                        {d.description && (
                          <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>{d.description}</p>
                        )}
                      </div>
                      {/* Aksi */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleToggle(d)}
                          title={d.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                            padding: '0.4rem 0.85rem', borderRadius: '0.4rem', border: 'none',
                            fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                            backgroundColor: d.isActive ? '#f1f5f9' : '#dcfce7',
                            color: d.isActive ? '#64748b' : '#16a34a',
                          }}
                        >
                          {d.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                          {d.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(d)}
                          title="Hapus kupon"
                          style={{
                            display: 'flex', alignItems: 'center',
                            padding: '0.4rem', borderRadius: '0.4rem', border: 'none',
                            cursor: 'pointer', backgroundColor: '#fee2e2', color: '#ef4444',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: BUAT KUPON
        ══════════════════════════════════════ */}
        {tab === 'create' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 480px) 1fr', gap: '2.5rem', alignItems: 'start' }}>

          {/* ════════════ KOLOM FORM (kiri) ════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* — Kupon Utama (Hero) — */}
            <SectionLabel>Kupon Utama</SectionLabel>

            <Field label="Judul Besar">
              <input style={inputStyle} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="SPECIAL PEMBELIAN TERBANYAK" />
            </Field>

            <Field label="Informasi">
              <input style={inputStyle} value={form.info} onChange={(e) => set('info', e.target.value)} placeholder="Voucher Diskon" />
            </Field>

            <Field label="Persen Diskon">
              <div style={{ display: 'flex', maxWidth: '180px' }}>
                <input
                  type="number" min="1" max="100"
                  style={{ ...inputStyle, borderRadius: '0.375rem 0 0 0.375rem', width: '100%' }}
                  value={form.percent}
                  onChange={(e) => set('percent', Number(e.target.value))}
                />
                <span style={{
                  padding: '0.5rem 0.75rem', backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1', borderLeft: 'none',
                  borderRadius: '0 0.375rem 0.375rem 0',
                  fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap',
                }}>%</span>
              </div>
            </Field>

            <Field label="Informasi Bawah">
              <input style={inputStyle} value={form.footer} onChange={(e) => set('footer', e.target.value)} placeholder="*Syarat & Ketentuan Berlaku" />
            </Field>

            {/* Upload logo + gambar hero */}
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.75rem', alignItems: 'flex-start' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', textAlign: 'right', paddingTop: '0.4rem' }}>Logo & Gambar</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'center' }}>
                  <UploadBox label="Logo (JPG/PNG)" preview={logoPreview} onChange={setLogoPreview} />
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Logo</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'center' }}>
                  <UploadBox label="Gambar Hero" preview={heroPreview} onChange={setHeroPreview} />
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Gambar</span>
                </div>
              </div>
            </div>

            {/* Warna */}
            <Field label="Warna Kupon">
              <ColourPicker colors={COUPON_COLORS} value={form.couponColor} onChange={(c) => set('couponColor', c)} />
            </Field>
            <Field label="Warna Teks">
              <ColourPicker colors={TEXT_COLORS} value={form.textColor} onChange={(c) => set('textColor', c)} />
            </Field>
            <Field label="Warna Persen">
              <ColourPicker colors={PERCENT_COLORS} value={form.percentColor} onChange={(c) => set('percentColor', c)} />
            </Field>

            {/* — Kupon Mini (Promo Strip) — */}
            <SectionLabel>Kupon Mini & Kode Promo</SectionLabel>

            <Field label="Judul">
              <input style={inputStyle} value={form.promoTitle} onChange={(e) => set('promoTitle', e.target.value)} placeholder="Diskon" />
            </Field>

            <Field label="Informasi">
              <input style={inputStyle} value={form.promoInfo} onChange={(e) => set('promoInfo', e.target.value)} placeholder="Voucher Diskon" />
            </Field>

            <Field label="Keterangan">
              <textarea
                rows={2}
                style={{ ...inputStyle, resize: 'vertical' }}
                value={form.promoFooter}
                onChange={(e) => set('promoFooter', e.target.value)}
              />
            </Field>

            <Field label="Label Kode">
              <input style={inputStyle} value={form.promoLabel} onChange={(e) => set('promoLabel', e.target.value)} placeholder="Kode Promo" />
            </Field>

            <Field label="Kode Promo">
              <input
                style={{ ...inputStyle, fontWeight: 700, letterSpacing: '0.05em' }}
                value={form.promoCode}
                onChange={(e) => set('promoCode', e.target.value.toUpperCase())}
                placeholder="SUTIDISKON8"
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.75rem', alignItems: 'flex-start' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', textAlign: 'right', paddingTop: '0.4rem' }}>Gambar Mini</label>
              <UploadBox label="Gambar Promo" preview={promoPreview} onChange={setPromoPreview} />
            </div>

            {/* — Ketentuan — */}
            <SectionLabel>Ketentuan</SectionLabel>

            <Field label="Min. Pembelian">
              <div style={{ display: 'flex', maxWidth: '200px' }}>
                <input
                  type="number" min="1"
                  style={{ ...inputStyle, borderRadius: '0.375rem 0 0 0.375rem', width: '100%' }}
                  value={form.minQuantity}
                  onChange={(e) => set('minQuantity', Number(e.target.value))}
                />
                <span style={{
                  padding: '0.5rem 0.75rem', backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1', borderLeft: 'none',
                  borderRadius: '0 0.375rem 0.375rem 0',
                  fontSize: '0.85rem', color: '#64748b',
                }}>Unit</span>
              </div>
            </Field>

            <Field label="Masa Berlaku">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="date" style={{ ...inputStyle, flex: 1 }} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
                <span style={{ fontSize: '0.8rem', color: '#64748b', flexShrink: 0 }}>s/d</span>
                <input type="date" style={{ ...inputStyle, flex: 1 }} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
              </div>
            </Field>

            {/* Tombol Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#006FB2', color: 'white', border: 'none',
                  padding: '0.65rem 2rem', borderRadius: '0.5rem',
                  fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  fontSize: '0.9rem',
                }}
              >
                {isSubmitting && <Loader2 size={16} className="spin" />}
                {isSubmitting ? 'Menyimpan...' : 'Tambahkan Sekarang!'}
              </button>
            </div>
          </div>

          {/* ════════════ KOLOM PREVIEW (kanan) ════════════ */}
          <div style={{ position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Preview Kupon
            </p>

            {/* Hero coupon */}
            <div style={{
              position: 'relative', borderRadius: '1rem', overflow: 'hidden',
              backgroundColor: form.couponColor, color: form.textColor,
              display: 'grid', gridTemplateColumns: '180px 110px 1fr',
              alignItems: 'center', padding: '1rem 1.25rem', minHeight: '160px',
              isolation: 'isolate',
            }}>
              {/* Dekoratif curve */}
              <div style={{
                position: 'absolute', inset: '0 auto 0 26%', width: '42%',
                background: 'rgba(255,255,255,0.18)', borderRadius: '60% 0 0 60%',
                transform: 'skewX(-12deg)', zIndex: 0,
              }} />
              {/* Notch kiri/kanan */}
              {(['left', 'right'] as const).map((side) => (
                <div key={side} style={{
                  position: 'absolute', top: '50%', [side]: '-16px',
                  width: '32px', height: '32px', borderRadius: '50%',
                  backgroundColor: '#f1f5f9', transform: 'translateY(-50%)', zIndex: 2,
                }} />
              ))}
              <div style={{ zIndex: 1 }}>{heroPreview ? <img src={heroPreview} alt="" style={{ width: '100%', objectFit: 'contain', maxHeight: '120px' }} /> : bottleSet}</div>
              <div style={{ width: '100px', height: '120px', zIndex: 1 }}>{logoPreview ? <img src={logoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : sutiLogo}</div>
              <div style={{ zIndex: 1, paddingLeft: '0.5rem' }}>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.9 }}>{form.title}</p>
                <p style={{ margin: '0 0 0.25rem', fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.1 }}>{form.info}</p>
                <p style={{ margin: 0, fontSize: '3.5rem', fontWeight: 900, lineHeight: 0.9, color: form.percentColor }}>
                  {form.percent}<span style={{ fontSize: '1.2rem', verticalAlign: 'super' }}>%</span>
                </p>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.55rem', opacity: 0.85 }}>{form.footer}</p>
              </div>
            </div>

            {/* Mini coupon */}
            <div style={{
              position: 'relative', borderRadius: '0.875rem', overflow: 'hidden',
              backgroundColor: form.couponColor, color: form.textColor,
              display: 'grid', gridTemplateColumns: '1fr 140px',
              minHeight: '100px', isolation: 'isolate',
            }}>
              {(['left', 'right'] as const).map((side) => (
                <div key={side} style={{
                  position: 'absolute', top: '50%', [side]: '-14px',
                  width: '28px', height: '28px', borderRadius: '50%',
                  backgroundColor: '#f1f5f9', transform: 'translateY(-50%)', zIndex: 2,
                }} />
              ))}
              <div style={{ padding: '0.85rem 1.25rem 2.5rem', minWidth: 0 }}>
                <p style={{ margin: '0 0 0.1rem', fontSize: '0.8rem' }}>{form.promoTitle}</p>
                <p style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.1 }}>
                  {form.promoInfo}{' '}
                  <span style={{ color: form.percentColor, fontSize: '2.4rem', fontWeight: 900 }}>{form.percent}<sup style={{ fontSize: '0.8rem' }}>%</sup></span>
                </p>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.55rem', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {form.promoFooter}
                </p>
              </div>
              <div style={{ display: 'grid', placeItems: 'center', padding: '0.5rem 0.75rem 2.5rem 0' }}>
                {promoPreview ? <img src={promoPreview} alt="" style={{ width: '100%', objectFit: 'contain', maxHeight: '70px' }} /> : bottleSet}
              </div>
              {/* Code strip */}
              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                height: '32px', backgroundColor: 'rgba(0,55,110,0.82)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 1.25rem', fontSize: '0.75rem',
              }}>
                <span>{form.promoLabel}</span>
                <strong style={{ letterSpacing: '0.04em' }}>{form.promoCode}</strong>
              </div>
            </div>

            {/* Sukses indicator */}
            {created && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem' }}>
                <CheckCircle size={22} />
                Kupon diskon berhasil dibuat
              </div>
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
