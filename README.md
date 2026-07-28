# Toolcrib Management System - PT Mattel Indonesia

Sistem Manajemen Toolcrib dan Pengadaan Perkakas (*Requisition & Procurement System*) berbasis Next.js, React, Tailwind CSS, dan Zustand.

---

## 📄 Dokumentasi Arsitektur & Produk
Dokumentasi lengkap mengenai **Design System (UI/UX), Cara Kerja Sistem, dan Arsitektur** dapat diakses pada:
👉 **[PRD & Design System (prd.md)](./prd.md)**
👉 **[Rekap Pengembangan Backend & AI (docs/REKAP_PENGEMBANGAN_BACKEND.md)](./docs/REKAP_PENGEMBANGAN_BACKEND.md)**

---

## 🛠️ Fitur Utama & Peran Pengguna (User Roles)
1. **User (Peminjam Alat)**: Katalog perkakas, keranjang request, dan pelacakan status peminjaman secara *real-time*.
2. **Staff Toolcrib**: Dashboard overview, manajemen Master Data Tools, persetujuan (ACC/Tolak) peminjaman user, dan pengajuan pembelian barang (*Purchase Request*) ke Procurement.
3. **Staff Procurement**: Panel verifikasi dan persetujuan PO (*Approval*), pemesanan ke vendor, serta penerimaan & *restock* stok master data secara otomatis.

---

## 📁 Struktur Folder Utama
```bash
src/
├── components/
│   ├── layout/          # Sidebar & Navigasi Utama
│   ├── staff/
│   │   └── toolcrib/    # Modul Staff Toolcrib (Master Data, User Requests, Dashboard, Add Tool)
│   │       └── procurement/ # Requisition, Purchase History, & Approval Panels
│   └── user/            # Modul User/Peminjam (Catalog, Cart Drawer, Request History)
└── lib/
    ├── mock.ts          # PostgreSQL Schemas & Mock Data
    └── store.tsx        # Zustand Global State Manager
```

---

## 🚀 Cara Menjalankan Aplikasi (Lokal)

Aplikasi ini menggunakan arsitektur *Hybrid* (Next.js Frontend & FastAPI Python Backend). Keduanya harus berjalan bersamaan.

### 1. Menjalankan Backend AI (Python)
Pastikan Anda sudah menginstal Python (disarankan versi 3.9+).
```bash
# Masuk ke direktori backend
cd backend/ai

# Opsional: Buat dan aktifkan Virtual Environment
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Jalankan server FastAPI
uvicorn main:app --reload --port 8000
```
Backend akan berjalan di `http://localhost:8000`.

### 2. Menjalankan Frontend Web (Next.js)
Buka terminal baru di direktori utama (root) proyek `Toolcrib2`.
```bash
# Install dependencies (Node.js & npm dibutuhkan)
npm install

# Jalankan server pengembang (Development Server)
npm run dev
```
Buka **[http://localhost:3000](http://localhost:3000)** pada browser Anda.

### Persyaratan Lingkungan (Environment Variables)
Sistem membutuhkan file `.env.local` di direktori utama (`/Toolcrib2/.env.local`) yang memuat koneksi ke database Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
DATABASE_URL="postgresql://postgres..."
```
