# Progress Sistem Suti Water System

**Tanggal update:** 14 Mei 2026  
**Status umum:** aplikasi sudah memiliki fondasi backend dan frontend yang bisa dijalankan untuk alur utama dashboard, master data, barang masuk, dan barang keluar. Frontend sudah lolos build dan lint, tetapi masih ada beberapa gap integrasi, keamanan route, fitur bisnis, dan polish UI yang perlu dibereskan sebelum dianggap siap produksi.

## Ringkasan Status

| Area | Status | Catatan |
| --- | --- | --- |
| Monorepo | Berjalan | Menggunakan workspace `apps/api` dan `apps/web`. |
| Backend API | Sebagian besar tersedia | Modul auth, dashboard, products, stock-in, stock-out, discounts, suppliers, agents, users, categories, audit-log sudah ada. |
| Frontend Web | Berjalan | Next.js dashboard, login/register, master data, stock-in, stock-out sudah tersedia. |
| Database | Tersedia | Prisma dan PostgreSQL digunakan, tetapi perlu validasi ulang migration/seed terakhir. |
| Auth | Ada | Login, register, refresh token, Google OAuth, profile, change password tersedia di API. |
| Responsive UI | Baru diperbaiki | Layout dashboard, modal, tabel, dan sidebar mobile sudah dibuat lebih responsif; sidebar mobile sudah bisa buka/tutup. |
| Validasi FE terakhir | Lolos | `npm run lint --workspace web -- --quiet` dan `npm run build --workspace web` berhasil. |
| Validasi API terakhir | Belum lengkap | API belum punya script build/lint/test standar di `apps/api/package.json`. |

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

- Belum ada halaman frontend untuk:
  - categories
  - discounts/kupon
  - reports/laporan
  - audit logs
  - profile/settings user
- Tombol laporan di sidebar mengarah ke `/dashboard/reports`, tetapi halaman laporan belum terlihat tersedia.
- Parent menu `Master Data` punya href `/dashboard/master`, tetapi tidak terlihat ada halaman index untuk route tersebut.
- Tombol delete di halaman stock-in dan stock-out masih tampil, tetapi belum terlihat handler delete yang benar-benar memanggil API.
- Upload nota pada stock-in/stock-out masih menggunakan akses DOM manual `document.getElementById`; lebih baik diintegrasikan dengan React Hook Form.
- Upload foto pemasok di UI masih tertulis opsional/belum didukung backend.
- Fitur diskon di stock-out masih otomatis mengambil diskon persentase aktif pertama, belum ada pilihan kupon/diskon yang jelas dari user.
- Belum ada pagination/search/filter di tabel frontend, walaupun backend beberapa endpoint sudah mendukung pagination.
- Belum ada empty state dan error state yang konsisten untuk semua halaman.

### Integrasi FE-BE

- `userService.update` di frontend menggunakan `PUT /users/:id`, sedangkan route backend users memakai `PATCH /users/:id`. Ini harus disamakan.
- Perlu audit ulang method endpoint lain agar FE dan BE konsisten:
  - products menggunakan PUT di backend dan FE, sudah cocok.
  - suppliers/agents menggunakan PUT di backend dan FE, sudah cocok.
  - users masih mismatch PATCH vs PUT.
- Response shape API diasumsikan memiliki `data`; perlu distandarkan di semua endpoint.
- Beberapa field frontend masih bergantung pada optional nested data, misalnya `item.product`, `item.agent`, `item.discount`; perlu pastikan include backend selalu sesuai kebutuhan UI.

### Security dan Authorization

- Route suppliers dan agents di backend terlihat belum memasang `verifyJWT`/role middleware di file route. Ini berisiko karena endpoint bisa terbuka jika tidak dilindungi di level lain.
- Perlu review role access untuk semua endpoint:
  - siapa boleh melihat data
  - siapa boleh create/update/delete
  - apakah staff boleh menghapus data master
- Refresh token dan cookie auth sudah ada, tetapi perlu diuji ulang di browser lintas origin.
- Perlu validasi production CORS origin dari `.env`.
- Perlu pastikan semua upload dibatasi ukuran, tipe file, dan storage error handling.

### Data dan Business Logic

- Perlu validasi transaksi stok:
  - stock-in harus menambah stok produk secara atomik.
  - stock-out harus mengurangi stok produk secara atomik.
  - stock-out harus menolak transaksi jika stok tidak cukup.
  - rollback harus aman jika upload/transaksi gagal.
- Perlu validasi harga:
  - `priceBuy`, `priceSell`, `pricePerUnit`, `totalCost`, `totalPrice`.
  - pastikan tipe Decimal/number aman antara Prisma, API, dan UI.
- Perlu aturan diskon yang jelas:
  - diskon nominal vs persentase
  - masa aktif diskon
  - produk mana yang boleh memakai diskon
  - bagaimana konflik beberapa diskon aktif diselesaikan
