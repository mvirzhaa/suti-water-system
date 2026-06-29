# Progress Sistem Suti Water System

**Tanggal update:** 15 Mei 2026  
**Status umum:** Fondasi backend dan frontend sudah stabil. Bug-bug integrasi utama sudah diselesaikan. Halaman reports dan discounts sudah tersedia. Fokus berikutnya adalah fitur list/edit kupon, pilihan diskon manual di stock-out, dan pagination tabel.

## Ringkasan Status

| Area              | Status     | Catatan                                                                                                |
| ----------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| Monorepo          | Berjalan   | Menggunakan workspace `apps/api` dan `apps/web`.                                                       |
| Backend API       | Stabil     | Semua modul tersedia dan terlindungi auth/role. Script `build`, `typecheck`, `lint` sudah ditambahkan. |
| Frontend Web      | Stabil     | Semua halaman utama tersedia dan lolos TypeScript check.                                               |
| Database          | Tersedia   | Prisma dan PostgreSQL digunakan.                                                                       |
| Auth              | Lengkap    | Login, register, refresh token, Google OAuth, profile, change password tersedia.                       |
| Responsive UI     | Diperbaiki | Layout dashboard, modal, tabel, dan sidebar mobile sudah responsif.                                    |
| Halaman Reports   | ✅ Ada     | Filter periode, cetak ke print window, support stock-in & stock-out.                                   |
| Halaman Discounts | ✅ Ada     | Form builder kupon visual, submit ke API. List/edit kupon belum ada.                                   |
| Master Data       | ✅ Lengkap | Suppliers, agents, products (harga beli+jual), users — semua CRUD berfungsi.                           |
| Transaksi         | ✅ Lengkap | Stock-in dan stock-out dengan delete atomik (rollback stok).                                           |

## Yang Sudah Selesai

### Backend

- Struktur API Express sudah terpasang dengan base path `/api/v1`.
- Middleware global tersedia:
  - `helmet`
  - `cors`
  - `cookie-parser`
  - rate limit global
  - JSON/urlencoded parser
  - error middleware
- Auth module sudah mencakup:
  - register
  - login
  - refresh token
  - logout
  - profile sendiri
  - update profile
  - change password
  - Google OAuth
- Modul bisnis yang sudah ada:
  - categories
  - products
  - stock-in
  - stock-out
  - discounts
  - audit-logs
  - dashboard summary
  - suppliers
  - agents
  - users
- Upload configuration sudah ada untuk nota dan foto melalui Multer/Cloudinary.
- Dashboard API sudah menyediakan endpoint summary.
- Products sudah punya endpoint list/create/update/delete.
- Stock-in dan stock-out sudah punya endpoint utama untuk pencatatan transaksi.
- Users, suppliers, dan agents sudah punya service/controller/route dasar.

### Frontend

- Halaman auth:
  - login
  - register
- Layout dashboard:
  - sidebar
  - header
  - protected layout berdasarkan auth store
- Dashboard utama:
  - KPI cards
  - top buyers
  - top products
  - chart barang masuk/keluar
  - tabel stok hampir habis dan transaksi terbaru
- Master data:
  - pemasok
  - barang
  - agen
  - pengguna
- Transaksi:
  - barang masuk
  - barang keluar
- Modal reusable sudah tersedia di `apps/web/src/components/ui/Modal.tsx`.
- SweetAlert2 sudah ditambahkan untuk dialog sukses/error/konfirmasi.
- Responsive fix yang sudah dilakukan:
  - modal berada di tengah viewport
  - modal form turun ke satu kolom di HP
  - tabel bisa horizontal scroll
  - grid dashboard turun menjadi 1 kolom di mobile
  - sidebar mobile berubah menjadi drawer buka/tutup

## Yang Masih Kurang

### Fitur

- Halaman discounts hanya bisa **buat** kupon baru — belum ada list, edit, atau nonaktifkan kupon yang sudah ada.
- Stock-out masih otomatis mengambil diskon persentase aktif pertama — belum ada pilihan diskon manual dari user.
- Belum ada pagination/search/filter di tabel frontend (backend sudah mendukung pagination).
- Belum ada halaman profile/settings user.
- Belum ada halaman audit logs di frontend.

### Integrasi FE-BE

- Response shape API diasumsikan memiliki `data`; perlu distandarkan di semua endpoint.
- Beberapa field frontend masih bergantung pada optional nested data (`item.product`, `item.agent`, `item.discount`); perlu pastikan include backend selalu sesuai kebutuhan UI.

### Security dan Authorization

- Refresh token dan cookie auth perlu diuji ulang di browser lintas origin.
- Perlu validasi production CORS origin dari `.env`.
- Perlu pastikan semua upload dibatasi ukuran, tipe file, dan storage error handling.

