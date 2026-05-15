# Dokumentasi Suti Water System

**Versi:** 1.0.0 — Development  
**Tanggal update:** 15 Mei 2026  
**Status:** Aktif dikembangkan — fondasi stabil, siap uji fungsional

---

## Apa Itu Suti Water System?

Suti Water System adalah aplikasi web internal untuk manajemen distribusi air minum kemasan (galon dan kardus). Sistem ini menggantikan pencatatan manual dengan platform digital yang mencakup pencatatan stok masuk/keluar, manajemen master data, laporan, dan kupon diskon.

Sistem digunakan oleh tiga jenis pengguna:

| Role          | Siapa                   | Bisa Apa                                       |
| ------------- | ----------------------- | ---------------------------------------------- |
| `SUPER_ADMIN` | IT / pengelola sistem   | Akses penuh termasuk kelola pengguna           |
| `PIMPINAN`    | Pemilik / manajer       | Lihat semua data, buat laporan, kelola diskon  |
| `STAFF`       | Karyawan gudang / kasir | Input transaksi harian (barang masuk & keluar) |

---

## Cara Kerja Sistem

### Gambaran Besar

```
Browser (Next.js)
    │
    │  HTTPS + Bearer Token
    ▼
Express API  ──►  PostgreSQL (data utama)
    │         ──►  Redis (rate limit, session)
    │         ──►  Cloudinary (foto nota, avatar)
    ▼
Prisma ORM (query builder + migration)
```

Semua komunikasi antara frontend dan backend melalui REST API dengan base URL `/api/v1`. Frontend menyimpan access token di memori (Zustand), sedangkan refresh token disimpan di HttpOnly cookie sehingga tidak bisa diakses JavaScript.

---

### Alur Login

```
1. User isi email + password di halaman /login
2. Frontend kirim POST /api/v1/auth/login
3. Backend verifikasi password dengan bcrypt
4. Jika valid:
   - Generate Access Token (JWT, berlaku 15 menit)
   - Generate Refresh Token (JWT, berlaku 7 hari, disimpan di DB)
   - Access Token dikirim di response body
   - Refresh Token dikirim via HttpOnly cookie
5. Frontend simpan Access Token di Zustand store
6. Redirect ke /dashboard
```

Jika access token kedaluwarsa, Axios interceptor otomatis memanggil `POST /api/v1/auth/refresh` menggunakan cookie. Jika refresh token juga kedaluwarsa, user di-logout paksa dan diarahkan ke halaman login.

Login Google OAuth juga tersedia — user diarahkan ke `/api/v1/auth/google`, setelah consent Google akan di-redirect kembali ke dashboard dengan token.

---

### Alur Barang Masuk

```
1. Staff klik "Tambah Data Barang Masuk"
2. Isi form: pilih produk, pilih pemasok, tanggal, kuantitas, harga per unit
3. (Opsional) upload foto nota
4. Submit → POST /api/v1/stock-in (multipart/form-data)
5. Backend:
   a. Verifikasi JWT + cek role (STAFF/PIMPINAN/SUPER_ADMIN boleh)
   b. Validasi data dengan Zod schema
   c. Upload nota ke Cloudinary (jika ada file)
   d. Jalankan Prisma transaction:
      - INSERT record ke tabel stock_in
      - UPDATE products SET stock = stock + quantity  ← atomik
      - INSERT ke audit_logs
6. Response sukses → tabel di-refresh
```

Jika salah satu langkah di dalam transaction gagal (misal upload berhasil tapi insert gagal), seluruh operasi di-rollback sehingga stok tidak berubah.

---

### Alur Barang Keluar

Sama dengan barang masuk, dengan tambahan:

```
5d. Cek stok: jika product.stock < quantity → tolak dengan error 400
5e. Hitung diskon (jika discountId dikirim):
    - PERCENTAGE: totalPrice = (qty × harga) - (qty × harga × persen/100)
    - NOMINAL: totalPrice = (qty × harga) - nilai_nominal
5f. UPDATE products SET stock = stock - quantity  ← atomik
```

