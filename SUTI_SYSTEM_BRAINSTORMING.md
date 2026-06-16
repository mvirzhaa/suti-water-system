# Suti Water System - Brainstorming & Context Document

Dokumen ini adalah ringkasan teknis yang sangat rinci mengenai rancangan arsitektur, alur logika bisnis tingkat lanjut, skema database, keamanan, dan rencana pengembangan **Suti Water System**. Dokumen ini ditujukan khusus sebagai konteks dasar (*baseline context*) untuk sesi brainstorming dengan Claude AI.

---

## 1. Arsitektur & Struktur Proyek (Monorepo)

Sistem ini dikelola menggunakan **Turborepo** sebagai monorepo dengan npm workspaces untuk berbagi konfigurasi dan skema validasi antara Frontend dan Backend secara efisien.

### 1.1 Struktur Folder Utama
```text
suti-water-system/
├── apps/
│   ├── api/                         # Backend Express.js + TypeScript
│   │   ├── src/
│   │   │   ├── config/              # Prisma Client, Redis connection, Cloudinary, Passport Google OAuth
│   │   │   ├── middlewares/         # Auth, Role (RBAC), Validate (Zod), Upload (Multer), Error Handler
│   │   │   ├── modules/             # Domain Driven Modules (Controller, Service, Routes, Zod Schema)
│   │   │   │   ├── auth/            # Registrasi, Login, Google OAuth, Rotasi Token
│   │   │   │   ├── products/        # CRUD Katalog Produk + Soft Delete
│   │   │   │   ├── stock-in/        # Logika Barang Masuk Atomik
│   │   │   │   ├── stock-out/       # Logika FIFO Pengurangan Stok Barang Keluar
│   │   │   │   ├── suppliers/       # Master Data Supplier/Pemasok
│   │   │   │   ├── agents/          # Master Data Agen/Buyer Tetap
│   │   │   │   └── discounts/       # Builder & Logika Perhitungan Kupon Diskon
│   │   │   └── utils/               # ApiError, ApiResponse, Winston Logger, Audit Log Helper
│   │   └── Dockerfile
│   │
│   └── web/                         # Frontend Next.js 16 (App Router)
│       ├── src/
│       │   ├── app/                 # Halaman UI (login, register, dashboard, master, stock-in, stock-out, reports, discounts, audit-logs)
│       │   ├── components/          # UI Components (shadcn/ui + custom Modal & Drawer responsif)
│       │   ├── services/            # Axios HTTP Client wrappers
│       │   ├── store/               # Zustand Store (Auth State & Access Token)
│       │   └── types/               # TypeScript Definitions
│
├── prisma/
│   ├── schema.prisma                # Single Source of Truth Database Relasional
│   └── seed.ts                      # Skrip Seed Data Development & Testing
```

### 1.2 Tech Stack & Ecosystem
- **Runtime & DB**: Node.js v20 LTS, PostgreSQL v16, Redis v7 (Rate Limiter & Session JWT).
- **Backend Framework**: Express.js dengan TypeScript, Prisma ORM v5, Passport.js (Google OAuth).
- **Frontend Framework**: Next.js v16, Tailwind CSS v3, Zustand v4, Axios, React Hook Form + Zod, TanStack Query v5 (React Query).
- **DevOps**: Docker & Docker Compose, Nginx (Reverse Proxy & SSL Termination), GitHub Actions (CI/CD Pipeline).

---

## 2. Skema Database Detail (Prisma ORM)

Semua entitas menggunakan **UUID** sebagai primary key. Nilai desimal harga diwakili tipe `Decimal(12, 2)` di PostgreSQL untuk menghindari masalah pembulatan *floating-point*.

