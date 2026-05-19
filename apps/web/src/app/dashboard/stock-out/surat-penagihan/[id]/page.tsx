'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { stockOutService } from '@/services/stock-out.service';
import { ArrowLeft, Printer } from 'lucide-react';
import Swal from 'sweetalert2';

export default function SuratPenagihanPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchData(params.id as string);
    }
  }, [params.id]);

  const fetchData = async (id: string) => {
    try {
      setLoading(true);
      const res = await stockOutService.getById(id);
      setData(res.data);
    } catch (error) {
      console.error('Error fetching stock out details', error);
      Swal.fire('Error', 'Gagal memuat data surat penagihan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat dokumen...</div>;
  }

  if (!data) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Data tidak ditemukan</div>;
  }

  const exitDate = new Date(data.exitDate);
  const formattedDate = exitDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(data.totalPrice);

  const productUnit = data.product?.unit || 'Pcs';
  const productSize = data.product?.name.replace('Suti Water', '').trim() || '-';
  const buyerName = data.agent?.name || data.buyerName || '-';
  const buyerPic = data.agent?.pic || 'Bapak/Ibu';

  return (
    <>
      <style>{`
        @media print {
          .dashboard-sidebar, .dashboard-header, .print-actions {
            display: none !important;
          }
          .dashboard-main, .dashboard-content, .dashboard-shell {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            background-color: white !important;
          }
          .surat-penagihan-container {
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
      
      <div className="print-actions" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', backgroundColor: 'white', cursor: 'pointer', fontWeight: 500 }}
        >
          <ArrowLeft size={18} /> Kembali
        </button>
        <button 
          onClick={handlePrint}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.375rem', backgroundColor: '#006FB2', color: 'white', cursor: 'pointer', fontWeight: 600 }}
        >
          <Printer size={18} /> Cetak Surat Penagihan
        </button>
      </div>

      <div className="surat-penagihan-container" style={{ 
        backgroundColor: 'white', 
        padding: '3rem 4rem', 
        borderRadius: '0.5rem', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        maxWidth: '800px',
        margin: '0 auto',
        color: '#000',
        fontFamily: '"Times New Roman", Times, serif'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #006FB2', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ marginRight: '1rem' }}>
            <img src="/images/logo-login2.png" alt="Suti Water Logo" style={{ width: '80px', height: 'auto' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center', color: '#006FB2' }}>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', letterSpacing: '2px' }}>SUTI WATER</h1>
            <h2 style={{ margin: '0.25rem 0', fontSize: '1.25rem', fontWeight: 'bold' }}>PRODUK AIR MINERAL BKSPPI</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>BADAN KERJASAMA PONDOK PESANTREN INDONESIA</p>
          </div>
          <div style={{ marginLeft: '1rem' }}>
             <img src="/images/bksppi-logo.png" alt="BKSPPI Logo" style={{ width: '60px', height: 'auto', opacity: 0.5 }} onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
        </div>
        <div style={{ backgroundColor: '#7B9FE0', color: 'white', textAlign: 'center', padding: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '2.5rem' }}>
          Kantor Operasional BKSPPI - Jl. KH. Sholeh Iskandar, KM 2, Kedung Badak Tanah Sereal, Kota Bogor - Cp. 0815-9811-998
        </div>

        {/* Details */}
        <div style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          <p style={{ margin: 0 }}>Bogor, {formattedDate}</p>
          <p style={{ margin: 0 }}>Nomor: 022/SWK/01002/{exitDate.getFullYear()}</p>
          <p style={{ margin: 0 }}>Perihal: Penagihan Biaya Pembelian Air Mineral Suti Water {productSize}</p>
        </div>

        {/* Kepada Yth */}
        <div style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          <p style={{ margin: 0 }}><strong>Kepada Yth,</strong></p>
          <p style={{ margin: 0 }}>{buyerName}</p>
          <p style={{ margin: 0 }}>Di Tempat</p>
        </div>

        {/* Body Text */}
        <div style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '1rem', textAlign: 'justify' }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>Dengan hormat,</p>
          <p style={{ margin: 0 }}>Bersama surat ini, kami ingin menginformasikan bahwa berdasarkan pesanan Bapak/Ibu {buyerPic} pada tanggal {formattedDate}, kami telah mengirimkan produk air mineral Suti Water {productSize} sebanyak {data.quantity} {productUnit} dengan rincian sebagai berikut:</p>
        </div>

        {/* Table Item */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: '1rem', textAlign: 'center' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', padding: '0.5rem' }}>Nama Barang</th>
              <th style={{ border: '1px solid #000', padding: '0.5rem' }}>Ukuran</th>
              <th style={{ border: '1px solid #000', padding: '0.5rem' }}>Kemasan</th>
              <th style={{ border: '1px solid #000', padding: '0.5rem' }}>Jumlah</th>
              <th style={{ border: '1px solid #000', padding: '0.5rem' }}>Total Harga</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '0.5rem' }}>Suti Water</td>
              <td style={{ border: '1px solid #000', padding: '0.5rem' }}>{productSize}</td>
              <td style={{ border: '1px solid #000', padding: '0.5rem' }}>{productUnit}</td>
              <td style={{ border: '1px solid #000', padding: '0.5rem' }}>{data.quantity}</td>
              <td style={{ border: '1px solid #000', padding: '0.5rem' }}>{formattedPrice}</td>
            </tr>
          </tbody>
        </table>

        {/* Payment Request */}
        <div style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'justify' }}>
          <p style={{ margin: 0 }}>Sehubungan dengan hal tersebut, kami mohon kesediaan Bapak/Ibu untuk segera melakukan pembayaran sejumlah <strong>{formattedPrice}</strong> ke rekening kami berikut ini:</p>
        </div>

        {/* Table Bank */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2.5rem', fontSize: '1rem', textAlign: 'center' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', padding: '0.5rem' }}>Nama Bank</th>
              <th style={{ border: '1px solid #000', padding: '0.5rem' }}>Nomor Rekening</th>
              <th style={{ border: '1px solid #000', padding: '0.5rem' }}>Atas Nama</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '0.5rem' }}>Bank Muamalat</td>
              <td style={{ border: '1px solid #000', padding: '0.5rem' }}>1230013314</td>
              <td style={{ border: '1px solid #000', padding: '0.5rem' }}>BADAN KERJASAMA PONDOK PESANTREN INDONESIA</td>
            </tr>
          </tbody>
        </table>

        {/* Closing Text */}
        <div style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '3rem', textAlign: 'justify' }}>
          <p style={{ margin: 0 }}>Demikian surat penagihan ini kami sampaikan. Atas perhatian dan kerjasama Bapak/Ibu, kami ucapkan terima kasih.</p>
        </div>

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '1rem' }}>
          <div style={{ width: '50%', textAlign: 'center' }}>
            <p style={{ margin: '0 0 5rem 0' }}>Hormat kami,</p>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Dr. Muh Jais, S.Sy., M.E.</p>
            <p style={{ margin: 0 }}>Ketua Distributor Utama Suti Water</p>
          </div>
        </div>

      </div>
    </>
  );
}