Hanya `SUPER_ADMIN` dan `PIMPINAN` yang bisa menghapus data barang masuk/keluar. Penghapusan juga berjalan dalam transaction — stok dikembalikan secara otomatis.

---

### Alur Laporan

```
1. User pilih jenis laporan (barang masuk / barang keluar)
2. Pilih periode (hari ini, 7 hari, bulan ini, dll. atau custom range)
3. Klik "Cetak Laporan"
4. Frontend fetch semua data dari API (limit 1000)
5. Filter data sesuai rentang tanggal di sisi client
6. Buka print window baru dengan HTML yang sudah diformat
7. Browser print dialog muncul otomatis
```

Laporan dicetak langsung dari browser ke printer atau PDF — tidak ada file yang disimpan di server.

---

### Alur Kupon Diskon

```
1. PIMPINAN / SUPER_ADMIN buka halaman Kupon Diskon
2. Isi form builder: judul, persen diskon, kode promo, masa berlaku, min. pembelian
3. Preview kupon tampil real-time di sebelah kanan
4. Klik "Tambahkan Sekarang!" → POST /api/v1/discounts
5. Kupon tersimpan di database dengan status isActive = true
6. Saat staff input barang keluar, kupon aktif bisa dipilih
7. Backend hitung diskon dan simpan discountAmount di record stock_out
```

---

### Keamanan

Setiap request ke endpoint yang dilindungi melewati dua lapisan middleware:

```
Request masuk
    │
    ▼
verifyJWT()          ← cek Authorization: Bearer <token>
    │                   jika invalid/expired → 401
    ▼
authorize() / checkRole()  ← cek role user vs role yang diizinkan
    │                         jika tidak punya akses → 403
    ▼
validate(zodSchema)  ← validasi body/params dengan Zod
    │                   jika tidak valid → 422 dengan detail field error
    ▼
Controller → Service → Database
```

Middleware global tambahan: `helmet` (security headers), `cors` (whitelist origin), `express-rate-limit` (anti brute-force).

---

## Struktur Proyek

```
suti-water-system/          ← Monorepo root (Turborepo + npm workspaces)
│
├── apps/
│   ├── api/                ← Backend Express.js
│   │   └── src/
│   │       ├── app.ts              ← Entry point, setup middleware & routes
│   │       ├── config/             ← Database, Redis, Cloudinary, Passport
│   │       ├── middlewares/        ← auth, role, validate, upload, error
│   │       ├── modules/            ← Satu folder per domain bisnis
│   │       │   ├── auth/           ← login, register, refresh, OAuth
│   │       │   ├── products/       ← CRUD produk
│   │       │   ├── stock-in/       ← Barang masuk + delete atomik
│   │       │   ├── stock-out/      ← Barang keluar + delete atomik
│   │       │   ├── suppliers/      ← Master data pemasok
│   │       │   ├── agents/         ← Master data agen
│   │       │   ├── users/          ← Manajemen pengguna
│   │       │   ├── discounts/      ← Kupon diskon
│   │       │   ├── categories/     ← Kategori produk
│   │       │   ├── dashboard/      ← Summary KPI
│   │       │   └── audit-logs/     ← Log aktivitas
│   │       └── utils/              ← ApiResponse, ApiError, logger, dll.
│   │
│   └── web/                ← Frontend Next.js 16 (App Router)
│       └── src/
│           ├── app/
│           │   ├── login/          ← Halaman login
│           │   ├── register/       ← Halaman register
│           │   └── dashboard/      ← Semua halaman dashboard (protected)
│           │       ├── page.tsx            ← Dashboard utama (KPI, chart)
│           │       ├── stock-in/           ← Barang masuk
│           │       ├── stock-out/          ← Barang keluar
│           │       ├── reports/            ← Cetak laporan
│           │       ├── discounts/          ← Builder kupon diskon
│           │       ├── profile/            ← Profil & ubah password
│           │       └── master/
│           │           ├── suppliers/      ← Master pemasok
│           │           ├── agents/         ← Master agen
│           │           ├── products/       ← Master barang
│           │           └── users/          ← Manajemen pengguna
│           ├── components/
│           │   ├── layout/         ← Sidebar, Header
│           │   └── ui/             ← Modal (reusable)
│           ├── services/           ← Thin HTTP wrappers (axios)
│           ├── store/              ← Zustand (auth state)
│           ├── lib/                ← Axios instance + interceptors
│           └── types/              ← TypeScript types (api.ts)
│
├── prisma/
│   ├── schema.prisma       ← Single source of truth skema database
│   ├── seed.ts             ← Data awal untuk development
│   └── migrations/         ← Riwayat perubahan skema
│
└── packages/
    ├── typescript-config/  ← Shared tsconfig
    └── eslint-config/      ← Shared ESLint rules
```