```prisma
// prisma/schema.prisma

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
  name        String    @db.VarChar(100)
  email       String    @unique @db.VarChar(150)
  password    String?   @db.VarChar(255)
  googleId    String?   @unique @map("google_id") @db.VarChar(100)
  role        Role      @default(STAFF)
  isActive    Boolean   @default(true) @map("is_active")
  avatarUrl   String?   @map("avatar_url")
  phone       String?   @db.VarChar(20)
  lastLoginAt DateTime? @map("last_login_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  refreshTokens    RefreshToken[]
  stockIns         StockIn[]
  stockOuts        StockOut[]
  discountsCreated Discount[]
  auditLogs        AuditLog[]
  productsCreated  Product[]

  @@index([email])
  @@index([role])
  @@map("users")
}

model Category {
  id        String   @id @default(uuid())
  name      String   @unique @db.VarChar(100)
  slug      String   @unique @db.VarChar(100)
  icon      String?  @db.VarChar(50)
  createdAt DateTime @default(now()) @map("created_at")

  products Product[]

  @@map("categories")
}

model Supplier {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(150)
  phone     String?  @db.VarChar(20)
  address   String?  @db.Text
  imageUrl  String?  @map("image_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  stockIns StockIn[]

  @@map("suppliers")
}

model Agent {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(150)
  pic       String?  @db.VarChar(100)
  phone     String?  @db.VarChar(20)
  address   String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  stockOuts StockOut[]

  @@map("agents")
}

model Product {
  id          String    @id @default(uuid())
  name        String    @db.VarChar(150)
  sku         String?   @unique @db.VarChar(50)
  categoryId  String?   @map("category_id")
  unit        String    @default("pcs") @db.VarChar(30)
  priceBuy    Decimal   @default(0) @map("price_buy") @db.Decimal(12, 2)
  priceSell   Decimal   @default(0) @map("price_sell") @db.Decimal(12, 2)
  stock       Int       @default(0)
  minStock    Int       @default(5) @map("min_stock")
  imageUrl    String?   @map("image_url")
  description String?
  isActive    Boolean   @default(true) @map("is_active")
  createdBy   String?   @map("created_by")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  category         Category?         @relation(fields: [categoryId], references: [id])
  creator          User?             @relation(fields: [createdBy], references: [id])
  stockIns         StockIn[]
  stockOuts        StockOut[]
  discountProducts DiscountProduct[]

  @@index([categoryId])
  @@index([sku])
  @@index([stock])
  @@map("products")
}

model StockIn {
  id             String   @id @default(uuid())
  productId      String   @map("product_id")
  userId         String   @map("user_id")
  quantity       Int
  pricePerUnit   Decimal  @map("price_per_unit") @db.Decimal(12, 2)
  totalCost      Decimal  @map("total_cost") @db.Decimal(14, 2)
  supplier       String?  @db.VarChar(150)
  supplierId     String?  @map("supplier_id")
  entryDate      DateTime @map("entry_date") @db.Date
  notaUrl        String?  @map("nota_url")
  notaFilename   String?  @map("nota_filename") @db.VarChar(255)
  notaSize       Int?     @map("nota_size")
  notes          String?
  remainingStock Int      @default(0) @map("remaining_stock") // UNTUK FIFO STRATEGY
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  product Product   @relation(fields: [productId], references: [id])
  user    User      @relation(fields: [userId], references: [id])
  suppl   Supplier? @relation(fields: [supplierId], references: [id])

  @@index([productId])
  @@index([userId])
  @@index([entryDate(sort: Desc)])
  @@map("stock_in")
}

model StockOut {
  id                   String   @id @default(uuid())
  productId            String   @map("product_id")
  userId               String   @map("user_id")
  discountId           String?  @map("discount_id")
  quantity             Int
  pricePerUnit         Decimal  @map("price_per_unit") @db.Decimal(12, 2)
  discountAmount       Decimal  @default(0) @map("discount_amount") @db.Decimal(12, 2)
  totalPrice           Decimal  @map("total_price") @db.Decimal(14, 2)
  buyerName            String?  @map("buyer_name") @db.VarChar(150)
  agentId              String?  @map("agent_id")
  exitDate             DateTime @map("exit_date") @db.Date
  notaUrl              String?  @map("nota_url")
  notaFilename         String?  @map("nota_filename") @db.VarChar(255)
  notaSize             Int?     @map("nota_size")
  notes                String?
  productStockSnapshot Int      @default(0) @map("product_stock_snapshot")
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  product  Product   @relation(fields: [productId], references: [id])
  user     User      @relation(fields: [userId], references: [id])
  discount Discount? @relation(fields: [discountId], references: [id])
  agent    Agent?    @relation(fields: [agentId], references: [id])

  @@index([productId])
  @@index([userId])
  @@index([exitDate(sort: Desc)])
  @@map("stock_out")
}

model Discount {
  id           String        @id @default(uuid())
  name         String        @db.VarChar(100)
  description  String?
  type         DiscountType
  value        Decimal       @db.Decimal(10, 2)
  applicableTo DiscountScope @default(ALL) @map("applicable_to")
  minQuantity  Int?          @map("min_quantity")
  startDate    DateTime      @map("start_date") @db.Date
  endDate      DateTime?     @map("end_date") @db.Date
  isActive     Boolean       @default(true) @map("is_active")
  usageCount   Int           @default(0) @map("usage_count")
  createdBy    String        @map("created_by")
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")
  deletedAt    DateTime?     @map("deleted_at")

  creator          User              @relation(fields: [createdBy], references: [id])
  stockOuts        StockOut[]
  discountProducts DiscountProduct[]

  @@map("discounts")
}

model DiscountProduct {
  discountId String @map("discount_id")
  productId  String @map("product_id")

  discount Discount @relation(fields: [discountId], references: [id], onDelete: Cascade)
  product  Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@id([discountId, productId])
  @@map("discount_products")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  tokenHash String   @unique @map("token_hash") @db.VarChar(255)
  expiresAt DateTime @map("expires_at")
  revoked   Boolean  @default(false)
  ipAddress String?  @map("ip_address") @db.VarChar(45)
  userAgent String?  @map("user_agent")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("refresh_tokens")
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?  @map("user_id")
  action    String   @db.VarChar(100)
  entity    String   @db.VarChar(50)
  entityId  String?  @map("entity_id")
  oldValue  Json?    @map("old_value")
  newValue  Json?    @map("new_value")
  ipAddress String?  @map("ip_address") @db.VarChar(45)
  userAgent String?  @map("user_agent")
  metadata  Json?
  createdAt DateTime @default(now()) @map("created_at")

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([action])
  @@index([entity, entityId])
  @@index([createdAt(sort: Desc)])
  @@map("audit_logs")
}
```

