'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, FileDown, Printer } from 'lucide-react';
import Swal from 'sweetalert2';
import { stockInService } from '@/services/stock-in.service';
import { stockOutService } from '@/services/stock-out.service';
import { SIZE_ALL, SIZE_OPTIONS, type SizeFilter } from '@/lib/water-sizes';
import type { StockInRecord, StockOutRecord } from '@/types/api';

type ReportType = 'stock-in' | 'stock-out';
type PeriodKey =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'lastYear'
  | 'custom';

type DateRange = {
  start: string;
  end: string;
};

const periodOptions: Array<{ key: PeriodKey; label: string }> = [
  { key: 'today', label: 'Hari ini' },
  { key: 'yesterday', label: 'Kemarin' },
  { key: 'last7', label: '7 hari terakhir' },
  { key: 'last30', label: '30 hari terakhir' },
  { key: 'thisMonth', label: 'Bulan ini' },
  { key: 'lastMonth', label: 'Bulan lalu' },
  { key: 'thisYear', label: 'Tahun ini' },
  { key: 'lastYear', label: 'Tahun lalu' },
  { key: 'custom', label: 'Sesuaikan tanggal' },
];

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const getPresetRange = (key: PeriodKey): DateRange => {
  const today = new Date();

  if (key === 'yesterday') {
    const yesterday = addDays(today, -1);
    return { start: toInputDate(yesterday), end: toInputDate(yesterday) };
  }

  if (key === 'last7') {
    return { start: toInputDate(addDays(today, -6)), end: toInputDate(today) };
  }

  if (key === 'last30') {
    return { start: toInputDate(addDays(today, -29)), end: toInputDate(today) };
  }

  if (key === 'thisMonth') {
    return { start: toInputDate(startOfMonth(today)), end: toInputDate(today) };
  }

  if (key === 'lastMonth') {
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return { start: toInputDate(startOfMonth(lastMonth)), end: toInputDate(endOfMonth(lastMonth)) };
  }

  if (key === 'thisYear') {
    return { start: `${today.getFullYear()}-01-01`, end: toInputDate(today) };
  }

  if (key === 'lastYear') {
    const year = today.getFullYear() - 1;
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }

  return { start: toInputDate(today), end: toInputDate(today) };
};