Setiap modul backend mengikuti pola yang sama:

```
routes.ts     ← Daftarkan endpoint + pasang middleware
controller.ts ← Terima request, panggil service, kirim response
service.ts    ← Logika bisnis + query Prisma
schema.ts     ← Zod schema untuk validasi input
```

---

## Database

Semua tabel menggunakan UUID sebagai primary key. Field nama di Prisma menggunakan `camelCase`, dipetakan ke `snake_case` di PostgreSQL via `@map`.

### Tabel Utama

| Tabel               | Isi                                                         |
| ------------------- | ----------------------------------------------------------- |
| `users`             | Akun pengguna (email, password hash, role, Google ID)       |
| `refresh_tokens`    | Token refresh yang aktif (hash, expiry, IP)                 |
| `products`          | Katalog produk (SKU, harga beli, harga jual, stok)          |
| `categories`        | Kategori produk                                             |
| `suppliers`         | Data pemasok                                                |
| `agents`            | Data agen / pembeli tetap                                   |
| `stock_in`          | Riwayat barang masuk                                        |
| `stock_out`         | Riwayat barang keluar                                       |
| `discounts`         | Kupon diskon (persentase atau nominal)                      |
| `discount_products` | Relasi diskon ↔ produk (jika diskon spesifik produk)        |
| `audit_logs`        | Log semua aksi penting (siapa, apa, kapan, nilai lama/baru) |

### Relasi Penting

```
products ──< stock_in >── suppliers
products ──< stock_out >── agents
stock_out >── discounts
users ──< stock_in
users ──< stock_out
users ──< audit_logs
```

Soft delete (`deletedAt`) diterapkan pada tabel `products` dan `discounts`. Query selalu menyertakan filter `deletedAt: null` agar data yang dihapus tidak muncul.

---

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Auth

| Method | Endpoint                | Akses           | Keterangan                          |
| ------ | ----------------------- | --------------- | ----------------------------------- |
| POST   | `/auth/register`        | Public          | Daftar akun baru                    |
| POST   | `/auth/login`           | Public          | Login, dapat access + refresh token |
| POST   | `/auth/refresh`         | Public (cookie) | Perbarui access token               |
| POST   | `/auth/logout`          | Login           | Revoke refresh token                |
| GET    | `/auth/me`              | Login           | Ambil profil sendiri                |
| PATCH  | `/auth/me`              | Login           | Update nama, telepon                |
| PATCH  | `/auth/change-password` | Login           | Ubah password                       |
| GET    | `/auth/google`          | Public          | Mulai Google OAuth                  |

### Master Data