---

## 3. Alur Kerja Logika Bisnis Tingkat Lanjut (Advanced Business Logic)

Dua alur transaksi yang paling kritikal dalam sistem ini adalah manajemen stok barang masuk (`StockIn`) dan barang keluar (`StockOut`) yang diimplementasikan secara atomik.

### 3.1 Transaksi Barang Masuk (Stock-In)
Ketika staff menambahkan stok masuk:
1. Hitung `totalCost` secara otomatis (`quantity * pricePerUnit`).
2. Mulai **Prisma Transaction (`prisma.$transaction`)** untuk melakukan:
   - Validasi keberadaan produk yang tidak berstatus *soft deleted* (`deletedAt == null`).
   - Buat record baru di tabel `stock_in` dengan menyimpan nilai `remainingStock = quantity`. Nilai `remainingStock` ini akan digunakan untuk mendeteksi ketersediaan unit barang pada pemotongan FIFO.
   - Perbarui stok produk dengan operator increment (`stock: { increment: quantity }`).
3. Setelah transaksi DB berhasil di-*commit*, helper audit log di luar transaksi akan dipanggil secara *asynchronous* (`createAuditLog`) untuk mencatat aktivitas pengguna demi meminimalisir waktu tunggu transaksi database.

### 3.2 Transaksi Barang Keluar (Stock-Out) - FIFO Strategy
Ketika barang dicatat keluar (penjualan), pemotongan stok tidak hanya memotong total stok di tabel `Product`, tetapi juga memotong sisa stok (`remainingStock`) pada transaksi `StockIn` sebelumnya dengan algoritma **FIFO (First In First Out)**:

```typescript
// Cuplikan Logika Asli (apps/api/src/modules/stock-out/stock-out.service.ts)

let qtyToDeplete = quantity; // Jumlah barang yang ingin dikeluarkan

// 1. Ambil transaksi barang masuk (StockIn) yang masih memiliki sisa stok, diurutkan dari yang paling lama masuk (entryDate ASC)
const availableStockIns = await tx.stockIn.findMany({
  where: { productId, remainingStock: { gt: 0 } },
  orderBy: { entryDate: 'asc' }
});

// 2. Lakukan iterasi pengurangan sisa stok secara bertahap
for (const stIn of availableStockIns) {
  if (qtyToDeplete <= 0) break;
  
  const depleteAmount = Math.min(qtyToDeplete, stIn.remainingStock);
  
  await tx.stockIn.update({
    where: { id: stIn.id },
    data: { remainingStock: stIn.remainingStock - depleteAmount }
  });
  
  qtyToDeplete -= depleteAmount;
}

// 3. Catat di tabel stock_out dengan melampirkan diskon (jika ada) dan kurangi total stok produk
```