const formatDate = (value: string, separator = '/') => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return [day, month, year].join(separator);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const escapeHtml = (value: unknown) => {
  return String(value ?? '-')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

const isWithinRange = (value: string, range: DateRange) => {
  const date = new Date(value);
  const start = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T23:59:59`);

  return date >= start && date <= end;
};

const logoSvg = `<img src="/images/logo-login2.png" alt="Suti Water" style="width:120px;height:auto;object-fit:contain;" />`;

const bksppiMark = `<img src="/images/bksppi.png" alt="BKsPPI" style="width:110px;height:auto;object-fit:contain;justify-self:end;" />`;

const getReportTitle = (type: ReportType) => {
  return type === 'stock-in' ? 'Laporan Barang Masuk' : 'Laporan Barang Keluar';
};

const buildStockInRows = (rows: StockInRecord[]) => {
  const totalQty = rows.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalAmount = rows.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);

  return {
    totalQty,
    totalAmount,
    table: `
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>Kode Barang</th>
            <th>Tanggal Masuk</th>
            <th>Pemasok</th>
            <th>Nama Barang</th>
            <th>Ukuran</th>
            <th>Satuan</th>
            <th>Harga</th>
            <th>Jumlah</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((item, index) => `
            <tr>
              <td>${index + 1}.</td>
              <td>${escapeHtml(item.product?.sku)}</td>
              <td>${formatDate(item.entryDate, '-')}</td>
              <td>${escapeHtml(item.suppl?.name || item.supplier)}</td>
              <td>${escapeHtml(item.product?.name)}</td>
              <td>${escapeHtml(item.size)}</td>
              <td>${escapeHtml(item.product?.unit)}</td>
              <td>${formatCurrency(Number(item.pricePerUnit || 0))}</td>
              <td>${Number(item.quantity || 0).toLocaleString('id-ID')}</td>
              <td>${formatCurrency(Number(item.totalCost || 0))}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="8" class="total-label">Total Keseluruhan:</td>
            <td>${totalQty.toLocaleString('id-ID')}</td>
            <td>${formatCurrency(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
    `,
  };
};

const buildStockOutRows = (rows: StockOutRecord[]) => {
  // Hanya tipe AGEN yang dihitung sebagai pendapatan
  const agenRows = rows.filter(r => !r.exitType || r.exitType === 'AGEN');
  const totalQty = rows.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalAmount = agenRows.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);

  const exitTypeBadge: Record<string, string> = {
    AGEN: '🏪 Agen',
    KULKAS: '🧊 Kulkas',
    SEDEKAH: '🤲 Sedekah',
  };

  return {
    totalQty,
    totalAmount,
    table: `
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>Kode Barang</th>
            <th>Tanggal Keluar</th>
            <th>Tipe</th>
            <th>Barang</th>
            <th>Ukuran</th>
            <th>Nama Agen/Pembeli</th>
            <th>Harga</th>
            <th>Diskon</th>
            <th>Jumlah</th>
            <th>Total Harga</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((item, index) => {
            const exitT = item.exitType ?? 'AGEN';
            const isNonRevenue = exitT !== 'AGEN';
            return `
              <tr style="${isNonRevenue ? 'background:#f8fafc;color:#64748b;' : ''}">
                <td>${index + 1}.</td>
                <td>${escapeHtml(item.product?.sku)}</td>
                <td>${formatDate(item.exitDate, '-')}</td>
                <td>${exitTypeBadge[exitT] || exitT}</td>
                <td>${escapeHtml(item.product?.name)}</td>
                <td>${escapeHtml(item.size)}</td>
                <td>${escapeHtml(item.agent?.name || item.buyerName)}</td>
                <td>${formatCurrency(Number(item.pricePerUnit || 0))}</td>
                <td>${Number(item.discountAmount || 0) > 0 ? formatCurrency(Number(item.discountAmount)) : 'Rp. -'}</td>
                <td>${Number(item.quantity || 0).toLocaleString('id-ID')}</td>
                <td>${isNonRevenue ? '<em>Tidak dihitung</em>' : formatCurrency(Number(item.totalPrice || 0))}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan=\"10\" class=\"total-label\">Total Keseluruhan (Pendapatan Agen):</td>
            <td>${totalQty.toLocaleString('id-ID')}</td>
            <td>${formatCurrency(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
    `,
  };
};

type SizeGroup = { size: string; qty: number; value: number; count: number };

// Rekap dikelompokkan per ukuran (untuk tampilan "Keseluruhan").
const summarizeBySize = (
  rows: Array<{ size?: string | null; quantity?: number }>,
  getValue: (row: any) => number,
): SizeGroup[] => {
  const map = new Map<string, SizeGroup>();
  for (const row of rows) {
    const key = row.size || 'Tanpa ukuran';
    const existing = map.get(key) ?? { size: key, qty: 0, value: 0, count: 0 };
    existing.qty += Number(row.quantity || 0);
    existing.value += getValue(row);
    existing.count += 1;
    map.set(key, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.size.localeCompare(b.size));
};

const buildSizeBreakdownTable = (groups: SizeGroup[]) => {
  const tQty = groups.reduce((sum, g) => sum + g.qty, 0);
  const tVal = groups.reduce((sum, g) => sum + g.value, 0);
  const tCnt = groups.reduce((sum, g) => sum + g.count, 0);

  return `
    <h3 style="margin:22px 0 10px;font-size:16px;color:#006fb2;">Rekap per Ukuran</h3>
    <table>
      <thead>
        <tr>
          <th>Ukuran</th>
          <th>Jumlah</th>
          <th>Transaksi</th>
          <th>Total Nilai</th>
        </tr>
      </thead>
      <tbody>
        ${groups.map((g) => `
          <tr>
            <td>${escapeHtml(g.size)}</td>
            <td>${g.qty.toLocaleString('id-ID')}</td>
            <td>${g.count.toLocaleString('id-ID')}</td>
            <td>${formatCurrency(g.value)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td class="total-label">Total</td>
          <td>${tQty.toLocaleString('id-ID')}</td>
          <td>${tCnt.toLocaleString('id-ID')}</td>
          <td>${formatCurrency(tVal)}</td>
        </tr>
      </tfoot>
    </table>
  `;
};

const buildPrintDocument = (type: ReportType, range: DateRange, table: string, sizeLabel?: string) => {
  const title = getReportTitle(type);
  const periodLine = sizeLabel
    ? `Periode ${formatDate(range.start)} - ${formatDate(range.end)} · Ukuran: ${escapeHtml(sizeLabel)}`
    : `Periode ${formatDate(range.start)} - ${formatDate(range.end)}`;

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>laporan</title>
        <style>
          @page { size: A4 landscape; margin: 14mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #000;
            background: #fff;
            font-family: Arial, Helvetica, sans-serif;
          }
          .page {
            width: 100%;
            min-height: 180mm;
            padding: 12px 16px;
          }
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
            font-size: 30px;
            font-weight: 800;
          }
          .title h2 {
            margin: 2px 0 10px;
            font-size: 28px;
            font-weight: 800;
          }
          .title p {
            margin: 0;
            color: #111;
            font-size: 18px;
          }
          .cert-mark {
            justify-self: end;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #111;
            font-size: 13px;
          }
          th,
          td {
            border: 1.6px solid #111;
            padding: 11px 8px;
            text-align: center;
            vertical-align: middle;
          }
          th {
            font-weight: 800;
          }
          tbody td {
            min-height: 42px;
          }
          tfoot td {
            font-weight: 800;
          }
          .total-label {
            text-align: right;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <header class="report-header">
            <div>${logoSvg}</div>
            <div class="title">
              <h1>${title}</h1>
              <h2>Air Mineral Dalam Kemasan Suti Water</h2>
              <p>${periodLine}</p>
            </div>
            ${bksppiMark}
          </header>
          ${table}
        </main>
        <script>
          window.addEventListener('load', function () {
            setTimeout(function () { window.print(); }, 350);
          });
        </script>
      </body>
    </html>
  `;
};

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('stock-in');
  const [periodKey, setPeriodKey] = useState<PeriodKey>('thisMonth');
  const [customRange, setCustomRange] = useState<DateRange>(() => getPresetRange('thisMonth'));
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>(SIZE_ALL);

  const sizeLabel = sizeFilter === SIZE_ALL ? undefined : sizeFilter;

  const selectedPeriod = periodOptions.find((item) => item.key === periodKey) ?? periodOptions[0];
  const activeRange = useMemo(() => {
    return periodKey === 'custom' ? customRange : getPresetRange(periodKey);
  }, [customRange, periodKey]);

  const handlePeriodChange = (key: PeriodKey) => {
    setPeriodKey(key);
    if (key !== 'custom') {
      setCustomRange(getPresetRange(key));
    }
    setIsPeriodOpen(false);
  };

  const handlePrint = async () => {
    if (!activeRange.start || !activeRange.end) {
      Swal.fire('Tanggal belum lengkap', 'Pilih tanggal mulai dan tanggal selesai.', 'warning');
      return;
    }

    if (new Date(activeRange.start) > new Date(activeRange.end)) {
      Swal.fire('Tanggal tidak valid', 'Tanggal mulai tidak boleh melebihi tanggal selesai.', 'warning');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      Swal.fire('Pop-up diblokir', 'Izinkan pop-up browser untuk mencetak laporan.', 'warning');
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>laporan</title>
          <style>
            body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; color: #0f172a; }
          </style>
        </head>
        <body>Menyiapkan laporan...</body>
      </html>
    `);
    printWindow.document.close();

    try {
      setIsSubmitting(true);

      if (reportType === 'stock-in') {
        const response = await stockInService.getAll({ limit: 1000 });
        const rows = (response.data as StockInRecord[])
          .filter((item) => isWithinRange(item.entryDate, activeRange))
          .filter((item) => sizeFilter === SIZE_ALL || item.size === sizeFilter);

        if (rows.length === 0) {
          printWindow.close();
          Swal.fire('Data kosong', 'Tidak ada data barang masuk pada periode yang dipilih.', 'info');
          return;
        }

        const report = buildStockInRows(rows);
        // Saat "Keseluruhan", sertakan rekap per ukuran di bawah tabel detail.
        const breakdown = sizeFilter === SIZE_ALL
          ? buildSizeBreakdownTable(summarizeBySize(rows, (r) => Number(r.totalCost || 0)))
          : '';
        printWindow.document.open();
        printWindow.document.write(buildPrintDocument(reportType, activeRange, report.table + breakdown, sizeLabel));
        printWindow.document.close();
        return;
      }

      const response = await stockOutService.getAll({ limit: 1000 });
      const rows = (response.data as StockOutRecord[])
        .filter((item) => isWithinRange(item.exitDate, activeRange))
        .filter((item) => sizeFilter === SIZE_ALL || item.size === sizeFilter);

      if (rows.length === 0) {
        printWindow.close();
        Swal.fire('Data kosong', 'Tidak ada data barang keluar pada periode yang dipilih.', 'info');
        return;
      }

      const report = buildStockOutRows(rows);
      const breakdown = sizeFilter === SIZE_ALL
        ? buildSizeBreakdownTable(summarizeBySize(rows, (r) => Number(r.totalPrice || 0)))
        : '';
      printWindow.document.open();
      printWindow.document.write(buildPrintDocument(reportType, activeRange, report.table + breakdown, sizeLabel));
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing report', error);
      printWindow.close();
      Swal.fire('Gagal', 'Gagal mengambil data laporan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reports-page">
      <section className="report-card">
        <div className="report-card-header">
          <div className="report-card-icon">
            <FileDown size={28} />
          </div>
          <h2>Formulir Cetak Laporan</h2>
        </div>

        <div className="report-form">
          <div className="report-field">
            <label>Cetak Laporan</label>
            <div className="report-radio-group">
              <label className="report-radio">
                <input
                  type="radio"
                  name="reportType"
                  checked={reportType === 'stock-in'}
                  onChange={() => setReportType('stock-in')}
                />
                <span>Cetak Laporan Barang Masuk</span>
              </label>
              <label className="report-radio">
                <input
                  type="radio"
                  name="reportType"
                  checked={reportType === 'stock-out'}
                  onChange={() => setReportType('stock-out')}
                />
                <span>Cetak Laporan Barang Keluar</span>
              </label>
            </div>
          </div>

          <div className="report-field">
            <label>Ukuran</label>
            <div className="report-radio-group">
              {SIZE_OPTIONS.map((option) => (
                <label key={option.value} className="report-radio">
                  <input
                    type="radio"
                    name="sizeFilter"
                    checked={sizeFilter === option.value}
                    onChange={() => setSizeFilter(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="report-field">
            <label>Tanggal</label>
            <div className="report-period">
              <button
                type="button"
                className="period-trigger"
                onClick={() => setIsPeriodOpen((value) => !value)}
                aria-expanded={isPeriodOpen}
              >
                <span>{selectedPeriod.label}</span>
                <ChevronDown size={18} />
              </button>
              <div className="period-calendar-icon">
                <CalendarDays size={20} />
              </div>

              {isPeriodOpen && (
                <div className="period-menu">
                  {periodOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={option.key === periodKey ? 'is-active' : ''}
                      onClick={() => handlePeriodChange(option.key)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {periodKey === 'custom' && (
            <div className="report-field">
              <label>Rentang</label>
              <div className="custom-date-range">
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(event) => setCustomRange((range) => ({ ...range, start: event.target.value }))}
                />
                <span>sampai</span>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(event) => setCustomRange((range) => ({ ...range, end: event.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="report-actions">
            <button type="button" onClick={handlePrint} disabled={isSubmitting}>
              <Printer size={20} />
              {isSubmitting ? 'Menyiapkan...' : 'Cetak Laporan'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