| Method | Endpoint         | Akses     | Keterangan                 |
| ------ | ---------------- | --------- | -------------------------- |
| GET    | `/products`      | Login     | Daftar produk              |
| POST   | `/products`      | Login     | Tambah produk              |
| PUT    | `/products/:id`  | Login     | Edit produk                |
| DELETE | `/products/:id`  | Login     | Hapus produk (soft delete) |
| GET    | `/suppliers`     | Login     | Daftar pemasok             |
| POST   | `/suppliers`     | PIMPINAN+ | Tambah pemasok             |
| PUT    | `/suppliers/:id` | PIMPINAN+ | Edit pemasok               |
| DELETE | `/suppliers/:id` | PIMPINAN+ | Hapus pemasok              |
| GET    | `/agents`        | Login     | Daftar agen                |
| POST   | `/agents`        | PIMPINAN+ | Tambah agen                |
| PUT    | `/agents/:id`    | PIMPINAN+ | Edit agen                  |
| DELETE | `/agents/:id`    | PIMPINAN+ | Hapus agen                 |
| GET    | `/users`         | Login     | Daftar pengguna            |
| POST   | `/users`         | PIMPINAN+ | Tambah pengguna            |
| PATCH  | `/users/:id`     | PIMPINAN+ | Edit pengguna              |
| DELETE | `/users/:id`     | PIMPINAN+ | Hapus pengguna             |

### Transaksi

| Method | Endpoint         | Akses     | Keterangan                         |
| ------ | ---------------- | --------- | ---------------------------------- |
| GET    | `/stock-in`      | Login     | Riwayat barang masuk (pagination)  |
| POST   | `/stock-in`      | Login     | Catat barang masuk + update stok   |
| DELETE | `/stock-in/:id`  | PIMPINAN+ | Hapus + rollback stok              |
| GET    | `/stock-out`     | Login     | Riwayat barang keluar (pagination) |
| POST   | `/stock-out`     | Login     | Catat barang keluar + kurangi stok |
| DELETE | `/stock-out/:id` | PIMPINAN+ | Hapus + kembalikan stok            |

### Lainnya

| Method | Endpoint         | Akses       | Keterangan              |
| ------ | ---------------- | ----------- | ----------------------- |
| GET    | `/dashboard`     | Login       | KPI summary, chart data |
| GET    | `/discounts`     | Login       | Daftar kupon            |
| POST   | `/discounts`     | PIMPINAN+   | Buat kupon baru         |
| PATCH  | `/discounts/:id` | PIMPINAN+   | Edit kupon              |
| DELETE | `/discounts/:id` | SUPER_ADMIN | Hapus kupon             |
| GET    | `/audit-logs`    | Login       | Log aktivitas           |
| GET    | `/categories`    | Login       | Daftar kategori         |
| GET    | `/api/v1/health` | Public      | Health check API + DB   |

---

## Progress Pengembangan

### ✅ Sudah Selesai

#### Backend

- Semua modul API tersedia dan terlindungi auth + role middleware
- Transaksi stok berjalan atomik dengan Prisma transaction (rollback otomatis jika gagal)
- Delete stock-in/stock-out mengembalikan stok secara atomik
- Upload nota ke Cloudinary via Multer
- Google OAuth dengan Passport.js
- Refresh token disimpan di database (bisa di-revoke)
- Audit log untuk semua aksi penting
- Script `build`, `typecheck`, `lint` tersedia di `apps/api`

#### Frontend

- Semua halaman utama tersedia dan lolos TypeScript check
- Auth: login, register, Google OAuth callback
- Dashboard: KPI cards, chart barang masuk/keluar, top buyers, top products, stok hampir habis
- Master data: pemasok, agen, produk (harga beli + jual terpisah), pengguna — semua CRUD
- Barang masuk: tambah, lihat riwayat, hapus dengan konfirmasi
- Barang keluar: tambah, lihat riwayat, hapus dengan konfirmasi
- Laporan: filter periode, cetak ke print window (A4 landscape)
- Kupon diskon: form builder visual dengan preview real-time
- Profil: lihat data, ubah profil, ubah kata sandi
- Sidebar mobile: drawer buka/tutup
- Semua dialog konfirmasi/error menggunakan SweetAlert2 (tidak ada `alert()` lagi)
- Upload nota menggunakan `useRef` (bukan `document.getElementById`)

