# Panduan Deployment ke Production (sutiwater.com)

Panduan ini berisi langkah-langkah untuk memindahkan dan menjalankan aplikasi Suti Water System di server VPS/Dedicated (Ubuntu/Debian) Anda yang beralamat di `101.50.1.12`.

## 1. Persiapan Server
Pastikan Anda sudah login ke server via SSH:
```bash
ssh root@101.50.1.12
```

Lalu install **Docker**, **Docker Compose**, dan **Nginx** (Jika belum):
```bash
sudo apt update
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx
```

Aktifkan Docker agar berjalan otomatis saat server restart:
```bash
sudo systemctl enable docker
sudo systemctl start docker
```

## 2. Memindahkan File ke Server
Pindahkan seluruh folder project `suti-water-system` ke dalam server (misalnya ke direktori `/var/www/suti-water-system`). 

Jika Anda menggunakan Git, Anda bisa melakukan `git clone` di server.
```bash
cd /var/www
git clone https://github.com/mvirzhaa/suti-water-system.git
cd suti-water-system
```
*(Jika repository ini bersifat private, pastikan Anda menggunakan Personal Access Token atau SSH Key).*

## 3. Konfigurasi Environment Variables
Di dalam server (di folder `/var/www/suti-water-system`), salin file `.env.production.example` menjadi `.env.production`:
```bash
cp .env.production.example .env.production
nano .env.production
```
Silakan ganti nilai password untuk Database, Redis, dan kunci JWT dengan kata sandi yang aman. Jangan biarkan *default*.

## 4. Build dan Jalankan Docker Compose
Jalankan perintah berikut untuk mengunduh image, melakukan build aplikasi (Frontend & Backend), dan menghidupkan seluruh layanan di latar belakang:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

Setelah selesai, Anda bisa mengecek apakah semuanya berjalan lancar dengan:
```bash
docker ps
```
Anda seharusnya melihat 4 container berjalan: `suti-water-system_web`, `suti-water-system_api`, `suti-water-system_db`, dan `suti-water-system_redis`.

## 5. Menyiapkan Database
Kita perlu melakukan sinkronisasi struktur database (Prisma Push) dan mengisi data awal (Seeding) ke dalam PostgreSQL yang berjalan di Docker:
```bash
# Sinkronisasi schema
docker-compose -f docker-compose.prod.yml exec api npx prisma db push --accept-data-loss

# Seed data (opsional, jika Anda butuh akun awal admin)
docker-compose -f docker-compose.prod.yml exec api npx tsx prisma/seed.ts
```

## 6. Konfigurasi Nginx
Salin template konfigurasi Nginx yang telah dibuat ke direktori Nginx:
```bash
sudo cp nginx/sutiwater.com.conf /etc/nginx/sites-available/sutiwater.com.conf
```

Aktifkan site tersebut dan nonaktifkan default site:
```bash
sudo ln -s /etc/nginx/sites-available/sutiwater.com.conf /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

Cek apakah ada error di konfigurasi Nginx, lalu restart:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

Pada tahap ini, aplikasi seharusnya sudah bisa diakses melalui `http://sutiwater.com` (pastikan A record di DNS domain sutiwater.com sudah diarahkan ke IP `101.50.1.12`).

## 7. Instalasi SSL Gratis (HTTPS)
Untuk mengamankan website Anda dengan HTTPS (Let's Encrypt), jalankan:
```bash
sudo certbot --nginx -d sutiwater.com -d www.sutiwater.com
```
Ikuti instruksi di layar (masukkan email Anda dan setujui ToS). Certbot akan secara otomatis mengubah konfigurasi Nginx Anda untuk mendukung HTTPS dan melakukan perpanjangan sertifikat secara otomatis.

**Selesai!** Aplikasi Anda kini telah online dengan aman di production.
