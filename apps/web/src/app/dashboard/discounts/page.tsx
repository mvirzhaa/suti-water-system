'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { BadgePercent, Camera, CheckCircle, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { discountService } from '@/services/discount.service';
import { getApiErrorMessage } from '@/lib/api-error';

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
  accentColor: string;
  percentColor: string;
  textColor: string;
};

const todayInput = () => new Date().toISOString().slice(0, 10);

const addDaysInput = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const couponColors = ['#006FB2', '#00558C', '#4AB3E9', '#0CA5EA'];
const percentColors = ['#00558C', '#006FB2'];
const textColors = ['#ffffff', '#0f172a'];

const initialForm: VoucherForm = {
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
  couponColor: couponColors[3],
  accentColor: couponColors[0],
  percentColor: percentColors[1],
  textColor: textColors[0],
};

const sutiLogo = (
  <svg viewBox="0 0 100 120" aria-hidden="true">
    <path d="M50 0C50 0 10 50 10 80C10 102.091 27.9086 120 50 120C72.0914 120 90 102.091 90 80C90 50 50 0 50 0Z" fill="#0CA5EA" />
    <path d="M25 85L45 60L55 75L75 45L90 80H10L25 85Z" fill="#84CC16" />
    <text x="50" y="88" fill="white" fontSize="24" fontWeight="700" fontFamily="Arial" textAnchor="middle">Suti</text>
    <text x="50" y="103" fill="white" fontSize="9" fontWeight="500" fontFamily="Arial" textAnchor="middle">Water</text>
  </svg>
);

