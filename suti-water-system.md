# 💧 SUTI WATER SYSTEM — Web Platform
## System Design & Development Document

> **Versi:** 1.0.0 | **Status:** Planning Phase | **Tanggal:** Mei 2026  
> **Tim:** Senior Developer · Project Manager · System Analyst

---

## 📋 Daftar Isi

1. [Project Overview](#1-project-overview)
2. [Design System & UI/UX](#2-design-system--uiux)
3. [Arsitektur Sistem](#3-arsitektur-sistem)
4. [Tech Stack](#4-tech-stack)
5. [Role & Permission Matrix](#5-role--permission-matrix)
6. [Modul & Fitur Detail](#6-modul--fitur-detail)
7. [Desain Database](#7-desain-database)
8. [API Design](#8-api-design)
9. [Keamanan Sistem](#9-keamanan-sistem)
10. [Struktur Project](#10-struktur-project)
11. [Deployment & DevOps](#11-deployment--devops)
12. [Development Roadmap](#12-development-roadmap)
13. [Testing Strategy](#13-testing-strategy)
14. [Checklist Pre-Launch](#14-checklist-pre-launch)

---

## 1. Project Overview

### 1.1 Deskripsi

**Suti Water System** adalah platform web manajemen distribusi air minum yang mengelola seluruh operasional bisnis secara digital: pencatatan barang masuk/keluar, manajemen stok, laporan keuangan, diskon, hingga manajemen pengguna. Sistem ini dirancang untuk menggantikan pencatatan manual dan meningkatkan efisiensi operasional.

### 1.2 Tujuan Sistem

| Tujuan | Keterangan |
|--------|-----------|
| **Digitalisasi Operasional** | Mengganti pencatatan manual ke sistem digital yang terintegrasi |
| **Transparansi Data** | Pimpinan dapat memonitor stok dan laporan secara real-time |
| **Akuntabilitas** | Setiap transaksi tercatat beserta pelaku dan waktunya |
| **Efisiensi** | Proses barang masuk/keluar lebih cepat dengan upload nota digital |
| **Keamanan Data** | Data terlindungi dengan sistem autentikasi dan otorisasi berlapis |

### 1.3 Scope Sistem

#### ✅ In Scope
- Web application (desktop & mobile responsive)
- Manajemen barang masuk & keluar beserta upload nota
- Dashboard monitoring stok dan aktivitas
- Sistem laporan dengan export PDF & Excel
- Manajemen diskon
- User management dengan 3 level role
- Login dengan email/password dan Google OAuth
- Audit trail semua aktivitas

#### ❌ Out of Scope (v1.0)
- Aplikasi mobile native (Android/iOS)
- Integrasi dengan software akuntansi pihak ketiga
- Fitur e-commerce / penjualan online
- POS (Point of Sale) system

### 1.4 Stakeholder

| Stakeholder | Role | Kepentingan |
|-------------|------|-------------|
| Pemilik / Pimpinan Suti | Pimpinan | Monitor bisnis, lihat laporan |
| Karyawan | Staff | Input transaksi harian |
| Developer / IT | Super Admin | Kelola sistem, user, setting |

---

## 2. Design System & UI/UX

### 2.1 Design Philosophy

Berdasarkan Figma **UI Aplikasi Suti Water System**, desain menggunakan pendekatan:

- **Clean & Professional** — Tampilan bersih, mudah digunakan oleh non-technical user
- **Sidebar Navigation** — Menu utama di sidebar kiri, konten di area utama kanan
- **Card-Based Layout** — Informasi disajikan dalam card component yang terstruktur
- **Mobile-First Responsive** — Layout adaptif dari mobile (375px) hingga desktop (1440px)

### 2.2 Color Palette

```
Primary Brand Color
┌─────────────────────────────────────────────────────────┐
│  Biru Utama    #1E3A5F  ████  → Header, Sidebar, CTA    │
│  Biru Muda     #2B6CB0  ████  → Hover, Active state     │
│  Biru Accent   #3182CE  ████  → Link, Icon aktif        │
│  Biru Pale     #EBF8FF  ████  → Background card info    │
└─────────────────────────────────────────────────────────┘

Secondary & Semantic Colors
┌─────────────────────────────────────────────────────────┐
│  Putih         #FFFFFF  ████  → Background utama        │
│  Abu Terang    #F7FAFC  ████  → Background page         │
│  Abu Border    #E2E8F0  ████  → Border, divider         │
│  Abu Teks      #718096  ████  → Placeholder, label      │
│  Teks Utama    #1A202C  ████  → Heading, body text      │
│  Teks Sekunder #4A5568  ████  → Subtitle, caption       │
└─────────────────────────────────────────────────────────┘

Status Colors
┌─────────────────────────────────────────────────────────┐
│  Hijau Sukses  #38A169  ████  → Success, stok aman      │
│  Hijau Muda    #F0FFF4  ████  → Background success      │
│  Kuning Warn   #D69E2E  ████  → Warning, stok menipis   │
│  Kuning Muda   #FFFFF0  ████  → Background warning      │
│  Merah Error   #E53E3E  ████  → Error, hapus, bahaya    │
│  Merah Muda    #FFF5F5  ████  → Background error        │
│  Ungu Info     #6B46C1  ████  → Badge info, diskon      │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Typography

```
Font Family: "Plus Jakarta Sans" (Google Fonts)
Fallback   : 'Segoe UI', system-ui, -apple-system, sans-serif

Heading Sizes:
  H1  →  28px / 700 / line-height: 1.3  (Judul halaman)
  H2  →  22px / 600 / line-height: 1.4  (Section title)
  H3  →  18px / 600 / line-height: 1.4  (Card title)
  H4  →  15px / 600 / line-height: 1.5  (Sub-section)

Body Sizes:
  Body LG   →  16px / 400 / line-height: 1.7
  Body Base →  14px / 400 / line-height: 1.7  (Default)
  Body SM   →  13px / 400 / line-height: 1.6
  Caption   →  12px / 400 / line-height: 1.5
  Label     →  11px / 600 / line-height: 1.4  (UPPERCASE, tracking: 0.5px)
```

### 2.4 Component Design Tokens

```css
/* Spacing Scale */
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-5: 20px;  --space-6: 24px;
--space-8: 32px;  --space-10: 40px; --space-12: 48px;

/* Border Radius */
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;

/* Shadow */
--shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
--shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.05);

/* Transition */
--transition: all 0.2s ease;
```

### 2.5 Layout Struktur

```
┌────────────────────────────────────────────────────────────────────┐
│                        TOP NAVBAR (64px)                           │
│  [☰] SUTI WATER SYSTEM          [🔔] [👤 Nama User ▾]             │
├──────────────────┬─────────────────────────────────────────────────┤
│                  │                                                  │
│   SIDEBAR        │              MAIN CONTENT AREA                  │
│   (260px)        │                                                  │
│                  │  ┌─────────────────────────────────────────┐    │
│  📊 Dashboard    │  │  Page Title                Breadcrumb   │    │
│  ─────────────   │  └─────────────────────────────────────────┘    │
│  📦 Produk       │                                                  │
│  📥 Brg Masuk    │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  📤 Brg Keluar   │  │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │          │
│  🏷️  Diskon      │  │ Card │ │ Card │ │ Card │ │ Card │          │
│  ─────────────   │  └──────┘ └──────┘ └──────┘ └──────┘          │
│  📈 Laporan *    │                                                  │
│  ─────────────   │  ┌───────────────────┐ ┌──────────────────┐    │
│  👥 Pengguna **  │  │                   │ │                  │    │
│  ⚙️  Pengaturan **│  │   Chart / Table   │ │  Recent Activity │    │
│                  │  │                   │ │                  │    │
│  ─────────────   │  └───────────────────┘ └──────────────────┘    │
│  v1.0.0          │                                                  │
└──────────────────┴─────────────────────────────────────────────────┘

*  Laporan     → Hanya Super Admin & Pimpinan
** Pengguna    → Hanya Super Admin
** Pengaturan  → Hanya Super Admin
```

### 2.6 Sidebar Behavior

```
State: Expanded (Desktop ≥ 1024px)
├── Logo + Nama Aplikasi di atas
├── Avatar + Nama User + Badge Role
├── Menu items dengan ikon + label
├── Active state: background #EBF8FF, teks #1E3A5F, border-left 3px solid #3182CE
└── Hover state: background #F7FAFC

State: Collapsed (Tablet 768px–1023px)
└── Hanya icon, tooltip saat hover

State: Drawer (Mobile < 768px)
└── Overlay sidebar, toggle via hamburger button

Menu yang disembunyikan berdasarkan role:
├── Staff      → Laporan, Pengguna, Pengaturan (disembunyikan)
├── Pimpinan   → Pengguna, Pengaturan (disembunyikan)
└── Super Admin → Semua menu visible
```

### 2.7 Halaman-Halaman Utama

#### Login & Register Page

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│         ≋≋≋≋≋≋≋≋≋≋≋≋≋  (Water wave illustration)       │
│                                                          │
│    ┌────────────────────────────────────────────┐        │
│    │           💧 SUTI WATER SYSTEM             │        │
│    │                                            │        │
│    │   Email                                    │        │
│    │   ┌──────────────────────────────────┐     │        │
│    │   │ email@example.com                │     │        │
│    │   └──────────────────────────────────┘     │        │
│    │                                            │        │
│    │   Password                                 │        │
│    │   ┌──────────────────────────────────┐     │        │
│    │   │ ••••••••••          [👁]          │     │        │
│    │   └──────────────────────────────────┘     │        │
│    │                                            │        │
│    │   [ Lupa password? ]                       │        │
│    │                                            │        │
│    │   ┌──────────────────────────────────┐     │        │
│    │   │          Masuk                   │     │        │  ← Primary CTA: #1E3A5F
│    │   └──────────────────────────────────┘     │        │
│    │                                            │        │
│    │   ──────────── atau ────────────           │        │
│    │                                            │        │
│    │   ┌──────────────────────────────────┐     │        │
│    │   │  🔵  Masuk dengan Google         │     │        │  ← Google OAuth button
│    │   └──────────────────────────────────┘     │        │
│    │                                            │        │
│    │   Belum punya akun? [Daftar]               │        │
│    └────────────────────────────────────────────┘        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### Dashboard Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                              Senin, 11 Mei 2026      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────┐ │
│  │ 📦 Total     │ │ 📥 Masuk     │ │ 📤 Keluar    │ │ ⚠️ Stok│ │
│  │ Produk       │ │ Hari Ini     │ │ Hari Ini     │ │ Menipis│ │
│  │              │ │              │ │              │ │        │ │
│  │    24        │ │    +128      │ │    -84       │ │    3   │ │
│  │ jenis produk │ │ galon        │ │ galon        │ │ produk │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────┘ │
│                                                                 │
│  ┌───────────────────────────────┐ ┌───────────────────────┐   │
│  │  📈 Grafik Barang 7 Hari     │ │  🕐 Aktivitas Terbaru │   │
│  │                              │ │                       │   │
│  │   ▁▃▅▇▅▃▆  (bar chart)      │ │  • Budi input 50 gal  │   │
│  │                              │ │    2 menit lalu       │   │
│  │   — masuk   -- keluar       │ │  • Siti keluar 20 gal │   │
│  │                              │ │    15 menit lalu      │   │
│  │                              │ │  • Diskon Lebaran ON  │   │
│  └───────────────────────────────┘ │    1 jam lalu        │   │
│                                    └───────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### Barang Masuk Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Barang Masuk                                [+ Tambah Masuk]   │
│  Daftar penerimaan barang                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [🔍 Cari...] [Produk ▾] [Tgl Mulai 📅] [Tgl Akhir 📅] [Reset]│
│                                                                 │
│  ┌──────┬──────────────┬──────┬──────────┬──────┬──────┬──────┐ │
│  │ No   │ Produk       │ Qty  │ Tgl Masuk│Harga │ Nota │ Aksi │ │
│  ├──────┼──────────────┼──────┼──────────┼──────┼──────┼──────┤ │
│  │  1   │ Galon 19L    │  50  │01/05/2026│5.000 │[📄] │ [⋮] │ │
│  │  2   │ Air 600ml    │ 120  │01/05/2026│1.500 │[📄] │ [⋮] │ │
│  │  3   │ Air 1500ml   │  80  │02/05/2026│3.000 │  -   │ [⋮] │ │
│  └──────┴──────────────┴──────┴──────────┴──────┴──────┴──────┘ │
│                                                                 │
│  Showing 1-10 of 48  [← Prev]  1  2  3  4  5  [Next →]        │
└─────────────────────────────────────────────────────────────────┘

Modal: Tambah Barang Masuk
┌─────────────────────────────────────────┐
│  Tambah Barang Masuk               [×]  │
├─────────────────────────────────────────┤
│                                         │
│  Produk *                               │
│  ┌──────────────────────────────┐       │
│  │ Pilih produk...          [▾] │       │
│  └──────────────────────────────┘       │
│                                         │
│  Jumlah *          Harga Beli/unit      │
│  ┌────────────┐    ┌───────────────┐    │
│  │ 0          │    │ Rp 0          │    │
│  └────────────┘    └───────────────┘    │
│                                         │
│  Supplier / Sumber                      │
│  ┌──────────────────────────────┐       │
│  │ Nama supplier...             │       │
│  └──────────────────────────────┘       │
│                                         │
│  Tanggal Masuk *                        │
│  ┌──────────────────────────────┐       │
│  │ 11/05/2026            [📅]   │       │
│  └──────────────────────────────┘       │
│                                         │
│  Upload Nota (PDF/JPG/PNG, max 5MB)     │
│  ┌──────────────────────────────┐       │
│  │  📎 Klik untuk upload atau   │       │
│  │     drag & drop file         │       │
│  └──────────────────────────────┘       │
│                                         │
│  Catatan                                │
│  ┌──────────────────────────────┐       │
│  │                              │       │
│  └──────────────────────────────┘       │
│                                         │
│       [Batal]    [Simpan Barang Masuk]  │
└─────────────────────────────────────────┘
```

#### Diskon Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Manajemen Diskon                            [+ Buat Diskon]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🏷️  Diskon Lebaran 2026                [AKTIF ●]       │   │
│  │  Potongan 15% untuk semua produk                        │   │
│  │  Berlaku: 01 Apr 2026 — 30 Apr 2026                     │   │
│  │  Digunakan: 48 kali                   [Edit] [Nonaktif] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🏷️  Diskon Pelanggan Setia            [AKTIF ●]       │   │
│  │  Potongan Rp 2.000 per galon                            │   │
│  │  Berlaku: 01 Jan 2026 — 31 Dec 2026                     │   │
│  │  Digunakan: 120 kali                  [Edit] [Nonaktif] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🏷️  Diskon Grosir                     [NONAKTIF ○]    │   │
│  │  Potongan 10% untuk pembelian ≥ 50 galon                │   │
│  │  Berlaku: 01 Mar 2026 — 31 Mar 2026                     │   │
│  │  Digunakan: 22 kali                   [Edit] [Aktifkan] │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Arsitektur Sistem

### 3.1 Architecture Overview

```
                         ┌─────────────────────────────────────────┐
                         │           CLIENT LAYER                  │
                         │   Browser  ·  Mobile Browser  ·  PWA   │
                         └───────────────────┬─────────────────────┘
                                             │ HTTPS
                         ┌───────────────────▼─────────────────────┐
                         │        CDN + WAF (Cloudflare)           │
                         │   DDoS Protection · Static Assets       │
                         └──────────┬──────────────────┬───────────┘
                                    │                  │
                    ┌───────────────▼──┐    ┌──────────▼──────────┐
                    │  Auth Gateway    │    │   Static Files CDN  │
                    │  Google OAuth    │    │   (Images, JS, CSS) │
                    │  JWT Validation  │    └─────────────────────┘
                    └───────────┬──────┘
                                │
                ┌───────────────▼───────────────────────────────┐
                │            BACKEND API SERVER                 │
                │            Node.js + Express.js               │
                │                                               │
                │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
                │  │  Auth  │ │Product │ │ Stock  │ │Report  │ │
                │  │Module  │ │Module  │ │Module  │ │Module  │ │
                │  └────────┘ └────────┘ └────────┘ └────────┘ │
                │  ┌────────┐ ┌────────┐ ┌────────┐            │
                │  │Discount│ │ Upload │ │  User  │            │
                │  │Module  │ │Module  │ │Module  │            │
                │  └────────┘ └────────┘ └────────┘            │
                └───────────┬──────────────────┬────────────────┘
                            │                  │
                ┌───────────▼──────┐    ┌──────▼───────────────┐
                │  PRIMARY DB      │    │   CACHE + SESSION     │
                │  PostgreSQL 16   │    │   Redis 7             │
                │                  │    │                       │
                │  - All tables    │    │  - JWT blacklist      │
                │  - Migrations    │    │  - Rate limit counter │
                │  - Backups       │    │  - Session store      │
                └──────────────────┘    └──────────────────────┘
                
                ┌─────────────────────────────────────────────┐
                │           FILE STORAGE                      │
                │   Cloudinary (Images) · AWS S3 (Documents) │
                │   Nota PDF · Foto Produk · Avatar User      │
                └─────────────────────────────────────────────┘
```

### 3.2 Request Flow

```
User Action (e.g., Input Barang Masuk)
        │
        ▼
[1] Next.js Frontend
    React Hook Form validasi client-side
        │
        ▼
[2] Axios POST /api/stock-in (+ FormData nota file)
        │
        ▼
[3] Cloudflare WAF
    - Block suspicious requests
    - Rate limit check
        │
        ▼
[4] Nginx Reverse Proxy
    - Route to Node.js
    - SSL termination
        │
        ▼
[5] Express.js Server
    ├── Middleware: verifyJWT()
    ├── Middleware: checkRole(['STAFF','PIMPINAN','SUPER_ADMIN'])
    ├── Middleware: validateRequest(stockInSchema)
    └── Middleware: uploadFile(multer)
        │
        ▼
[6] StockIn Controller
    └── Calls StockIn Service
        │
        ▼
[7] StockIn Service
    ├── Upload nota ke Cloudinary/S3
    ├── BEGIN TRANSACTION
    │   ├── INSERT INTO stock_in (...)
    │   ├── UPDATE products SET stock = stock + qty
    │   └── INSERT INTO audit_logs (...)
    └── COMMIT TRANSACTION
        │
        ▼
[8] Response JSON
    { success: true, data: {...}, message: "..." }
        │
        ▼
[9] Frontend React Query
    Invalidate cache → refresh tabel & dashboard
```

---

## 4. Tech Stack

### 4.1 Frontend

| Kategori | Teknologi | Versi | Alasan |
|----------|-----------|-------|--------|
| Framework | **Next.js** | 14.x | SSR/SSG, App Router, built-in optimization |
| Language | **TypeScript** | 5.x | Type safety, better DX, catch error awal |
| Styling | **Tailwind CSS** | 3.x | Utility-first, responsive mudah, konsisten |
| UI Components | **shadcn/ui** | latest | Accessible, customizable, tidak opinionated |
| Icons | **Lucide React** | latest | Clean, consistent icon set |
| State Management | **Zustand** | 4.x | Ringan, simple, no boilerplate |
| Data Fetching | **TanStack Query** | 5.x | Caching, background refetch, optimistic update |
| HTTP Client | **Axios** | 1.x | Interceptors, request cancellation |
| Form | **React Hook Form** | 7.x | Performance (uncontrolled), easy validation |
| Validation | **Zod** | 3.x | Schema validation, type inference |
| Charts | **Recharts** | 2.x | React-native, responsive charts |
| Date | **date-fns** | 3.x | Lightweight, tree-shakeable |
| Table | **TanStack Table** | 8.x | Virtual scrolling, sorting, filtering |
| Notifications | **Sonner** | latest | Clean toast notifications |

### 4.2 Backend

| Kategori | Teknologi | Versi | Alasan |
|----------|-----------|-------|--------|
| Runtime | **Node.js** | 20 LTS | Mature, v8 perf, large ecosystem |
| Framework | **Express.js** | 4.x | Minimal, flexible, well-documented |
| Language | **TypeScript** | 5.x | Konsistensi dengan frontend |
| ORM | **Prisma** | 5.x | Type-safe queries, auto-migrations, Prisma Studio |
| Database | **PostgreSQL** | 16.x | ACID, relational, JSON support |
| Cache | **Redis** | 7.x | Session, rate limit, cache |
| Auth | **Passport.js** | 0.7.x | Google OAuth strategy |
| JWT | **jsonwebtoken** | 9.x | Access + Refresh token |
| Password | **bcryptjs** | 2.x | Password hashing |
| File Upload | **Multer** | 1.x | Multipart form handling |
| Cloud Storage | **Cloudinary SDK** | 2.x | Image/PDF storage & transformation |
| Validation | **Zod** | 3.x | Share schema dengan frontend (monorepo) |
| API Docs | **Swagger (swagger-ui-express)** | latest | Auto-generated docs |
| Email | **Nodemailer** | 6.x | Forgot password, notifikasi |
| Logging | **Winston** | 3.x | Structured logging, multiple transports |
| Error Monitor | **Sentry** | 7.x | Production error tracking |

### 4.3 DevOps & Infrastructure

| Kategori | Teknologi | Alasan |
|----------|-----------|--------|
| Containerization | **Docker + Docker Compose** | Dev/staging/prod consistency |
| Reverse Proxy | **Nginx** | SSL termination, load balancing |
| CI/CD | **GitHub Actions** | Auto test & deploy on push |
| Frontend Hosting | **Vercel** | Zero-config Next.js deployment |
| Backend Hosting | **Railway / Render / VPS** | Auto-deploy, managed SSL |
| CDN + WAF | **Cloudflare** | DDoS protection, edge caching |
| Object Storage | **AWS S3 / Cloudinary** | Nota & file storage |
| SSL | **Let's Encrypt + Certbot** | Auto-renew certificate |
| Monitoring | **Sentry + Winston** | Error & log monitoring |
| Backup | **pg_dump → S3** | Automated daily backup |

### 4.4 Development Tools

| Tool | Kegunaan |
|------|---------|
| **Turborepo** | Monorepo management (shared types & utils) |
| **ESLint + Prettier** | Code style consistency |
| **Husky + lint-staged** | Pre-commit hooks |
| **Jest + Testing Library** | Unit & integration tests |
| **Playwright** | End-to-end testing |
| **Prisma Studio** | Database GUI development |
| **Bruno / Insomnia** | API testing |

---

## 5. Role & Permission Matrix

### 5.1 Definisi Role

#### 👑 Super Admin
- Akun spesial, dibuat saat initial system setup
- Jumlah: **maksimal 1 akun** (bisa ditambah by design)
- Full access ke seluruh sistem termasuk user management dan audit log
- Tidak bisa dihapus oleh siapapun

#### 🎯 Pimpinan  
- Akun dibuat oleh Super Admin
- Bisa melihat seluruh laporan dan statistik bisnis
- Bisa membuat dan mengelola diskon
- Bisa melihat semua transaksi staff
- **Tidak bisa** kelola user atau setting sistem

#### 👷 Staff
- Akun dibuat oleh Super Admin
- Input transaksi harian (barang masuk & keluar)
- **Tidak bisa akses** menu Laporan, Pengguna, dan Pengaturan
- Hanya bisa melihat data yang ia input sendiri (configurable)

### 5.2 Permission Matrix Lengkap

| Module | Fitur | Super Admin | Pimpinan | Staff |
|--------|-------|:-----------:|:--------:|:-----:|
| **Auth** | Login email/password | ✅ | ✅ | ✅ |
| | Login Google OAuth | ✅ | ✅ | ✅ |
| | Ubah password sendiri | ✅ | ✅ | ✅ |
| | Forgot password | ✅ | ✅ | ✅ |
| **Dashboard** | Lihat dashboard | ✅ | ✅ | ✅ (terbatas) |
| | Lihat grafik & statistik | ✅ | ✅ | ❌ |
| | Alert stok menipis | ✅ | ✅ | ✅ |
| **Produk** | Lihat daftar produk | ✅ | ✅ | ✅ |
| | Tambah produk baru | ✅ | ✅ | ❌ |
| | Edit produk | ✅ | ✅ | ❌ |
| | Hapus produk | ✅ | ❌ | ❌ |
| | Upload foto produk | ✅ | ✅ | ❌ |
| | Kelola kategori produk | ✅ | ✅ | ❌ |
| **Barang Masuk** | Lihat semua data | ✅ | ✅ | ✅ (milik sendiri) |
| | Input barang masuk | ✅ | ✅ | ✅ |
| | Upload nota masuk | ✅ | ✅ | ✅ |
| | Preview nota | ✅ | ✅ | ✅ |
| | Edit data masuk | ✅ | ✅ | ✅ (24 jam) |
| | Hapus data masuk | ✅ | ❌ | ❌ |
| **Barang Keluar** | Lihat semua data | ✅ | ✅ | ✅ (milik sendiri) |
| | Input barang keluar | ✅ | ✅ | ✅ |
| | Upload nota keluar | ✅ | ✅ | ✅ |
| | Apply diskon | ✅ | ✅ | ✅ |
| | Hapus data keluar | ✅ | ❌ | ❌ |
| **Laporan** | Laporan barang masuk | ✅ | ✅ | 🚫 BLOCKED |
| | Laporan barang keluar | ✅ | ✅ | 🚫 BLOCKED |
| | Laporan stok current | ✅ | ✅ | 🚫 BLOCKED |
| | Laporan keuangan | ✅ | ✅ | 🚫 BLOCKED |
| | Export PDF | ✅ | ✅ | 🚫 BLOCKED |
| | Export Excel (.xlsx) | ✅ | ✅ | 🚫 BLOCKED |
| | Filter by periode | ✅ | ✅ | 🚫 BLOCKED |
| **Diskon** | Lihat daftar diskon | ✅ | ✅ | ✅ (read only) |
| | Buat diskon baru | ✅ | ✅ | ❌ |
| | Edit diskon | ✅ | ✅ | ❌ |
| | Aktif/nonaktifkan | ✅ | ✅ | ❌ |
| | Hapus diskon | ✅ | ❌ | ❌ |
| **User Management** | Lihat daftar user | ✅ | ❌ | ❌ |
| | Tambah user baru | ✅ | ❌ | ❌ |
| | Edit user | ✅ | ❌ | ❌ |
| | Assign/ubah role | ✅ | ❌ | ❌ |
| | Suspend/aktifkan akun | ✅ | ❌ | ❌ |
| | Reset password user | ✅ | ❌ | ❌ |
| **Audit Log** | Lihat audit log | ✅ | ❌ | ❌ |
| | Filter log | ✅ | ❌ | ❌ |
| | Export log | ✅ | ❌ | ❌ |
| **Pengaturan** | Pengaturan sistem | ✅ | ❌ | ❌ |
| | Konfigurasi alert stok | ✅ | ❌ | ❌ |
| | Backup database manual | ✅ | ❌ | ❌ |

> **⚠️ Catatan Implementasi:** Seluruh permission di atas **harus di-enforce di backend middleware**, bukan hanya di-hide di frontend. Staff yang mencoba mengakses endpoint `/api/reports/*` langsung melalui API harus mendapatkan response `403 Forbidden`.

---

## 6. Modul & Fitur Detail

### 6.1 Modul Autentikasi

**Flow Login Email/Password:**
```
User input email + password
    → Frontend validasi format (Zod)
    → POST /api/auth/login
    → Backend: cari user by email
    → bcrypt.compare(password, hash)
    → Generate Access Token (15 menit, JWT)
    → Generate Refresh Token (7 hari, JWT)
    → Access Token → response body
    → Refresh Token → HttpOnly Cookie (SameSite=Strict)
    → Frontend simpan Access Token di memory (Zustand)
    → Redirect ke dashboard
```

**Flow Login Google OAuth:**
```
User klik "Masuk dengan Google"
    → Redirect ke /api/auth/google
    → Passport.js Google Strategy
    → Google consent screen
    → Callback /api/auth/google/callback
    → Cek apakah email sudah terdaftar
        ├── Sudah ada → update google_id, generate JWT
        └── Belum ada → buat user baru (role default: STAFF), generate JWT
    → Redirect ke /dashboard dengan token
```

**Flow Refresh Token:**
```
Access Token expire
    → TanStack Query detects 401 error
    → Axios interceptor: POST /api/auth/refresh
    → Server baca Refresh Token dari Cookie
    → Validasi Refresh Token
    → Generate Access Token baru
    → Retry original request
    → (Jika Refresh Token juga expire → force logout)
```

### 6.2 Modul Barang Masuk

**Fields:**
| Field | Type | Required | Keterangan |
|-------|------|----------|-----------|
| `product_id` | UUID | ✅ | Foreign key ke tabel products |
| `quantity` | Integer | ✅ | Min: 1, Max: 99999 |
| `price_per_unit` | Decimal | ✅ | Harga beli per unit |
| `supplier` | String | ❌ | Nama supplier/sumber |
| `entry_date` | Date | ✅ | Tanggal masuk (bukan timestamp) |
| `nota_file` | File | ❌ | PDF/JPG/PNG, max 5MB |
| `notes` | Text | ❌ | Catatan tambahan |

**Validasi:**
- `quantity` harus integer positif
- `price_per_unit` harus angka positif
- `entry_date` tidak boleh lebih dari hari ini
- File nota: MIME type harus `application/pdf`, `image/jpeg`, atau `image/png`
- File nota: Ukuran maksimal 5MB

**Business Logic:**
```
1. Validasi semua field
2. Upload nota ke Cloudinary (jika ada file)
3. BEGIN TRANSACTION
4.   INSERT INTO stock_in(...)
5.   UPDATE products SET stock = stock + quantity WHERE id = product_id
6.   INSERT INTO audit_logs(user_id, action='STOCK_IN_CREATE', entity='stock_in', entity_id=...)
7. COMMIT
8. Return response dengan data lengkap
```

### 6.3 Modul Barang Keluar

**Fields:**
| Field | Type | Required | Keterangan |
|-------|------|----------|-----------|
| `product_id` | UUID | ✅ | Foreign key ke tabel products |
| `quantity` | Integer | ✅ | Tidak boleh melebihi stok tersedia |
| `price_per_unit` | Decimal | ✅ | Harga jual per unit |
| `discount_id` | UUID | ❌ | Foreign key ke tabel discounts |
| `buyer_name` | String | ❌ | Nama pembeli/tujuan |
| `exit_date` | Date | ✅ | Tanggal keluar |
| `nota_file` | File | ❌ | PDF/JPG/PNG, max 5MB |
| `notes` | Text | ❌ | Catatan tambahan |

**Business Logic:**
```
1. Validasi semua field
2. Cek stok: jika quantity > product.stock → ERROR "Stok tidak mencukupi"
3. Kalkulasi diskon (jika ada):
   - Tipe PERCENTAGE: discount_amount = price_per_unit * qty * (discount.value / 100)
   - Tipe NOMINAL   : discount_amount = discount.value * qty
   - total_price = (price_per_unit * qty) - discount_amount
4. Upload nota ke Cloudinary (jika ada file)
5. BEGIN TRANSACTION
6.   INSERT INTO stock_out(...)
7.   UPDATE products SET stock = stock - quantity WHERE id = product_id
8.   INSERT INTO audit_logs(...)
9. COMMIT
```

### 6.4 Modul Diskon

**Tipe Diskon:**
- `PERCENTAGE` — Potongan dalam persen (e.g., 15%)
- `NOMINAL` — Potongan dalam rupiah (e.g., Rp 2.000/unit)

**Scope Diskon:**
- `ALL` — Berlaku untuk semua produk
- `PRODUCT` — Berlaku untuk produk tertentu saja (via tabel `discount_products`)

**Fields:**
| Field | Keterangan |
|-------|-----------|
| `name` | Nama diskon (e.g., "Diskon Lebaran") |
| `type` | PERCENTAGE atau NOMINAL |
| `value` | Nilai diskon |
| `start_date` | Tanggal mulai berlaku |
| `end_date` | Tanggal berakhir (nullable = tidak ada batas) |
| `is_active` | Toggle aktif/nonaktif manual |
| `applicable_to` | ALL atau PRODUCT |
| `min_quantity` | Minimum qty untuk berlaku (optional) |

### 6.5 Modul Laporan

**Jenis Laporan:**

| Laporan | Filter Tersedia | Export |
|---------|----------------|--------|
| Barang Masuk | Tanggal, Produk, Supplier, Staff | PDF, Excel |
| Barang Keluar | Tanggal, Produk, Pembeli, Staff | PDF, Excel |
| Stok Saat Ini | Kategori, Status stok | PDF, Excel |
| Ringkasan Keuangan | Tanggal, Produk | PDF, Excel |

**Ringkasan Keuangan:**
```
Total Pemasukan = SUM(stock_out.total_price) per periode
Total Modal     = SUM(stock_in.price_per_unit * stock_in.quantity) per periode
Estimasi Laba   = Total Pemasukan - Total Modal
```

> **Catatan:** Ini adalah estimasi laba kotor sederhana. Untuk laporan keuangan akurat, perlu modul akuntansi terpisah.

---

## 7. Desain Database

### 7.1 Entity Relationship

```
users
  │
  ├──(created_by)──► stock_in
  │                      └──(product_id)──► products
  │                                              └──(category_id)──► categories
  │
  ├──(created_by)──► stock_out
  │                      ├──(product_id)──► products
  │                      └──(discount_id)──► discounts
  │                                              └──(created_by)──► users
  │
  ├──(created_by)──► discounts
  │
  └──(user_id)────► audit_logs
  
discounts
  └──(discount_id)──► discount_products
                          └──(product_id)──► products
```

### 7.2 Schema Lengkap

#### Table: `users`
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password      VARCHAR(255),              -- NULL jika login via Google saja
  google_id     VARCHAR(100) UNIQUE,       -- NULL jika tidak pakai Google
  role          ROLE_ENUM NOT NULL DEFAULT 'STAFF',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  avatar_url    TEXT,
  phone         VARCHAR(20),
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMP WITH TIME ZONE,  -- Soft delete
  
  CONSTRAINT check_auth_method CHECK (
    password IS NOT NULL OR google_id IS NOT NULL
  )
);

CREATE TYPE ROLE_ENUM AS ENUM ('SUPER_ADMIN', 'PIMPINAN', 'STAFF');

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role  ON users(role)  WHERE deleted_at IS NULL;
```

#### Table: `categories`
```sql
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL UNIQUE,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  icon       VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

#### Table: `products`
```sql
CREATE TABLE products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(150) NOT NULL,
  sku          VARCHAR(50) UNIQUE,
  category_id  UUID REFERENCES categories(id),
  unit         VARCHAR(30) NOT NULL DEFAULT 'pcs',  -- galon, botol, kardus, dll
  price_buy    DECIMAL(12,2) NOT NULL DEFAULT 0,   -- Harga beli modal
  price_sell   DECIMAL(12,2) NOT NULL DEFAULT 0,   -- Harga jual default
  stock        INTEGER NOT NULL DEFAULT 0,
  min_stock    INTEGER NOT NULL DEFAULT 5,         -- Threshold alert stok menipis
  image_url    TEXT,
  description  TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMP WITH TIME ZONE,           -- Soft delete

  CONSTRAINT check_stock_non_negative CHECK (stock >= 0),
  CONSTRAINT check_price_positive CHECK (price_buy >= 0 AND price_sell >= 0)
);

-- Indexes
CREATE INDEX idx_products_category  ON products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_sku       ON products(sku)         WHERE deleted_at IS NULL;
CREATE INDEX idx_products_low_stock ON products(stock)       WHERE stock <= min_stock AND deleted_at IS NULL;
```

#### Table: `stock_in`
```sql
CREATE TABLE stock_in (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES products(id),
  user_id        UUID NOT NULL REFERENCES users(id),   -- Staff yang input
  quantity       INTEGER NOT NULL,
  price_per_unit DECIMAL(12,2) NOT NULL,
  total_cost     DECIMAL(14,2) GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
  supplier       VARCHAR(150),
  entry_date     DATE NOT NULL,
  nota_url       TEXT,                                 -- URL file di Cloudinary/S3
  nota_filename  VARCHAR(255),                        -- Original filename
  nota_size      INTEGER,                             -- File size in bytes
  notes          TEXT,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT check_quantity_positive CHECK (quantity > 0),
  CONSTRAINT check_price_positive CHECK (price_per_unit >= 0)
);

-- Indexes
CREATE INDEX idx_stock_in_product    ON stock_in(product_id);
CREATE INDEX idx_stock_in_user       ON stock_in(user_id);
CREATE INDEX idx_stock_in_entry_date ON stock_in(entry_date DESC);
CREATE INDEX idx_stock_in_date_range ON stock_in(entry_date, product_id);
```

#### Table: `stock_out`
```sql
CREATE TABLE stock_out (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  discount_id     UUID REFERENCES discounts(id),    -- NULL jika tidak pakai diskon
  quantity        INTEGER NOT NULL,
  price_per_unit  DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_price     DECIMAL(14,2) NOT NULL,           -- Final price setelah diskon
  buyer_name      VARCHAR(150),
  exit_date       DATE NOT NULL,
  nota_url        TEXT,
  nota_filename   VARCHAR(255),
  nota_size       INTEGER,
  notes           TEXT,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT check_quantity_positive     CHECK (quantity > 0),
  CONSTRAINT check_discount_non_negative CHECK (discount_amount >= 0),
  CONSTRAINT check_total_non_negative    CHECK (total_price >= 0)
);

-- Indexes
CREATE INDEX idx_stock_out_product   ON stock_out(product_id);
CREATE INDEX idx_stock_out_user      ON stock_out(user_id);
CREATE INDEX idx_stock_out_exit_date ON stock_out(exit_date DESC);
CREATE INDEX idx_stock_out_date_prod ON stock_out(exit_date, product_id);
```

#### Table: `discounts`
```sql
CREATE TABLE discounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  type            DISCOUNT_TYPE_ENUM NOT NULL,
  value           DECIMAL(10,2) NOT NULL,
  applicable_to   DISCOUNT_SCOPE_ENUM NOT NULL DEFAULT 'ALL',
  min_quantity    INTEGER,                           -- Minimum qty untuk berlaku
  start_date      DATE NOT NULL,
  end_date        DATE,                              -- NULL = tidak ada batas akhir
  is_active       BOOLEAN NOT NULL DEFAULT true,
  usage_count     INTEGER NOT NULL DEFAULT 0,
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMP WITH TIME ZONE,

  CONSTRAINT check_value_positive     CHECK (value > 0),
  CONSTRAINT check_percentage_max     CHECK (type != 'PERCENTAGE' OR value <= 100),
  CONSTRAINT check_date_range         CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TYPE DISCOUNT_TYPE_ENUM  AS ENUM ('PERCENTAGE', 'NOMINAL');
CREATE TYPE DISCOUNT_SCOPE_ENUM AS ENUM ('ALL', 'PRODUCT');
```

#### Table: `discount_products`
```sql
-- Pivot table untuk diskon yang hanya berlaku di produk tertentu
CREATE TABLE discount_products (
  discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
  PRIMARY KEY (discount_id, product_id)
);
```

#### Table: `refresh_tokens`
```sql
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,          -- SHA-256 of the token
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked    BOOLEAN NOT NULL DEFAULT false,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user    ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
```

#### Table: `audit_logs`
```sql
CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(100) NOT NULL,   -- e.g., 'STOCK_IN_CREATE', 'USER_ROLE_CHANGE'
  entity     VARCHAR(50) NOT NULL,    -- e.g., 'stock_in', 'users', 'discounts'
  entity_id  UUID,
  old_value  JSONB,                   -- State sebelum perubahan
  new_value  JSONB,                   -- State setelah perubahan
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata   JSONB,                   -- Data tambahan
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Immutable: tidak ada UPDATE atau DELETE permission di production
-- Indexes untuk filtering
CREATE INDEX idx_audit_logs_user       ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action     ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity     ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### 7.3 Prisma Schema (ORM)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  SUPER_ADMIN
  PIMPINAN
  STAFF
}

enum DiscountType {
  PERCENTAGE
  NOMINAL
}

enum DiscountScope {
  ALL
  PRODUCT
}

model User {
  id          String    @id @default(uuid())
  name        String
  email       String    @unique
  password    String?
  googleId    String?   @unique @map("google_id")
  role        Role      @default(STAFF)
  isActive    Boolean   @default(true) @map("is_active")
  avatarUrl   String?   @map("avatar_url")
  phone       String?
  lastLoginAt DateTime? @map("last_login_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  stockIns       StockIn[]
  stockOuts      StockOut[]
  discountsCreated Discount[]
  refreshTokens  RefreshToken[]
  auditLogs      AuditLog[]

  @@map("users")
}

model Product {
  id          String    @id @default(uuid())
  name        String
  sku         String?   @unique
  categoryId  String?   @map("category_id")
  unit        String    @default("pcs")
  priceBuy    Decimal   @default(0) @db.Decimal(12, 2) @map("price_buy")
  priceSell   Decimal   @default(0) @db.Decimal(12, 2) @map("price_sell")
  stock       Int       @default(0)
  minStock    Int       @default(5) @map("min_stock")
  imageUrl    String?   @map("image_url")
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  category          Category? @relation(fields: [categoryId], references: [id])
  stockIns          StockIn[]
  stockOuts         StockOut[]
  discountProducts  DiscountProduct[]

  @@map("products")
}
```

### 7.4 Migration Strategy

```bash
# Development
npx prisma migrate dev --name init_users
npx prisma migrate dev --name add_products
npx prisma migrate dev --name add_stock_tables
npx prisma migrate dev --name add_discounts
npx prisma migrate dev --name add_audit_logs

# Production (zero-downtime)
npx prisma migrate deploy

# Rollback (manual via SQL script)
# Selalu buat reverse migration script setiap kali migrasi kompleks
```

---

## 8. API Design

### 8.1 Base URL & Versioning

```
Development : http://localhost:5000/api/v1
Staging     : https://api-staging.sutiwater.com/api/v1
Production  : https://api.sutiwater.com/api/v1
```

### 8.2 Standard Response Format

```typescript
// Success Response
interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error Response
interface ErrorResponse {
  success: false;
  message: string;
  code?: string;        // e.g., "INSUFFICIENT_STOCK", "INVALID_TOKEN"
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

### 8.3 HTTP Status Codes

| Code | Penggunaan |
|------|-----------|
| `200 OK` | GET berhasil, PUT/PATCH berhasil |
| `201 Created` | POST berhasil, resource dibuat |
| `204 No Content` | DELETE berhasil |
| `400 Bad Request` | Validasi gagal, input tidak valid |
| `401 Unauthorized` | Token tidak ada atau expired |
| `403 Forbidden` | Token valid tapi tidak punya permission |
| `404 Not Found` | Resource tidak ditemukan |
| `409 Conflict` | Duplicate data (e.g., email sudah ada) |
| `422 Unprocessable Entity` | Business logic error (e.g., stok tidak cukup) |
| `429 Too Many Requests` | Rate limit terlampaui |
| `500 Internal Server Error` | Unexpected server error |

### 8.4 Endpoint Lengkap

#### Authentication

```
POST   /api/v1/auth/register          Daftar akun baru
POST   /api/v1/auth/login             Login email/password
POST   /api/v1/auth/logout            Logout + revoke refresh token
POST   /api/v1/auth/refresh           Refresh access token
GET    /api/v1/auth/google            Redirect ke Google OAuth
GET    /api/v1/auth/google/callback   Google OAuth callback
POST   /api/v1/auth/forgot-password   Request reset password
POST   /api/v1/auth/reset-password    Reset password dengan token
GET    /api/v1/auth/me                Get profil user yang login
PATCH  /api/v1/auth/me                Update profil sendiri
PATCH  /api/v1/auth/change-password   Ubah password sendiri
```

#### Products

```
GET    /api/v1/products               List produk (+ filter, sort, paginate)
POST   /api/v1/products               Buat produk baru
GET    /api/v1/products/:id           Detail produk
PUT    /api/v1/products/:id           Update produk
DELETE /api/v1/products/:id           Soft delete produk
GET    /api/v1/products/low-stock     Produk dengan stok menipis
GET    /api/v1/categories             List kategori produk
POST   /api/v1/categories             Buat kategori baru
```

#### Stock In (Barang Masuk)

```
GET    /api/v1/stock-in               List barang masuk (+ filter tanggal, produk)
POST   /api/v1/stock-in               Input barang masuk (+ nota upload)
GET    /api/v1/stock-in/:id           Detail barang masuk
PUT    /api/v1/stock-in/:id           Edit barang masuk (batas waktu 24 jam)
DELETE /api/v1/stock-in/:id           Hapus (Super Admin only)
GET    /api/v1/stock-in/:id/nota      Download/preview nota
```

#### Stock Out (Barang Keluar)

```
GET    /api/v1/stock-out              List barang keluar (+ filter)
POST   /api/v1/stock-out              Input barang keluar (+ nota upload)
GET    /api/v1/stock-out/:id          Detail barang keluar
PUT    /api/v1/stock-out/:id          Edit (batas waktu 24 jam)
DELETE /api/v1/stock-out/:id          Hapus (Super Admin only)
GET    /api/v1/stock-out/:id/nota     Download/preview nota
```

#### Discounts

```
GET    /api/v1/discounts              List diskon (+ filter status, tanggal)
POST   /api/v1/discounts              Buat diskon baru
GET    /api/v1/discounts/:id          Detail diskon
PUT    /api/v1/discounts/:id          Edit diskon
DELETE /api/v1/discounts/:id          Soft delete (Super Admin)
PATCH  /api/v1/discounts/:id/toggle   Toggle aktif/nonaktif
GET    /api/v1/discounts/active       List diskon yang aktif saat ini
```

#### Reports (Super Admin & Pimpinan only)

```
GET    /api/v1/reports/stock-in       Laporan barang masuk
GET    /api/v1/reports/stock-out      Laporan barang keluar
GET    /api/v1/reports/stock-current  Laporan stok saat ini
GET    /api/v1/reports/financial      Laporan keuangan ringkasan
GET    /api/v1/reports/export         Export laporan (query: type=pdf|excel, report=stock-in|...)
GET    /api/v1/dashboard/summary      Data ringkasan untuk dashboard
GET    /api/v1/dashboard/chart        Data grafik 7/30 hari
```

#### Users (Super Admin only)

```
GET    /api/v1/users                  List semua user
POST   /api/v1/users                  Buat user baru
GET    /api/v1/users/:id              Detail user
PUT    /api/v1/users/:id              Edit user
DELETE /api/v1/users/:id              Soft delete user
PATCH  /api/v1/users/:id/toggle       Suspend/aktifkan akun
PATCH  /api/v1/users/:id/role         Ubah role user
POST   /api/v1/users/:id/reset-pass   Reset password user
GET    /api/v1/audit-logs             Audit log (+ filter)
```

### 8.5 Query Parameters Convention

```
Pagination:
  ?page=1&limit=10

Sorting:
  ?sortBy=created_at&sortOrder=desc

Filtering:
  ?product_id=uuid
  ?from=2026-01-01&to=2026-05-31
  ?status=active
  ?search=galon

Combined:
  GET /api/v1/stock-in?page=1&limit=10&from=2026-05-01&to=2026-05-31&product_id=xxx&sortBy=entry_date&sortOrder=desc
```

---

## 9. Keamanan Sistem

### 9.1 Authentication & Session

```
┌─────────────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                               │
│                                                                 │
│  Layer 1: Transport Security                                    │
│  ├── HTTPS only (force redirect dari HTTP)                      │
│  ├── TLS 1.2+ minimum                                           │
│  └── HSTS header: max-age=31536000; includeSubDomains          │
│                                                                 │
│  Layer 2: Authentication                                        │
│  ├── Access Token: JWT, expire 15 menit, secret ≥ 256 bit      │
│  ├── Refresh Token: JWT, expire 7 hari, stored HttpOnly Cookie  │
│  ├── Password: bcrypt, cost factor 12                           │
│  └── Google OAuth: state parameter untuk CSRF prevention        │
│                                                                 │
│  Layer 3: Authorization                                         │
│  ├── RBAC middleware di setiap protected route                  │
│  ├── Resource ownership check (Staff hanya bisa edit miliknya)  │
│  └── Token blacklist di Redis (untuk logout semua device)       │
│                                                                 │
│  Layer 4: Input Security                                        │
│  ├── Zod schema validation di setiap endpoint                   │
│  ├── SQL injection prevention via Prisma parameterized queries   │
│  ├── XSS prevention via input sanitization (DOMPurify)          │
│  └── File upload: MIME type check + size limit + virus scan     │
│                                                                 │
│  Layer 5: Rate Limiting                                         │
│  ├── Global: 100 req/menit per IP                               │
│  ├── Login: 5 percobaan per 15 menit per IP                     │
│  ├── Upload: 10 file per menit per user                         │
│  └── Register: 3 akun per jam per IP                            │
│                                                                 │
│  Layer 6: HTTP Security Headers (Helmet.js)                     │
│  ├── Content-Security-Policy                                    │
│  ├── X-Frame-Options: DENY                                      │
│  ├── X-Content-Type-Options: nosniff                            │
│  └── Referrer-Policy: same-origin                               │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Environment Variables

```bash
# .env.production (JANGAN pernah commit ke Git!)

# Database
DATABASE_URL="postgresql://user:password@host:5432/suti_water_db?sslmode=require"
REDIS_URL="redis://:password@host:6379"

# JWT
JWT_ACCESS_SECRET="minimum-256-bit-random-string-here"
JWT_REFRESH_SECRET="different-minimum-256-bit-random-string"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="https://api.sutiwater.com/api/v1/auth/google/callback"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# App
NODE_ENV="production"
PORT=5000
FRONTEND_URL="https://sutiwater.com"
CORS_ORIGINS="https://sutiwater.com,https://www.sutiwater.com"

# Email (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="noreply@sutiwater.com"
SMTP_PASS="app-password-here"

# Sentry
SENTRY_DSN="https://xxx@sentry.io/xxx"
```

### 9.3 File Upload Security

```typescript
// Validasi file upload yang aman
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png',
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Middleware validasi
const validateFileUpload = (file: Express.Multer.File) => {
  // 1. Cek MIME type dari magic bytes (bukan hanya ekstensi)
  const detectedMime = fileTypeFromBuffer(file.buffer);
  if (!ALLOWED_MIME_TYPES.includes(detectedMime.mime)) {
    throw new Error('Tipe file tidak diizinkan');
  }
  
  // 2. Cek ukuran
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Ukuran file melebihi 5MB');
  }
  
  // 3. Sanitasi nama file
  const safeFilename = `${uuid()}-${Date.now()}${path.extname(file.originalname).toLowerCase()}`;
  
  return { ...file, filename: safeFilename };
};
```

---

## 10. Struktur Project

### 10.1 Monorepo Structure (Turborepo)

```
suti-water-system/
├── apps/
│   ├── web/                         ← Next.js Frontend
│   │   ├── src/
│   │   │   ├── app/                 ← App Router pages
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/
│   │   │   │   │   └── register/
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── layout.tsx   ← Sidebar + Navbar
│   │   │   │   │   ├── page.tsx     ← Dashboard
│   │   │   │   │   ├── products/
│   │   │   │   │   ├── stock-in/
│   │   │   │   │   ├── stock-out/
│   │   │   │   │   ├── discounts/
│   │   │   │   │   ├── reports/
│   │   │   │   │   ├── users/
│   │   │   │   │   └── settings/
│   │   │   │   └── api/             ← Next.js API routes (proxy)
│   │   │   ├── components/
│   │   │   │   ├── ui/              ← shadcn/ui components
│   │   │   │   ├── layout/          ← Sidebar, Navbar, Footer
│   │   │   │   ├── features/        ← Feature-specific components
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── products/
│   │   │   │   │   ├── stock/
│   │   │   │   │   ├── discounts/
│   │   │   │   │   └── reports/
│   │   │   │   └── shared/          ← Reusable: Table, Modal, Upload, etc.
│   │   │   ├── hooks/               ← Custom React hooks
│   │   │   ├── stores/              ← Zustand stores
│   │   │   ├── services/            ← API call functions
│   │   │   ├── lib/                 ← Utils, constants
│   │   │   └── types/               ← TypeScript types (import dari packages/types)
│   │   ├── public/
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   └── api/                         ← Express.js Backend
│       ├── src/
│       │   ├── config/
│       │   │   ├── database.ts      ← Prisma client
│       │   │   ├── redis.ts
│       │   │   ├── cloudinary.ts
│       │   │   └── passport.ts      ← Google OAuth config
│       │   ├── middlewares/
│       │   │   ├── auth.middleware.ts         ← verifyJWT
│       │   │   ├── role.middleware.ts         ← checkRole
│       │   │   ├── validate.middleware.ts     ← Zod validation
│       │   │   ├── upload.middleware.ts       ← Multer + file validation
│       │   │   ├── audit.middleware.ts        ← Auto audit log
│       │   │   ├── rateLimit.middleware.ts    ← Rate limiting
│       │   │   └── error.middleware.ts        ← Global error handler
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── auth.routes.ts
│       │   │   │   └── auth.schema.ts        ← Zod schemas
│       │   │   ├── users/
│       │   │   │   ├── users.controller.ts
│       │   │   │   ├── users.service.ts
│       │   │   │   ├── users.repository.ts   ← DB queries
│       │   │   │   ├── users.routes.ts
│       │   │   │   └── users.schema.ts
│       │   │   ├── products/
│       │   │   ├── stock-in/
│       │   │   ├── stock-out/
│       │   │   ├── discounts/
│       │   │   ├── reports/
│       │   │   └── audit-logs/
│       │   ├── utils/
│       │   │   ├── ApiError.ts
│       │   │   ├── ApiResponse.ts
│       │   │   ├── generateToken.ts
│       │   │   ├── sendEmail.ts
│       │   │   └── logger.ts
│       │   ├── prisma/
│       │   │   ├── schema.prisma
│       │   │   └── migrations/
│       │   └── app.ts
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── types/                       ← Shared TypeScript types
│   │   ├── src/
│   │   │   ├── user.types.ts
│   │   │   ├── product.types.ts
│   │   │   ├── stock.types.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── validators/                  ← Shared Zod schemas (frontend + backend)
│       ├── src/
│       │   ├── auth.validator.ts
│       │   ├── product.validator.ts
│       │   ├── stock.validator.ts
│       │   └── discount.validator.ts
│       └── package.json
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── turbo.json
├── .github/
│   └── workflows/
│       ├── ci.yml                   ← Test + lint on PR
│       └── deploy.yml               ← Deploy on merge to main
└── README.md
```

---

## 11. Deployment & DevOps

### 11.1 Docker Configuration

```yaml
# docker-compose.yml (Development)
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: suti_water_dev
      POSTGRES_USER: suti_user
      POSTGRES_PASSWORD: suti_password_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass suti_redis_dev
    ports:
      - "6379:6379"

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile.dev
    environment:
      - DATABASE_URL=postgresql://suti_user:suti_password_dev@postgres:5432/suti_water_dev
      - REDIS_URL=redis://:suti_redis_dev@redis:6379
    volumes:
      - ./apps/api/src:/app/src
    ports:
      - "5000:5000"
    depends_on:
      - postgres
      - redis

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile.dev
    volumes:
      - ./apps/web/src:/app/src
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
    depends_on:
      - api

volumes:
  postgres_data:
```

### 11.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/action@v3
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up --service suti-api
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 11.3 Nginx Configuration

```nginx
# /etc/nginx/sites-available/sutiwater.com
server {
    listen 80;
    server_name api.sutiwater.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.sutiwater.com;

    ssl_certificate     /etc/letsencrypt/live/api.sutiwater.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.sutiwater.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # Rate limit
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req zone=api burst=20 nodelay;

    # File upload size
    client_max_body_size 10M;

    location / {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 11.4 Backup Strategy

```bash
#!/bin/bash
# backup.sh — Jalankan via cron: 0 2 * * * (setiap hari jam 02.00)

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="suti_water_backup_${DATE}.sql.gz"
S3_BUCKET="s3://suti-water-backups"

# Dump database
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  --no-password \
  | gzip > /tmp/$BACKUP_FILE

# Upload ke S3
aws s3 cp /tmp/$BACKUP_FILE ${S3_BUCKET}/daily/

# Hapus file lokal
rm /tmp/$BACKUP_FILE

# Hapus backup > 30 hari
aws s3 ls ${S3_BUCKET}/daily/ \
  | awk '{print $4}' \
  | while read KEY; do
    CREATED=$(echo $KEY | grep -oP '\d{8}')
    CUTOFF=$(date -d "-30 days" +%Y%m%d)
    if [[ $CREATED < $CUTOFF ]]; then
      aws s3 rm "${S3_BUCKET}/daily/${KEY}"
    fi
  done

echo "Backup selesai: $BACKUP_FILE"
```

---

## 12. Development Roadmap

### 12.1 Timeline Overview

```
Minggu:  1    2    3    4    5    6    7    8    9   10   11   12
         │────│────│────│────│────│────│────│────│────│────│────│
FASE 1   ████████████
Foundation    

FASE 2             ██████████████████
Core Modules            

FASE 3                               █████████████
Reports & Admin         

FASE 4                                            █████████████
QA & Launch                 
                                                              🚀
```

### 12.2 Detail Per Fase

#### 📘 Fase 1 — Foundation (Minggu 1–3)

**Goal:** Project bisa berjalan, auth berfungsi, user bisa login.

| Minggu | Task | PIC | Estimasi |
|--------|------|-----|---------|
| 1 | Setup monorepo Turborepo, ESLint, Prettier, Husky | Dev | 2 hari |
| 1 | Setup Docker Compose (PostgreSQL + Redis) | Dev | 1 hari |
| 1 | Prisma schema initial + migrations (users, sessions) | Dev | 1 hari |
| 1 | GitHub Actions CI pipeline | Dev | 1 hari |
| 2 | Backend: Auth module (register, login, JWT) | Dev | 3 hari |
| 2 | Backend: Google OAuth 2.0 (Passport.js) | Dev | 2 hari |
| 3 | Frontend: Auth pages (login, register) | Dev | 2 hari |
| 3 | Frontend: Sidebar layout + role-based menu | Dev | 2 hari |
| 3 | Frontend: Google OAuth button + flow | Dev | 1 hari |

**Definition of Done Fase 1:**
- ✅ User bisa register + login dengan email/password
- ✅ User bisa login dengan Google
- ✅ Sidebar menampilkan menu sesuai role
- ✅ Protected routes bekerja (redirect ke login jika belum auth)
- ✅ CI pipeline berjalan di setiap push

#### 📗 Fase 2 — Core Business Modules (Minggu 4–7)

**Goal:** Modul utama bisnis berfungsi end-to-end.

| Minggu | Task | Estimasi |
|--------|------|---------|
| 4 | Prisma schema: products, categories, stock_in, stock_out | 1 hari |
| 4 | Backend: Products CRUD + categories | 3 hari |
| 4 | Frontend: Products page (list, form, delete) | 2 hari |
| 5 | Backend: Stock In module + file upload (Multer + Cloudinary) | 3 hari |
| 5 | Frontend: Stock In page (list, form modal, nota preview) | 3 hari |
| 6 | Backend: Stock Out module + diskon kalkulasi | 3 hari |
| 6 | Frontend: Stock Out page (list, form modal) | 3 hari |
| 7 | Backend: Discounts CRUD | 2 hari |
| 7 | Frontend: Discounts page | 2 hari |
| 7 | Backend + Frontend: Dashboard summary + chart | 2 hari |

**Definition of Done Fase 2:**
- ✅ Barang masuk & keluar bisa di-input lengkap dengan upload nota
- ✅ Stok produk terupdate otomatis setelah transaksi
- ✅ Diskon bisa dibuat dan di-apply saat barang keluar
- ✅ Dashboard menampilkan data real

#### 📙 Fase 3 — Reports, Admin & Security (Minggu 8–10)

**Goal:** Laporan lengkap, user management, dan keamanan production-grade.

| Task | Estimasi |
|------|---------|
| Backend: Reports module (4 jenis laporan) | 3 hari |
| Backend: Export PDF (pdfkit) + Excel (ExcelJS) | 3 hari |
| Frontend: Reports page + filter + preview | 3 hari |
| Backend: User management CRUD | 2 hari |
| Frontend: User management page | 2 hari |
| Backend: Audit logs + viewer | 2 hari |
| Security hardening (rate limit, helmet, CORS, validation) | 2 hari |
| Sentry + Winston logging setup | 1 hari |

#### 📕 Fase 4 — QA, Optimization & Launch (Minggu 11–12)

| Task | Estimasi |
|------|---------|
| User Acceptance Testing dengan klien Suti | 3 hari |
| Bug fixing berdasarkan feedback UAT | 3 hari |
| Performance optimization (DB query, image) | 2 hari |
| Security audit + basic penetration test | 1 hari |
| Setup production server + domain + SSL | 1 hari |
| Konfigurasi backup otomatis | 1 hari |
| Dokumentasi API (Swagger) | 1 hari |
| **🚀 LAUNCH!** | — |

---

## 13. Testing Strategy

### 13.1 Testing Pyramid

```
                    ┌───────────┐
                    │    E2E    │  ← 10% (Playwright)
                   /│  Testing  │\    Critical user flows
                  / └───────────┘ \
                 /                  \
                /  ┌─────────────┐   \
               /   │ Integration │    \
              /    │   Testing   │     \  ← 30% (Jest + Supertest)
             /     └─────────────┘      \    API endpoint tests
            /                            \
           /      ┌─────────────────┐     \
          /       │   Unit Testing  │      \  ← 60% (Jest + Vitest)
         /        │  (utils, hooks, │       \   Business logic
        /         │   services)     │        \
       /          └─────────────────┘         \
      /____________________________________________\
```

### 13.2 Critical Test Cases

| Test Case | Type | Priority |
|-----------|------|---------|
| Login berhasil dengan email/password valid | E2E | 🔴 Critical |
| Login gagal dengan password salah | Unit | 🔴 Critical |
| Google OAuth flow lengkap | E2E | 🔴 Critical |
| Staff tidak bisa akses endpoint laporan | Integration | 🔴 Critical |
| Stok berkurang setelah barang keluar | Integration | 🔴 Critical |
| Stok bertambah setelah barang masuk | Integration | 🔴 Critical |
| Tidak bisa input keluar jika stok < qty | Unit | 🔴 Critical |
| Kalkulasi diskon PERCENTAGE benar | Unit | 🟡 High |
| Kalkulasi diskon NOMINAL benar | Unit | 🟡 High |
| Upload nota invalid MIME type ditolak | Integration | 🟡 High |
| Upload nota > 5MB ditolak | Integration | 🟡 High |
| Rate limit bekerja setelah 5 login gagal | Integration | 🟡 High |
| Export PDF laporan generate dengan benar | E2E | 🟡 High |
| Dashboard data summary akurat | Integration | 🟢 Medium |

---

## 14. Checklist Pre-Launch

### 🔐 Security Checklist

- [ ] JWT disimpan di memory (Zustand), bukan localStorage
- [ ] Refresh Token di HttpOnly Cookie dengan SameSite=Strict
- [ ] Semua password di-hash dengan bcrypt cost factor ≥ 12
- [ ] Rate limiting aktif di endpoint login dan register
- [ ] Helmet.js headers aktif (CSP, X-Frame-Options, dll)
- [ ] CORS hanya allow production domain
- [ ] Semua input divalidasi dengan Zod
- [ ] File upload: MIME type detection dari magic bytes
- [ ] HTTPS aktif dan HSTS header terpasang
- [ ] Environment variables tidak ter-commit ke Git (.gitignore)
- [ ] SQL injection test: semua query melalui Prisma parameterized
- [ ] Staff tidak bisa akses endpoint /api/reports/* (test manual)
- [ ] Sentry error monitoring aktif dan alert terkonfigurasi

### 🗄️ Database Checklist

- [ ] Semua migration sudah di-run di production
- [ ] Index sudah dibuat untuk kolom yang sering di-query
- [ ] Backup otomatis berjalan dan tested (restore drill)
- [ ] Connection pooling terkonfigurasi
- [ ] Database tidak bisa diakses dari internet langsung

### 🚀 Performance Checklist

- [ ] Lighthouse score ≥ 80 (Performance, Accessibility, Best Practices)
- [ ] First Contentful Paint < 2 detik
- [ ] API response time < 500ms untuk 95th percentile
- [ ] Images dioptimasi (Next.js Image component)
- [ ] Pagination implemented (tidak load semua data sekaligus)
- [ ] N+1 query tidak ada (gunakan Prisma include)

### ✅ Functional Checklist

- [ ] Login/Register email + Google OAuth tested di production domain
- [ ] Semua 3 role ditest (Super Admin, Pimpinan, Staff)
- [ ] Upload nota (PDF + JPG + PNG) berfungsi
- [ ] Preview nota berfungsi
- [ ] Export PDF laporan menghasilkan file yang benar
- [ ] Export Excel laporan menghasilkan file yang benar
- [ ] Alert stok menipis muncul
- [ ] Responsive di mobile (375px), tablet (768px), desktop (1440px)
- [ ] Browser compatibility: Chrome, Firefox, Safari, Edge

### 📋 Documentation Checklist

- [ ] API documentation (Swagger) tersedia di /api/docs
- [ ] README.md dengan instruksi setup development
- [ ] Environment variables template (.env.example)
- [ ] Deployment guide untuk tim IT Suti
- [ ] User manual untuk Pimpinan dan Staff

---

## Appendix

### A. Estimasi Resource

| Resource | Spesifikasi | Estimasi Biaya/bulan |
|----------|-------------|----------------------|
| VPS Backend | 2 vCPU, 2GB RAM, 20GB SSD | Rp 100–200rb |
| Database Managed | PostgreSQL di Railway/Render | Free tier → ~$5 |
| Frontend | Vercel Hobby | Free / ~$20 |
| File Storage | Cloudinary Free | 25GB free |
| Domain | .com domain | ~Rp 150rb/tahun |
| SSL | Let's Encrypt | Gratis |
| **Total Estimasi** | | **~Rp 200–400rb/bulan** |

### B. Skalabilitas Ke Depan

Jika bisnis Suti berkembang, arsitektur ini mudah di-scale:

1. **Horizontal Scaling:** Tambah instance backend di belakang load balancer
2. **Database Scaling:** Read replicas PostgreSQL untuk laporan berat
3. **Caching Layer:** Tambah caching di endpoint laporan dengan Redis
4. **Microservices:** Pisah modul laporan menjadi service terpisah
5. **Message Queue:** Tambah Bull Queue untuk proses ekspor yang berat
6. **CDN:** Pindahkan static assets ke CDN untuk performa lebih baik

### C. Konvensi Kode

```typescript
// Penamaan variabel: camelCase
const stockInData = await getStockIn(id);

// Penamaan fungsi: camelCase, verb prefix
async function createStockIn(data: CreateStockInDto) { ... }
async function getProductById(id: string) { ... }
async function updateProductStock(id: string, qty: number) { ... }

// Penamaan interface/type: PascalCase
interface StockInResponse { ... }
type CreateStockInDto = { ... }

// Penamaan konstanta: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_ROLES = ['SUPER_ADMIN', 'PIMPINAN'] as const;

// Error handling: selalu gunakan custom ApiError
throw new ApiError(422, 'Stok tidak mencukupi', 'INSUFFICIENT_STOCK');

// Response: selalu gunakan ApiResponse helper
return ApiResponse.success(res, data, 'Barang masuk berhasil disimpan', 201);
```

---

*Dokumen ini dibuat sebagai referensi teknis komprehensif untuk tim development Suti Water System. Harap diperbarui setiap kali ada perubahan arsitektur atau keputusan teknis yang signifikan.*

**Last updated:** Mei 2026 | **Maintained by:** Tim Developer
EOF