### 3.3 Pembatalan/Penghapusan Transaksi Keluar (LIFO Restoration)
Hanya role `SUPER_ADMIN` dan `PIMPINAN` yang berhak menghapus data transaksi keluar (`StockOut`). Ketika transaksi ini dihapus, stok yang dikurangi harus dikembalikan ke transaksi asal (`StockIn`) dengan metode **LIFO (Last In First Out)** untuk mempertahankan integritas data urutan barang masuk:

```typescript
// Cuplikan Logika Pemulihan (LIFO)

let qtyToRestore = stockOut.quantity; // Jumlah stok yang ingin dikembalikan

// 1. Ambil transaksi barang masuk (StockIn) untuk produk ini, diurutkan dari yang terbaru (entryDate DESC)
const recentStockIns = await tx.stockIn.findMany({
  where: { productId: stockOut.productId },
  orderBy: { entryDate: 'desc' }
});

// 2. Kembalikan sisa kapasitas stok (spaceLeft = quantity awal - remainingStock saat ini)
for (const stIn of recentStockIns) {
  if (qtyToRestore <= 0) break;
  
  const spaceLeft = stIn.quantity - stIn.remainingStock;
  
  if (spaceLeft > 0) {
    const restoreAmount = Math.min(qtyToRestore, spaceLeft);
    
    await tx.stockIn.update({
      where: { id: stIn.id },
      data: { remainingStock: stIn.remainingStock + restoreAmount }
    });
    
    qtyToRestore -= restoreAmount;
  }
}

// 3. Tambah kembali total stok utama di tabel Product dan hapus record stock_out
```

### 3.4 Penghitungan Diskon Real-time
Ketika parameter `discountId` dilewatkan saat membuat transaksi barang keluar:
- Backend melakukan verifikasi apakah kupon diskon berstatus aktif (`isActive = true`).
- **Tipe Diskon**:
  - `PERCENTAGE`: Potongan harga = `(pricePerUnit * quantity * discountValue) / 100`.
  - `NOMINAL`: Potongan harga = `discountValue` (biasanya mewakili potongan per unit barang).
- Penghitungan total belanja akhir: `totalPrice = (pricePerUnit * quantity) - discountAmount`.

---

## 4. Keamanan & Autentikasi Sistem

Sistem ini menerapkan beberapa lapis keamanan untuk memitigasi celah eksploitasi umum.

### 4.1 Token Session & Cookie Proteksi
- **Access Token**: JWT berumur pendek (15 menit). Disimpan secara eksklusif dalam state memori Frontend (Zustand). Token ini tidak ditulis ke `localStorage` atau `sessionStorage` untuk menghindari serangan pencurian token lewat eksploitasi **XSS (Cross-Site Scripting)**.
- **Refresh Token**: JWT berumur panjang (7 hari). Disimpan di database (memungkinkan mekanisme pembatalan paksa oleh Admin) dan dikirim ke client menggunakan **HttpOnly Cookie** dengan atribut `SameSite=Strict` dan `Secure=true`. Cookie ini tidak dapat diakses oleh skrip JavaScript client.
- **Refresh Flow**: Axios interceptor di frontend mendeteksi status code `401 (TOKEN_EXPIRED)`. Axios kemudian secara otomatis memicu request `POST /api/v1/auth/refresh` ke backend. Jika refresh token di cookie masih valid, access token baru diterbitkan dan ditaruh kembali ke memori Zustand untuk mengulang *request* yang sempat gagal.

### 4.2 Middleware Keamanan di Backend
1. **verifyJWT**: Membaca header `Authorization: Bearer <token>`. Melakukan decoding token dan melampirkan payload user ke `req.user`.
2. **authorize(...roles)**: Enforce hak akses role (RBAC). Jika user tidak memiliki role yang diizinkan untuk rute tersebut, lemparkan error `403 Forbidden`.
3. **validate(zodSchema)**: Middleware penjamin kontrak data. Memeriksa kecocokan data input (dari `body`, `query`, atau `params`) sebelum diproses oleh controller bisnis. Lemparkan error `422 Unprocessable Entity` jika tidak valid.
4. **rateLimit**: Proteksi rate-limiting berbasis IP untuk menghindari serangan DDoS atau brute-force (default: maksimal 100 request/menit, rute login sensitif: 5 request per 15 menit).
5. **upload**: Membatasi ukuran upload berkas maksimal 5MB serta melakukan validasi MIME type (*magic bytes check*) khusus ekstensi `.pdf`, `.png`, `.jpg`, `.jpeg`.