const bottleSet = (
  <svg viewBox="0 0 220 120" aria-hidden="true">
    <ellipse cx="110" cy="104" rx="90" ry="10" fill="rgba(0,0,0,.14)" />
    {[30, 58, 146, 176].map((x, index) => (
      <g key={x} transform={`translate(${x} ${index % 2 === 0 ? 18 : 8})`}>
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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type UploadBoxProps = {
  label: string;
  accept: string;
  preview?: string | null;
  onChange: (value: string) => void;
};

function UploadBox({ label, accept, preview, onChange }: UploadBoxProps) {
  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onChange(await readFileAsDataUrl(file));
  };

  return (
    <label className="coupon-upload">
      <input type="file" accept={accept} onChange={handleChange} />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={label} />
      ) : (
        <span>
          <Camera size={34} />
          <small>{label}</small>
        </span>
      )}
    </label>
  );
}

export default function DiscountsPage() {
  const [form, setForm] = useState<VoucherForm>(initialForm);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [promoImagePreview, setPromoImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState(false);

  const description = useMemo(() => {
    return [
      form.promoInfo,
      form.promoFooter,
      `${form.promoLabel}: ${form.promoCode}`,
    ].filter(Boolean).join(' | ');
  }, [form.promoCode, form.promoFooter, form.promoInfo, form.promoLabel]);

  const setField = <K extends keyof VoucherForm>(key: K, value: VoucherForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.promoCode.trim()) {
      Swal.fire('Data belum lengkap', 'Judul besar dan kode promo wajib diisi.', 'warning');
      return;
    }

    if (form.percent <= 0 || form.percent > 100) {
      Swal.fire('Persen diskon tidak valid', 'Persen diskon harus di antara 1 sampai 100.', 'warning');
      return;
    }

    if (new Date(form.startDate) > new Date(form.endDate)) {
      Swal.fire('Masa berlaku tidak valid', 'Tanggal mulai tidak boleh melewati tanggal selesai.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      await discountService.create({
        name: form.title,
        description,
        type: 'PERCENTAGE',
        value: Number(form.percent),
        applicableTo: 'ALL',
        minQuantity: Number(form.minQuantity) || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
      });

      setCreated(true);
      Swal.fire('Berhasil!', 'Kupon diskon berhasil dibuat.', 'success');
    } catch (error: unknown) {
      Swal.fire('Gagal!', getApiErrorMessage(error, 'Gagal membuat kupon diskon.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="coupon-page">
      <section className="coupon-builder-card">
        <div className="coupon-card-heading">
          <div className="coupon-heading-icon">
            <BadgePercent size={30} />
          </div>
          <h2>Pembuatan Kupon Diskon</h2>
        </div>

        <div className="coupon-builder-grid">
          <div className="coupon-form-stack">
            <div className="coupon-row">
              <label>Judul Besar</label>
              <input value={form.title} onChange={(event) => setField('title', event.target.value)} />
            </div>

            <div className="coupon-upload-row">
              <div className="coupon-row is-upload">
                <label>Logo</label>
                <UploadBox label="Klik atau Seret Foto (JPG, Jpeg & PNG)" accept="image/png,image/jpeg" preview={logoPreview} onChange={setLogoPreview} />
              </div>
              <div className="coupon-row is-upload">
                <label>Gambar</label>
                <UploadBox label="Klik atau Seret Foto (PNG)" accept="image/png,image/jpeg" preview={heroImagePreview} onChange={setHeroImagePreview} />
              </div>
            </div>

            <div className="coupon-row">
              <label>Informasi</label>
              <input value={form.info} onChange={(event) => setField('info', event.target.value)} />
            </div>

            <div className="coupon-row compact">
              <label>Persen Diskon</label>
              <div className="coupon-addon-input">
                <input type="number" min="1" max="100" value={form.percent} onChange={(event) => setField('percent', Number(event.target.value))} />
                <span>(%)</span>
              </div>
            </div>

            <div className="coupon-row">
              <label>Informasi Bawah</label>
              <input value={form.footer} onChange={(event) => setField('footer', event.target.value)} />
            </div>

            <div className="coupon-row palette-row">
              <label>Warna Kupon</label>
              <div className="coupon-palette">
                {couponColors.map((color) => (
                  <button key={color} type="button" aria-label={color} className={form.couponColor === color ? 'is-selected' : ''} style={{ backgroundColor: color }} onClick={() => setField('couponColor', color)} />
                ))}
              </div>
              <label>Warna Teks</label>
              <div className="coupon-palette">
                {textColors.map((color) => (
                  <button key={color} type="button" aria-label={color} className={form.textColor === color ? 'is-selected' : ''} style={{ backgroundColor: color }} onClick={() => setField('textColor', color)} />
                ))}
              </div>
            </div>

            <div className="coupon-row palette-row">
              <label>Warna (%)</label>
              <div className="coupon-palette">
                {percentColors.map((color) => (
                  <button key={color} type="button" aria-label={color} className={form.percentColor === color ? 'is-selected' : ''} style={{ backgroundColor: color }} onClick={() => setField('percentColor', color)} />
                ))}
              </div>
            </div>

            <div className="coupon-divider" />

            <div className="coupon-row">
              <label>Judul Besar</label>
              <input value={form.promoTitle} onChange={(event) => setField('promoTitle', event.target.value)} />
            </div>

            <div className="coupon-row is-upload single-upload">
              <label>Gambar</label>
              <UploadBox label="Klik atau Seret Foto (PNG)" accept="image/png,image/jpeg" preview={promoImagePreview} onChange={setPromoImagePreview} />
            </div>

            <div className="coupon-row">
              <label>Informasi</label>
              <input value={form.promoInfo} onChange={(event) => setField('promoInfo', event.target.value)} />
            </div>

            <div className="coupon-row compact">
              <label>Persen Diskon</label>
              <div className="coupon-addon-input">
                <input type="number" min="1" max="100" value={form.percent} onChange={(event) => setField('percent', Number(event.target.value))} />
                <span>(%)</span>
              </div>
            </div>

            <div className="coupon-row">
              <label>Informasi Bawah</label>
              <textarea rows={2} value={form.promoFooter} onChange={(event) => setField('promoFooter', event.target.value)} />
            </div>

            <div className="coupon-row">
              <label>Informasi Promo</label>
              <input value={form.promoLabel} onChange={(event) => setField('promoLabel', event.target.value)} />
            </div>

            <div className="coupon-row">
              <label>Kode Promo</label>
              <input value={form.promoCode} onChange={(event) => setField('promoCode', event.target.value.toUpperCase())} />
            </div>
          </div>

          <div className="coupon-preview-stack">
            <div className="coupon-hero-preview" style={{ backgroundColor: form.couponColor, color: form.textColor }}>
              <div className="coupon-curve" />
              <div className="coupon-hero-image">
                {heroImagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={heroImagePreview} alt="Gambar kupon" />
                ) : bottleSet}
              </div>
              <div className="coupon-hero-logo">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="Logo kupon" />
                ) : sutiLogo}
              </div>
              <div className="coupon-hero-content">
                <p>{form.title}</p>
                <h3>{form.info}</h3>
                <div className="coupon-percent" style={{ color: form.percentColor }}>
                  {form.percent}<span>%</span>
                </div>
                <small>{form.footer}</small>
              </div>
            </div>

            {created && (
              <div className="coupon-success">
                <CheckCircle size={40} />
                <strong>Kupon Diskon Berhasil dibuat</strong>
              </div>
            )}

            <div className="coupon-mini-preview" style={{ backgroundColor: form.couponColor, color: form.textColor }}>
              <div className="coupon-mini-main">
                <p>{form.promoTitle}</p>
                <h3>{form.promoInfo} <span style={{ color: form.percentColor }}>{form.percent}<sup>%</sup></span></h3>
                <small>{form.promoFooter}</small>
              </div>
              <div className="coupon-mini-image">
                {promoImagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={promoImagePreview} alt="Gambar promo" />
                ) : bottleSet}
              </div>
              <div className="coupon-code-strip">
                <span>{form.promoLabel}</span>
                <strong>{form.promoCode}</strong>
              </div>
            </div>

            {created && (
              <div className="coupon-success">
                <CheckCircle size={40} />
                <strong>Kupon Diskon Berhasil dibuat</strong>
              </div>
            )}

            <div className="coupon-validity">
              <div className="coupon-row compact">
                <label>Kupon untuk minimal Pembelian</label>
                <div className="coupon-addon-input wide">
                  <input type="number" min="1" value={form.minQuantity} onChange={(event) => setField('minQuantity', Number(event.target.value))} />
                  <span>Unit</span>
                </div>
              </div>
              <div className="coupon-row compact">
                <label>Masa Berlaku</label>
                <div className="coupon-date-range">
                  <input type="date" value={form.startDate} onChange={(event) => setField('startDate', event.target.value)} />
                  <span>s/d</span>
                  <input type="date" value={form.endDate} onChange={(event) => setField('endDate', event.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="coupon-submit-row">
          <button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 size={18} className="spin" />}
            {isSubmitting ? 'Menyimpan...' : 'Tambahkan Sekarang!'}
          </button>
        </div>
      </section>
    </div>
  );
}
