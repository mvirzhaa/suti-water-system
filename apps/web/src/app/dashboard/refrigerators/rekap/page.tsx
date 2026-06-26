'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import {
  Calculator,
  Plus,
  Trash2,
  Printer,
  ArrowLeft,
  Save,
  PlusCircle,
  Percent,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { kulkasRekapService } from '@/services/kulkas-rekap.service';
import { refrigeratorService } from '@/services/refrigerator.service';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatRupiah, formatNumber, formatDate, todayISO } from '@/lib/format';
import type { KulkasRekap, RekapLine, CreateRekapInput } from '@/types/kulkas-rekap';

const BRAND = '#0CA5EA';
const BRAND_DARK = '#006FB2';

// Pecahan uang (urutan sesuai form fisik).
const DENOMS = [
  { key: 'qty500', value: 500, label: '500' },
  { key: 'qty1000', value: 1000, label: '1.000' },
  { key: 'qty2000', value: 2000, label: '2.000' },
  { key: 'qty5000', value: 5000, label: '5.000' },
  { key: 'qty10000', value: 10000, label: '10.000' },
  { key: 'qty20000', value: 20000, label: '20.000' },
  { key: 'qty50000', value: 50000, label: '50.000' },
  { key: 'qty100000', value: 100000, label: '100.000' },
] as const;

type DenomKey = (typeof DENOMS)[number]['key'];

type LineForm = {
  refrigeratorId: string | null;
  label: string;
  qty: Record<DenomKey, number>;
  qrisAmount: number;
};

type ShareForm = { instansiName: string; percentage: number };

const emptyQty = (): Record<DenomKey, number> =>
  DENOMS.reduce((acc, d) => ({ ...acc, [d.key]: 0 }), {} as Record<DenomKey, number>);

const blankLine = (): LineForm => ({ refrigeratorId: null, label: '', qty: emptyQty(), qrisAmount: 0 });

const lineCash = (line: LineForm) => DENOMS.reduce((sum, d) => sum + (line.qty[d.key] || 0) * d.value, 0);

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

// ---------------------------------------------------------------------------
//  CETAK — meniru lembar "Rekapitulasi Perhitungan Uang Kulkas Pekanan"
// ---------------------------------------------------------------------------
const logoSvg = `<img src="/images/logo-login2.png" alt="Suti Water" style="width:120px;height:auto;object-fit:contain;" />`;
const bksppiMark = `<img src="/images/bksppi.png" alt="BKsPPI" style="width:110px;height:auto;object-fit:contain;justify-self:end;" />`;