### Data dan Business Logic

- Perlu validasi harga: pastikan tipe Decimal/number aman antara Prisma, API, dan UI.
- Perlu aturan diskon yang jelas: diskon nominal vs persentase, konflik beberapa diskon aktif.
- Soft delete perlu konsistensi untuk suppliers, agents, users (saat ini hanya products yang punya `deletedAt`).
- Audit log perlu dipastikan tercatat untuk semua aksi penting.

### UI/UX

- Perlu QA manual responsive per halaman di ukuran 320px, 375px, 768px, 1366px+.
- Perlu loading state per action (bukan hanya loading data awal).
- Sidebar mobile bisa ditingkatkan: close saat tekan Escape, focus trap, body scroll lock.

### Kualitas Kode

- Frontend masih memiliki warning lint non-blocking: penggunaan `<img>` disarankan diganti `next/image`.
- Banyak tipe frontend masih ringan; perlu dibuat lebih rapih dari kontrak API/Prisma.
- Belum ada test otomatis untuk auth, product CRUD, stock transaction, discount calculation.
- README root masih template Turborepo.

## Bug atau Risiko Prioritas Tinggi

1. ~~**Mismatch update user**~~ ✅ **SELESAI**
2. ~~**Route suppliers/agents perlu proteksi auth**~~ ✅ **SELESAI**
3. ~~**Delete stock-in/stock-out belum jelas**~~ ✅ **SELESAI**
4. ~~**Transaksi stok perlu diuji end-to-end**~~ ✅ **Logika atomik sudah ada** (Prisma transaction + rollback stok)
5. ~~**Halaman laporan belum tersedia**~~ ✅ **SELESAI** — halaman reports sudah ada dengan filter periode dan cetak
6. ~~**Halaman discounts belum tersedia**~~ ✅ **SELESAI** — halaman discounts sudah ada (create kupon)
7. ~~**`/dashboard/master` 404**~~ ✅ **SELESAI** — redirect ke `/dashboard/master/suppliers`
8. ~~**Tombol Eye suppliers tidak berfungsi**~~ ✅ **SELESAI** — dihapus
9. ~~**`priceBuy` di-hardcode sama dengan `priceSell`**~~ ✅ **SELESAI** — field harga beli terpisah
10. ~~**`document.getElementById` nota upload**~~ ✅ **SELESAI** — diganti `useRef`
11. ~~**Unused catch variable di auth store**~~ ✅ **SELESAI**
12. ~~**API tidak punya script build/lint/typecheck**~~ ✅ **SELESAI**

**Risiko yang masih ada:**

- Halaman discounts hanya bisa create — belum ada list/edit/nonaktifkan kupon
- Stock-out masih pakai diskon otomatis (diskon pertama aktif), bukan pilihan user

## Rekomendasi Roadmap Berikutnya

### Tahap 1 - Stabilkan Integrasi ✅ SELESAI

### Tahap 2 - Rapikan Fitur Bisnis ✅ SELESAI

- ✅ Tambah tab "Daftar Kupon" dengan toggle aktif/nonaktif dan hapus
- ✅ Pilihan diskon manual di stock-out (dropdown + kalkulasi real-time)
- ✅ Halaman audit logs frontend dengan filter dan pagination
- ✅ Upload file limit 5MB + file type filter di Cloudinary config

### Tahap 3 - Hardening Backend

- [ ] Tambahkan test transaksi stok (stock-in menambah, stock-out mengurangi, rollback jika gagal)
- [ ] Tambahkan test authorization role
- [ ] Pastikan semua create/update/delete penting masuk audit log
- [ ] Audit soft delete di semua master data (suppliers, agents, users)
- [ ] Batasi ukuran dan tipe file upload

### Tahap 4 - Produksi dan Dokumentasi

- [ ] Ganti README template dengan dokumentasi Suti Water System
- [ ] Tambahkan panduan setup `.env`
- [ ] Tambahkan seed data development
- [ ] Tambahkan checklist deployment
- [ ] Pastikan CORS, cookie, JWT secret, Cloudinary, dan database config aman untuk production

## Perintah Validasi Saat Ini

Frontend:

```bash
npm run lint --workspace web -- --quiet
npm run build --workspace web
```

API:

```bash
npm run typecheck --workspace api
npm run build --workspace api
```

Development:

```bash
npm run dev
```

## Catatan Terakhir

Frontend saat ini sudah lebih stabil dari sisi build dan responsive mobile. Fokus berikutnya sebaiknya bukan menambah tampilan baru dulu, tetapi menyamakan kontrak FE-BE, mengamankan route API, dan memastikan transaksi stok benar secara data.
