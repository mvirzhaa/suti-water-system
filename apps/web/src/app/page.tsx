'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const products = [
  {
    name: 'Air Mineral Galon',
    desc: 'Pilihan hemat untuk keluarga dan instansi dengan kemasan galon standar 19 Liter.',
    image: '/images/produk-galon.png',
    icon: '/images/icon-galon.svg',
    size: '19 Liter',
  },
  {
    name: 'Air Mineral Botol',
    desc: 'Praktis dibawa kemana saja, cocok untuk acara, rapat, dan aktivitas harian.',
    image: '/images/produk-botol.png',
    icon: '/images/icon-botol.svg',
    size: '600ml / 1500ml',
  },
  {
    name: 'Air Mineral Gelas',
    desc: 'Kemasan gelas sekali minum yang pas untuk acara massal dan suguhan tamu.',
    image: '/images/produk-gelas.png',
    icon: '/images/icon-gelas.svg',
    size: '220ml / 240ml',
  },
];

const advantages = [
  {
    icon: '💧',
    title: 'Kualitas Terjaga',
    desc: 'Diproses dengan teknologi penyaringan modern untuk menghasilkan air yang jernih dan sehat.',
  },
  {
    icon: '🌿',
    title: 'Sehat & Menyegarkan',
    desc: 'Kandungan mineral yang seimbang, memberikan kesegaran optimal bagi tubuh Anda.',
  },
  {
    icon: '🏭',
    title: 'Produksi Higienis',
    desc: 'Melalui standar kontrol kualitas (Quality Control) yang ketat di setiap tahap produksi.',
  },
  {
    icon: '🤝',
    title: 'Terpercaya',
    desc: 'Produk kebanggaan Badan Kerjasama Pondok Pesantren Indonesia (BKSPPI).',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", minHeight: '100vh', background: 'linear-gradient(135deg, #0A86D3 0%, #0CA5EA 100%)', color: '#fff', overflowX: 'hidden' }}>
      {/* Animated background blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', animation: 'blob1 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', animation: 'blob2 10s ease-in-out infinite' }} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,30px) scale(1.1)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,20px) scale(1.05)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-15px)} }
        .hero-badge { animation: fadeInUp 0.6s ease both; }
        .hero-title { animation: fadeInUp 0.6s ease 0.1s both; }
        .hero-sub { animation: fadeInUp 0.6s ease 0.2s both; }
        .hero-btn { animation: fadeInUp 0.6s ease 0.3s both; }
        .hero-img { animation: fadeInUp 0.8s ease 0.4s both, float 6s ease-in-out infinite 1s; }
        .feature-card:hover { transform: translateY(-6px) !important; box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important; }
        .feature-card { transition: transform 0.3s ease, box-shadow 0.3s ease !important; }
        .product-card:hover { transform: translateY(-8px) !important; box-shadow: 0 25px 50px rgba(0,0,0,0.15) !important; }
        .product-card { transition: all 0.4s ease !important; }
        .product-card:hover img { transform: scale(1.05); }
        .product-card img { transition: transform 0.4s ease; }
        .cta-btn-white:hover { transform: scale(1.04); box-shadow: 0 12px 30px rgba(0,0,0,0.15) !important; }
        .cta-btn-white { transition: all 0.25s ease !important; }
        .cta-btn-blue:hover { transform: scale(1.04); box-shadow: 0 12px 30px rgba(0,111,178,0.3) !important; }
        .cta-btn-blue { transition: all 0.25s ease !important; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '1rem 2rem',
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.05)' : 'none',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/images/logo-login2.png" alt="Suti Water" style={{ height: '40px', objectFit: 'contain' }} />
          <span style={{ fontWeight: 700, fontSize: '1.2rem', color: scrolled ? '#0CA5EA' : '#fff', letterSpacing: '0.5px', transition: 'color 0.3s ease' }}>SUTI WATER</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a href="#produk" style={{ color: scrolled ? '#333' : '#fff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, display: 'block', transition: 'color 0.3s ease' }}>Produk Kami</a>
          <a href="#tentang" style={{ color: scrolled ? '#333' : '#fff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, display: 'block', transition: 'color 0.3s ease' }}>Tentang</a>
          <button
            className={scrolled ? "cta-btn-blue" : "cta-btn-white"}
            onClick={() => router.push('/login')}
            style={{
              background: scrolled ? 'linear-gradient(135deg, #0CA5EA, #006FB2)' : '#fff',
              color: scrolled ? 'white' : '#0CA5EA', 
              border: 'none', padding: '0.55rem 1.5rem',
              borderRadius: '2rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
              marginLeft: '1rem'
            }}
          >
            Masuk Sistem
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8rem 2rem 4rem', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div style={{ zIndex: 2 }}>
            <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '2rem', padding: '0.4rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
              <img src="/images/bksppi.png" alt="BKSPPI" style={{ height: '16px', borderRadius: '50%' }} /> Produk Resmi BKSPPI
            </div>
            
            <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.5rem', color: '#fff' }}>
              Air Mineral Sehat<br />Untuk Hidup Berkualitas
            </h1>
            
            <p className="hero-sub" style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: 'rgba(255,255,255,0.9)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '500px' }}>
              Suti Water hadir untuk memenuhi kebutuhan air minum Anda dengan kualitas terbaik yang diproses secara higienis dan terpercaya.
            </p>
            
            <div className="hero-btn" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a href="#produk"
                className="cta-btn-white"
                style={{
                  display: 'inline-block',
                  textDecoration: 'none',
                  background: '#ffffff',
                  color: '#0CA5EA', border: 'none',
                  padding: '0.85rem 2.5rem', borderRadius: '2rem',
                  fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                }}
              >
                Lihat Produk Kami
              </a>
            </div>
          </div>

          <div className="hero-img" style={{ position: 'relative', display: 'flex', justifyContent: 'center', zIndex: 1 }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120%', height: '120%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)', zIndex: -1 }}></div>
            <img src="/images/produk-galon.png" alt="Suti Water Galon" style={{ maxWidth: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))' }} />
          </div>
        </div>
      </section>

      {/* KEUNGGULAN SECTION */}
      <section id="keunggulan" style={{ position: 'relative', zIndex: 1, padding: '5rem 1.5rem', background: 'rgba(255,255,255,0.03)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '0.75rem', color: '#fff' }}>
              Kenapa Memilih Suti Water?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
              Komitmen kami memberikan air mineral dengan kualitas unggul untuk kesehatan Anda
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            {advantages.map((adv, i) => (
              <div
                key={i}
                className="feature-card"
                style={{
                  background: '#ffffff',
                  borderRadius: '1.25rem',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1.25rem', display: 'inline-block', padding: '1rem', background: '#E1F0FA', borderRadius: '50%', color: '#0CA5EA' }}>
                  {adv.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.75rem', color: '#1e293b' }}>{adv.title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUK SECTION */}
      <section id="produk" style={{ position: 'relative', zIndex: 1, padding: '6rem 1.5rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
              Varian <span style={{ color: '#0CA5EA' }}>Produk</span> Kami
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
              Hadir dalam berbagai kemasan untuk memenuhi setiap kebutuhan aktivitas Anda
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
            {products.map((prod, i) => (
              <div
                key={i}
                className="product-card"
                style={{
                  background: '#ffffff',
                  borderRadius: '1.5rem',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ padding: '3rem 2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '280px', background: '#E6F3FF' }}>
                  <img src={prod.image} alt={prod.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <img src={prod.icon} alt="Icon" style={{ width: '28px', height: '28px' }} />
                    <h3 style={{ fontWeight: 700, fontSize: '1.3rem', color: '#006FB2' }}>{prod.name}</h3>
                  </div>
                  <div style={{ display: 'inline-block', background: '#E1F0FA', color: '#006FB2', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Ukuran {prod.size}
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>{prod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TENTANG SECTION */}
      <section id="tentang" style={{ position: 'relative', zIndex: 1, padding: '4rem 1.5rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '2rem',
            padding: '4rem 2.5rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #0A86D3, #0CA5EA)' }}></div>
            <img src="/images/bksppi.png" alt="BKSPPI Logo" style={{ height: '70px', marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Mengenal SUTI WATER</h2>
            <p style={{ color: '#475569', lineHeight: 1.8, fontSize: '1.05rem', maxWidth: '750px', margin: '0 auto 2.5rem' }}>
              SUTI WATER adalah produk air mineral kebanggaan <strong>BKSPPI (Badan Kerjasama Pondok Pesantren Indonesia)</strong>. 
              Berkomitmen untuk menghadirkan air minum yang sehat, berkualitas tinggi, dan diproses dengan teknologi modern yang higienis untuk masyarakat luas.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', color: '#64748b', fontSize: '0.95rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📍</span> Jl. KH. Sholeh Iskandar, KM 2, Kedung Badak, Kota Bogor
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📞</span> 0815-9811-998
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid #e2e8f0', padding: '3rem 1.5rem 2rem', textAlign: 'center', background: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <img src="/images/logo-login2.png" alt="Suti Water" style={{ height: '45px' }} />
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Untuk Tim Internal? <a href="/login" style={{ color: '#0CA5EA', textDecoration: 'none', fontWeight: 600 }}>Masuk ke Sistem Manajemen →</a>
          </p>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} SUTI WATER — BKSPPI. Semua hak dilindungi.
          </div>
        </div>
      </footer>
    </div>
  );
}