### 🔄 Sedang / Belum Dikerjakan

#### Fitur Bisnis

- ✅ ~~Halaman list kupon aktif/nonaktif~~ — tab "Daftar Kupon" dengan toggle aktif/nonaktif dan hapus
- ✅ ~~Edit dan nonaktifkan kupon dari halaman discounts~~ — toggle status langsung dari daftar
- ✅ ~~Pilihan diskon manual di form barang keluar~~ — dropdown diskon aktif, kalkulasi real-time
- ✅ ~~Halaman audit logs di frontend~~ — tabel dengan filter entitas/aksi dan pagination
- [ ] Pagination dan search/filter di tabel master & transaksi (backend sudah mendukung)

#### Kualitas & Keamanan

- [ ] Test otomatis (unit test transaksi stok, auth, role authorization)
- [ ] Soft delete konsisten untuk suppliers, agents, users (saat ini hanya products & discounts)
- ✅ ~~Batasi ukuran dan tipe file upload di backend~~ — 5MB limit + file filter di Cloudinary config
- [ ] Validasi CORS origin untuk production

#### Dokumentasi & Deployment

- [ ] README root (saat ini masih template Turborepo)
- [ ] Panduan setup `.env`
- [ ] Seed data untuk development
- [ ] Checklist deployment production

---

## Cara Menjalankan

### Prasyarat

- Node.js >= 18
- PostgreSQL (lokal atau cloud)
- Redis (lokal atau cloud)
- Akun Cloudinary (untuk upload file)

### Setup

```bash
# 1. Clone dan install dependencies
git clone <repo>
cd suti-water-system
npm install

# 2. Salin dan isi environment variables
cp .env.example .env
# Edit .env sesuai konfigurasi lokal

# 3. Jalankan migrasi database
npx prisma migrate dev

# 4. (Opsional) Isi data awal
npx ts-node prisma/seed.ts

# 5. Jalankan semua app sekaligus
npm run dev
```

### Perintah Berguna

```bash
# Jalankan semua app (API + Web)
npm run dev

# Jalankan hanya API
npm run dev --workspace api

# Jalankan hanya Web
npm run dev --workspace web

# Build semua
npm run build

# TypeScript check API
npm run typecheck --workspace api

# TypeScript check Web
npx tsc --noEmit --project apps/web/tsconfig.json

# Lint Web
npm run lint --workspace web -- --quiet

# Prisma Studio (GUI database)
npx prisma studio

# Generate Prisma client setelah ubah schema
npx prisma generate

# Buat migration baru
npx prisma migrate dev --name nama_migration
```

### Environment Variables yang Dibutuhkan

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/suti_water

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

# App
PORT=5000
CORS_ORIGINS=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## Keputusan Teknis Penting

| Keputusan                        | Alasan                                                              |
| -------------------------------- | ------------------------------------------------------------------- |
| Monorepo dengan Turborepo        | Satu repo untuk API dan Web, shared TypeScript config dan ESLint    |
| Prisma transaction untuk stok    | Mencegah race condition — stok tidak bisa berubah setengah jalan    |
| Refresh token di database        | Bisa di-revoke kapan saja (logout dari semua device)                |
| Access token di memori (Zustand) | Tidak bisa dicuri via XSS karena tidak di localStorage              |
| Refresh token di HttpOnly cookie | Tidak bisa diakses JavaScript, aman dari XSS                        |
| Zod di frontend dan backend      | Validasi konsisten, schema bisa di-share                            |
| SweetAlert2 untuk semua dialog   | Konsisten, tidak ada `window.alert()` yang tidak bisa dikustomisasi |
| `useRef` untuk file input        | Menghindari akses DOM manual yang anti-pattern di React             |
| Soft delete di products          | Data historis transaksi tetap valid meski produk "dihapus"          |