function buildRekapPrintHtml(rekap: KulkasRekap) {
  const num = (n: number) => formatNumber(n);

  const box = (line: RekapLine) => {
    const rows = DENOMS.map((d) => {
      const pcs = Number((line as unknown as Record<string, number>)[d.key]) || 0;
      const nominal = pcs * d.value;
      return `<tr><td class="l">${d.label}</td><td class="c">${pcs ? num(pcs) : ''}</td><td class="r">${nominal ? num(nominal) : ''}</td></tr>`;
    }).join('');
    const qris = Number(line.qrisAmount) || 0;
    return `
      <div class="box">
        <div class="box-title">${escapeHtml(line.label)}</div>
        <table>
          <thead><tr><th>Nominal</th><th>Jumlah pcs</th><th>Jumlah Nominal</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr><td class="l" colspan="2" style="text-align:left;">Total Tunai</td><td class="r">${num(Number(line.cashTotal) || 0)}</td></tr>
            ${qris > 0 ? `<tr><td class="l" colspan="2" style="text-align:left;">QRIS</td><td class="r">${num(qris)}</td></tr>` : ''}
          </tfoot>
        </table>
      </div>`;
  };

  const boxes = rekap.lines.map(box).join('');

  const sharesRows = rekap.shares
    .map(
      (s) =>
        `<tr><td>${escapeHtml(s.instansiName)} (${Number(s.percentage)}%)</td><td class="r">${formatRupiah(Number(s.amount) || 0)}</td></tr>`,
    )
    .join('');

  const modalLine =
    rekap.dusSold > 0
      ? `${num(rekap.dusSold)} dus &times; ${formatRupiah(Number(rekap.pricePerDus) || 0)} = ${formatRupiah(Number(rekap.modalCost) || 0)}`
      : formatRupiah(Number(rekap.modalCost) || 0);

  const summary = `
    <div class="summary">
      <h3>Ringkasan & Bagi Hasil</h3>
      <table class="sum">
        <tbody>
          <tr><td>Total Tunai</td><td class="r">${formatRupiah(Number(rekap.cashTotal) || 0)}</td></tr>
          <tr><td>Total QRIS</td><td class="r">${formatRupiah(Number(rekap.qrisTotal) || 0)}</td></tr>
          <tr class="strong"><td>Total Keseluruhan</td><td class="r">${formatRupiah(Number(rekap.grandTotal) || 0)}</td></tr>
          <tr><td>Modal</td><td class="r">${modalLine}</td></tr>
          <tr class="strong"><td>Selisih Keuntungan</td><td class="r">${formatRupiah(Number(rekap.netProfit) || 0)}</td></tr>
          ${sharesRows}
        </tbody>
      </table>
    </div>`;

  const periodLine = `${rekap.title ? escapeHtml(rekap.title) + ' &mdash; ' : ''}Hari/Tanggal: ${formatDate(rekap.rekapDate)}`;

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Rekap Kulkas Pekanan</title>
        <style>
          @page { size: A4 landscape; margin: 14mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #111; background: #fff; font-family: Arial, Helvetica, sans-serif; }
          
          .report-header {
            display: grid;
            grid-template-columns: 150px 1fr 160px;
            align-items: center;
            gap: 18px;
            margin-bottom: 28px;
          }
          .title {
            text-align: center;
            color: #006fb2;
            line-height: 1.16;
          }
          .title h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 800;
          }
          .title h2 {
            margin: 2px 0 10px;
            font-size: 24px;
            font-weight: 800;
          }
          .title p {
            margin: 0;
            color: #111;
            font-size: 16px;
          }
          .cert-mark {
            justify-self: end;
          }

          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
          
          .box { border: 1.6px solid #111; }
          .box-title { text-align: center; font-weight: 800; font-size: 13px; padding: 6px; border-bottom: 1.6px solid #111; background: #f1f5f9; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1.6px solid #111; padding: 4px 6px; }
          th { font-weight: 800; background: #fafafa; }
          td.c { text-align: center; } td.r { text-align: right; } td.l { text-align: left; }
          tfoot td { font-weight: 800; background: #f8fafc; }
          
          .totals { margin-top: 16px; text-align: right; font-size: 16px; font-weight: 800; color: #006fb2; }
          
          .summary { margin-top: 20px; max-width: 400px; }
          .summary h3 { margin: 0 0 8px; font-size: 16px; color: ${BRAND_DARK}; }
          table.sum { font-size: 13px; border: 1.6px solid #111; }
          table.sum td { border: 1.6px solid #111; padding: 6px 10px; }
          table.sum tr.strong td { font-weight: 800; background: #f8fafc; }
          
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <main style="width: 100%; padding: 12px 16px;">
          <header class="report-header">
            <div>${logoSvg}</div>
            <div class="title">
              <h1>REKAPITULASI PERHITUNGAN UANG KULKAS PEKANAN</h1>
              <h2>Air Mineral Dalam Kemasan Suti Water</h2>
              <p>${periodLine}</p>
            </div>
            <div>${bksppiMark}</div>
          </header>

          <div class="grid">${boxes}</div>
          <div class="totals">TOTAL KESELURUHAN (TUNAI): ${formatRupiah(Number(rekap.cashTotal) || 0)}</div>
          ${summary}
        </main>
        <script>
          window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 350); });
        </script>
      </body>
    </html>`;
}

function printRekap(rekap: KulkasRekap) {
  const win = window.open('', '_blank');
  if (!win) {
    Swal.fire('Pop-up diblokir', 'Izinkan pop-up browser untuk mencetak rekap.', 'warning');
    return;
  }
  win.document.write(buildRekapPrintHtml(rekap));
  win.document.close();
}

export default function KulkasRekapPage() {
  const user = useAuthStore((state) => state.user);
  const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'PIMPINAN';

  const [rekaps, setRekaps] = useState<KulkasRekap[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- State form -----------------------------------------------------------
  const [rekapDate, setRekapDate] = useState(todayISO());
  const [title, setTitle] = useState('');
  const [dusSold, setDusSold] = useState(0);
  const [pricePerDus, setPricePerDus] = useState(0);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineForm[]>([blankLine()]);
  const [shares, setShares] = useState<ShareForm[]>([]);

  const fetchRekaps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await kulkasRekapService.getAll({ limit: 50 });
      setRekaps(res.data);
    } catch (error) {
      console.error('Error fetching rekap', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRekaps();
  }, [fetchRekaps]);

  // Prefill baris dari kulkas aktif saat form dibuka pertama kali.
  const openForm = async () => {
    setShowForm(true);
    try {
      const res = await refrigeratorService.getAll({ limit: 100, isActive: true });
      if (res.data.length > 0) {
        setLines(
          res.data.map((r) => ({
            refrigeratorId: r.id,
            label: r.name,
            qty: emptyQty(),
            qrisAmount: 0,
          })),
        );
      }
    } catch {
      // biarkan baris default bila gagal
    }
  };

  const resetForm = () => {
    setRekapDate(todayISO());
    setTitle('');
    setDusSold(0);
    setPricePerDus(0);
    setNotes('');
    setLines([blankLine()]);
    setShares([]);
  };

  // --- Kalkulasi langsung ---------------------------------------------------
  const cashTotal = useMemo(() => lines.reduce((s, l) => s + lineCash(l), 0), [lines]);
  const qrisTotal = useMemo(() => lines.reduce((s, l) => s + (l.qrisAmount || 0), 0), [lines]);
  const grandTotal = cashTotal + qrisTotal;
  const modalCost = dusSold * pricePerDus;
  const netProfit = grandTotal - modalCost;
  const sharesSum = shares.reduce((s, x) => s + (Number(x.percentage) || 0), 0);

  // --- Mutator baris --------------------------------------------------------
  const setLineQty = (idx: number, key: DenomKey, val: number) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, qty: { ...l.qty, [key]: val } } : l)),
    );
  };
  const setLineField = (idx: number, patch: Partial<LineForm>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, blankLine()]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const addShare = () => setShares((prev) => [...prev, { instansiName: '', percentage: 0 }]);
  const setShare = (idx: number, patch: Partial<ShareForm>) =>
    setShares((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  const removeShare = (idx: number) => setShares((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    // Validasi ringan di klien.
    const validLines = lines.filter((l) => l.label.trim().length > 0);
    if (validLines.length === 0) {
      Swal.fire('Belum ada kulkas', 'Isi minimal satu baris kulkas/lokasi.', 'warning');
      return;
    }
    if (shares.length > 0 && Math.abs(sharesSum - 100) > 0.01) {
      Swal.fire('Persentase belum 100%', `Total bagi hasil sekarang ${sharesSum}%. Harus tepat 100%.`, 'warning');
      return;
    }

    const payload: CreateRekapInput = {
      rekapDate,
      title: title.trim() || null,
      dusSold,
      pricePerDus,
      notes: notes.trim() || null,
      lines: validLines.map((l) => ({
        refrigeratorId: l.refrigeratorId,
        label: l.label.trim(),
        ...l.qty,
        qrisAmount: l.qrisAmount || 0,
      })),
      shares: shares
        .filter((s) => s.instansiName.trim().length > 0)
        .map((s) => ({ instansiName: s.instansiName.trim(), percentage: Number(s.percentage) || 0 })),
    };

    try {
      setSaving(true);
      const created = await kulkasRekapService.create(payload);
      setShowForm(false);
      resetForm();
      await fetchRekaps();
      const result = await Swal.fire({
        title: 'Tersimpan!',
        text: 'Rekap pekanan berhasil disimpan.',
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Cetak Sekarang',
        cancelButtonText: 'Tutup',
        confirmButtonColor: BRAND_DARK,
      });
      if (result.isConfirmed) printRekap(created);
    } catch (error) {
      Swal.fire('Gagal!', getApiErrorMessage(error, 'Gagal menyimpan rekap.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintSaved = async (id: string) => {
    try {
      const full = await kulkasRekapService.getById(id);
      printRekap(full);
    } catch (error) {
      Swal.fire('Gagal!', getApiErrorMessage(error, 'Gagal memuat data rekap.'), 'error');
    }
  };

  const handleDelete = async (rekap: KulkasRekap) => {
    const result = await Swal.fire({
      title: 'Hapus rekap ini?',
      text: `Rekap ${formatDate(rekap.rekapDate)} akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await kulkasRekapService.delete(rekap.id);
      await fetchRekaps();
      Swal.fire('Terhapus!', 'Rekap berhasil dihapus.', 'success');
    } catch (error) {
      Swal.fire('Gagal!', getApiErrorMessage(error, 'Gagal menghapus rekap.'), 'error');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.4rem 0.5rem',
    border: '1px solid #cbd5e1',
    borderRadius: '0.25rem',
    outline: 'none',
    fontSize: '0.85rem',
  };
  const qtyInputStyle: React.CSSProperties = {
    width: '60px',
    padding: '0.3rem',
    border: '1px solid #cbd5e1',
    borderRadius: '0.25rem',
    outline: 'none',
    fontSize: '0.8rem',
    textAlign: 'center',
  };
  const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 600, color: '#475569' };

  return (
    <div>
      <div className="dash-card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', color: '#1e293b' }}>
            <div style={{ backgroundColor: BRAND, padding: '0.5rem', borderRadius: '0.5rem', color: 'white' }}>
              <Calculator size={20} />
            </div>
            Rekap Uang Kulkas Pekanan
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              href="/dashboard/refrigerators"
              style={{ backgroundColor: 'white', color: BRAND_DARK, border: `1px solid ${BRAND_DARK}`, padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}
            >
              <ArrowLeft size={18} /> Kembali ke Kulkas
            </Link>
            {!showForm && (
              <button
                onClick={openForm}
                style={{ backgroundColor: BRAND_DARK, color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <Plus size={18} /> Buat Rekap Baru
              </button>
            )}
          </div>
        </div>

        {/* ---------------- FORM ---------------- */}
        {showForm && (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>Hari/Tanggal</label>
                <input type="date" value={rekapDate} onChange={(e) => setRekapDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Judul Lembar (opsional)</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="mis. Kampus / RSI" style={inputStyle} />
              </div>
            </div>

            {/* Matriks pecahan per kulkas */}
            <div className="table-wrapper" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
              <table className="dash-table" style={{ fontSize: '0.8rem', minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: '150px', textAlign: 'left' }}>Kulkas / Lokasi</th>
                    {DENOMS.map((d) => (
                      <th key={d.key} style={{ textAlign: 'center' }}>{d.label}</th>
                    ))}
                    <th style={{ textAlign: 'center' }}>QRIS</th>
                    <th style={{ textAlign: 'right' }}>Total Tunai</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="text"
                          value={line.label}
                          onChange={(e) => setLineField(idx, { label: e.target.value })}
                          placeholder="Nama kulkas/lokasi"
                          style={{ ...inputStyle, minWidth: '140px' }}
                        />
                      </td>
                      {DENOMS.map((d) => (
                        <td key={d.key} style={{ textAlign: 'center' }}>
                          <input
                            type="number"
                            min={0}
                            value={line.qty[d.key] || ''}
                            onChange={(e) => setLineQty(idx, d.key, Math.max(0, Number(e.target.value) || 0))}
                            style={qtyInputStyle}
                          />
                        </td>
                      ))}
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          min={0}
                          value={line.qrisAmount || ''}
                          onChange={(e) => setLineField(idx, { qrisAmount: Math.max(0, Number(e.target.value) || 0) })}
                          style={{ ...qtyInputStyle, width: '90px' }}
                        />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatRupiah(lineCash(line))}</td>
                      <td style={{ textAlign: 'center' }}>
                        {lines.length > 1 && (
                          <button onClick={() => removeLine(idx)} title="Hapus baris" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.25rem', borderRadius: '0.25rem', cursor: 'pointer', display: 'inline-flex' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, backgroundColor: '#f1f5f9' }}>
                    <td style={{ textAlign: 'right' }}>Total</td>
                    <td colSpan={DENOMS.length} style={{ textAlign: 'right' }}>Tunai: {formatRupiah(cashTotal)}</td>
                    <td style={{ textAlign: 'center' }}>{formatRupiah(qrisTotal)}</td>
                    <td style={{ textAlign: 'right' }}>{formatRupiah(grandTotal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <button onClick={addLine} style={{ marginTop: '0.75rem', backgroundColor: 'white', color: BRAND_DARK, border: `1px dashed ${BRAND_DARK}`, padding: '0.4rem 0.9rem', borderRadius: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
              <PlusCircle size={16} /> Tambah Baris Kulkas
            </button>

            {/* Modal & Bagi hasil */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
              <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#1e293b' }}>Modal (Barang Terjual)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Total Terjual (dus)</label>
                    <input type="number" min={0} value={dusSold || ''} onChange={(e) => setDusSold(Math.max(0, Number(e.target.value) || 0))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Harga / dus</label>
                    <input type="number" min={0} value={pricePerDus || ''} onChange={(e) => setPricePerDus(Math.max(0, Number(e.target.value) || 0))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#475569' }}>
                  Modal: <strong>{formatRupiah(modalCost)}</strong>
                </div>
              </div>

              <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Percent size={16} /> Bagi Hasil
                  </h4>
                  <button onClick={addShare} style={{ backgroundColor: '#f1f5f9', color: BRAND_DARK, border: 'none', padding: '0.25rem 0.6rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>+ Instansi</button>
                </div>
                {shares.length === 0 && <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Opsional. Total persen harus 100%.</p>}
                {shares.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <input type="text" value={s.instansiName} onChange={(e) => setShare(idx, { instansiName: e.target.value })} placeholder="Nama instansi" style={{ ...inputStyle, flex: 1 }} />
                    <input type="number" min={0} max={100} value={s.percentage || ''} onChange={(e) => setShare(idx, { percentage: Number(e.target.value) || 0 })} placeholder="%" style={{ ...inputStyle, width: '70px' }} />
                    <span style={{ fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap', minWidth: '90px', textAlign: 'right' }}>
                      {formatRupiah((netProfit * (Number(s.percentage) || 0)) / 100)}
                    </span>
                    <button onClick={() => removeShare(idx)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.25rem', borderRadius: '0.25rem', cursor: 'pointer', display: 'inline-flex' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {shares.length > 0 && (
                  <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: Math.abs(sharesSum - 100) < 0.01 ? '#16a34a' : '#ef4444' }}>
                    Total: {sharesSum}% {Math.abs(sharesSum - 100) < 0.01 ? '✓' : '(harus 100%)'}
                  </div>
                )}
              </div>
            </div>

            {/* Ringkasan */}
            <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: 'white', border: `1px solid ${BRAND}`, borderRadius: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
              {[
                { label: 'Total Tunai', value: formatRupiah(cashTotal) },
                { label: 'Total QRIS', value: formatRupiah(qrisTotal) },
                { label: 'Total Keseluruhan', value: formatRupiah(grandTotal) },
                { label: 'Modal', value: formatRupiah(modalCost) },
                { label: 'Selisih Keuntungan', value: formatRupiah(netProfit), highlight: true },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: s.highlight ? BRAND_DARK : '#1e293b' }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div>
              <label style={{ ...labelStyle, display: 'block', marginTop: '1rem' }}>Catatan (opsional)</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => { setShowForm(false); resetForm(); }} style={{ backgroundColor: 'white', color: '#475569', border: '1px solid #cbd5e1', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={handleSave} disabled={saving} style={{ backgroundColor: BRAND_DARK, color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: saving ? 0.6 : 1 }}>
                <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Rekap'}
              </button>
            </div>
          </div>
        )}

        {/* ---------------- DAFTAR REKAP ---------------- */}
        <div className="table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Tanggal</th>
                <th>Judul</th>
                <th>Jml Kulkas</th>
                <th>Total Keseluruhan</th>
                <th>Selisih Keuntungan</th>
                <th>Dibuat oleh</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center' }}>Memuat data...</td></tr>
              ) : rekaps.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center' }}>Belum ada rekap. Klik &quot;Buat Rekap Baru&quot;.</td></tr>
              ) : (
                rekaps.map((r, index) => (
                  <tr key={r.id}>
                    <td>{index + 1}</td>
                    <td>{formatDate(r.rekapDate)}</td>
                    <td>{r.title || '-'}</td>
                    <td>{r._count?.lines ?? r.lines?.length ?? '-'}</td>
                    <td style={{ fontWeight: 600 }}>{formatRupiah(Number(r.grandTotal))}</td>
                    <td style={{ fontWeight: 600, color: Number(r.netProfit) < 0 ? '#ef4444' : BRAND_DARK }}>{formatRupiah(Number(r.netProfit))}</td>
                    <td>{r.user?.name || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => handlePrintSaved(r.id)} title="Cetak" style={{ backgroundColor: BRAND, color: 'white', border: 'none', padding: '0.3rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                          <Printer size={14} />
                        </button>
                        {canDelete && (
                          <button onClick={() => handleDelete(r)} title="Hapus" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.3rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