---

## 5. Antarmuka API & Format Respons Standard

### 5.1 Format Respons Sukses
```json
{
  "success": true,
  "message": "Barang masuk berhasil disimpan",
  "data": {
    "id": "uuid-record",
    "productId": "uuid-product",
    "quantity": 50,
    "totalCost": "250000.00"
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 48,
    "totalPages": 5
  }
}
```

### 5.2 Format Respons Error
```json
{
  "success": false,
  "message": "Validasi gagal",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "quantity",
      "message": "Kuantitas harus berupa angka positif"
    }
  ]
}
```

### 5.3 Endpoint Utama
- **Auth**:
  - `POST /auth/register` (Public)
  - `POST /auth/login` (Public)
  - `POST /auth/refresh` (HttpOnly Cookie Auth)
  - `POST /auth/logout` (Auth)
  - `GET /auth/google` & `/auth/google/callback` (Google OAuth)
- **Master Data**:
  - `GET`, `POST`, `PUT`, `DELETE` `/products` (CRUD Produk + Soft Delete)
  - `GET`, `POST`, `PUT`, `DELETE` `/suppliers` (CRUD Pemasok)
  - `GET`, `POST`, `PUT`, `DELETE` `/agents` (CRUD Agen)
  - `GET`, `POST`, `PATCH`, `DELETE` `/users` (Manajemen User & Role Update)
- **Transaksi**:
  - `POST /stock-in` (Catat unit masuk + increment stok)
  - `DELETE /stock-in/:id` (Rollback stok masuk - Pimpinan/Admin only)
  - `POST /stock-out` (Catat unit keluar dengan kalkulasi diskon + pengurangan stok FIFO)
  - `DELETE /stock-out/:id` (Rollback stok keluar LIFO - Pimpinan/Admin only)
- **Reports & Dashboard**:
  - `GET /dashboard/summary` (Menampilkan total produk, barang keluar/masuk hari ini, alert stok menipis)
  - `GET /reports/stock-in` & `/reports/stock-out` (Filter range tanggal)

---

## 6. Rencana Pengembangan & Pekerjaan Rumah (Roadmap)

Sistem saat ini sudah stabil di tingkat arsitektur dan modul dasar. Sesi brainstorming dengan Claude dapat difokuskan pada implementasi poin-poin berikut:

### 6.1 Integrasi Paginasi & Search Tabel Frontend
- **Kondisi**: Backend API sudah siap memproses filter query parameter (`?page=...&limit=...&search=...`).
- **Tantangan**: Komponen tabel di Frontend (`apps/web/src/app/dashboard/...`) harus dikembangkan untuk mengirim state query secara dinamis, mengaktifkan loading state per-baris, dan membatasi manipulasi data *local storage* agar tetap konsisten dengan server database.

### 6.2 Standarisasi Mekanisme Soft Delete
- **Kondisi**: Baru tabel `products` dan `discounts` yang menggunakan field `deletedAt` (menggunakan query check `deletedAt: null`).
- **Pekerjaan**: Memperluas ini ke tabel `suppliers`, `agents`, dan `users` untuk memastikan apabila entitas tersebut dihapus oleh admin, riwayat data pada transaksi lama (`StockIn`/`StockOut`) yang merujuk relasinya tidak memicu *Prisma Reference Error* atau crash saat merender halaman riwayat.

### 6.3 Implementasi Pengujian Otomatis (Automated Testing)
- Merancang strategi unit test menggunakan **Jest/Vitest** untuk menguji algoritma krusial seperti:
  - FIFO pengurasan sisa stok barang masuk.
  - Pemulihan sisa stok (LIFO) saat terjadi pembatalan transaksi keluar.
  - Keakuratan kalkulasi pemotongan nilai diskon nominal dan persentase.

---

**Saran Prompt Untuk Claude AI:**
> *"Saya ingin melakukan brainstorming untuk Suti Water System dengan basis monorepo (Next.js + Express.js + Prisma) sesuai dengan spesifikasi dan alur FIFO/LIFO di atas. Mari kita bahas implementasi terbaik untuk [pilih topik: Integrasi Paginasi Frontend / Unit Test Logika FIFO / Strategi Soft Delete untuk Supplier & Agent]."*