- Soft delete sudah terlihat di products; perlu konsistensi untuk suppliers, agents, users, dan transaksi.
- Audit log perlu dipastikan tercatat untuk semua aksi penting.

### UI/UX

- Responsive sudah diperbaiki secara global, tetapi masih perlu QA manual per halaman di ukuran:
  - 320px
  - 375px
  - 768px
  - desktop 1366px+
- Tabel mobile saat ini memakai horizontal scroll. Ini aman, tetapi UX bisa ditingkatkan menjadi card list untuk mobile.
- Banyak style masih inline di komponen page. Ini membuat maintenance responsive lebih sulit.
- Perlu konsistensi desain tombol action edit/delete/view.
- Perlu loading state per action, bukan hanya loading data awal.
- Perlu toast/dialog error yang konsisten, tidak campur `alert` dan SweetAlert2.
- Sidebar mobile sudah bisa buka/tutup, tetapi bisa ditingkatkan dengan:
  - close saat tekan Escape
  - focus trap
  - body scroll lock saat drawer terbuka

### Kualitas Kode

- Frontend masih memiliki warning lint non-blocking:
  - penggunaan `<img>` disarankan diganti `next/image`.
  - React Hook Form `watch()` memunculkan warning React Compiler di stock-in/stock-out.
  - ada unused catch variable di auth store.
- Banyak tipe frontend baru masih tipe ringan; perlu dibuat lebih rapih dari kontrak API/Prisma.
- API belum punya script standar:
  - `build`
  - `lint`
  - `test`
  - `typecheck`
- Belum terlihat test otomatis untuk:
  - auth
  - product CRUD
  - stock transaction
  - discount calculation
  - protected routes
- README root masih template Turborepo dan belum menjelaskan cara menjalankan sistem Suti Water.

## Bug atau Risiko Prioritas Tinggi

1. **Mismatch update user**
   - FE: `PUT /users/:id`
   - BE: `PATCH /users/:id`
   - Dampak: edit user dari frontend berpotensi gagal.

2. **Route suppliers/agents perlu proteksi auth**
   - Jika benar belum ada middleware global, endpoint master data bisa diakses tanpa login.
   - Dampak: risiko keamanan data.

3. **Delete stock-in/stock-out belum jelas**
   - UI menampilkan tombol delete, tetapi handler belum ada.
   - Dampak: user mengira bisa hapus data, tetapi tombol tidak bekerja.

4. **Transaksi stok perlu diuji end-to-end**
   - Harus dipastikan stock-in menambah stok dan stock-out mengurangi stok dengan benar.
   - Dampak: laporan stok bisa salah jika logika belum atomik.

5. **Halaman laporan belum tersedia**
   - Sidebar sudah menampilkan menu Laporan.
   - Dampak: navigasi ke route kosong/404.

## Rekomendasi Roadmap Berikutnya

### Tahap 1 - Stabilkan Integrasi

- Samakan endpoint users update antara FE dan BE.
- Proteksi route suppliers dan agents dengan auth/role middleware.
- Tambahkan handler delete atau sembunyikan tombol delete di stock-in/stock-out sampai backend siap.
- Uji manual alur:
  - login
  - tambah/edit/hapus pemasok
  - tambah/edit/hapus agen
  - tambah/edit/hapus barang
  - tambah/edit/hapus pengguna
  - barang masuk
  - barang keluar

### Tahap 2 - Rapikan UX Utama

- Buat halaman reports atau sembunyikan menu Laporan sementara.
- Buat halaman discounts/kupon karena sidebar sudah punya CTA "Buat Kupon Sekarang".
- Ganti `alert` di stock-in/stock-out menjadi SweetAlert2/helper dialog yang konsisten.
- Tambahkan search/filter/pagination di tabel master dan transaksi.
- Tambahkan empty state yang lebih informatif.

### Tahap 3 - Hardening Backend

- Tambahkan script `build`, `lint`, dan `test` untuk API.
- Tambahkan test transaksi stok.
- Tambahkan test authorization role.
- Pastikan semua create/update/delete penting masuk audit log.
- Audit soft delete di semua master data.

### Tahap 4 - Produksi dan Dokumentasi

- Ganti README template dengan dokumentasi Suti Water System.
- Tambahkan panduan setup `.env`.
- Tambahkan seed data development.
- Tambahkan checklist deployment.
- Pastikan CORS, cookie, JWT secret, Cloudinary, dan database config aman untuk production.

## Perintah Validasi Saat Ini

Frontend:

```bash
npm run lint --workspace web -- --quiet
npm run build --workspace web
```

Development:

```bash
npm run dev
```

API development:

```bash
npm run dev --workspace api
```

## Catatan Terakhir

Frontend saat ini sudah lebih stabil dari sisi build dan responsive mobile. Fokus berikutnya sebaiknya bukan menambah tampilan baru dulu, tetapi menyamakan kontrak FE-BE, mengamankan route API, dan memastikan transaksi stok benar secara data.
