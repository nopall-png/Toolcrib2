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

## ⚠️ Known Limitations (Batasan Sistem)
- **Real-time Stock Updates**: Demi menjaga kompleksitas aplikasi pada skala skripsi (menghindari penggunaan koneksi WebSocket/Supabase Realtime yang berat), pembaruan stok dirancang menggunakan pola **Server-Authoritative Local Update**. Artinya, ketika *Staff Toolcrib* menekan tombol "Approve", stok di layar mereka akan berkurang secara instan sesuai perhitungan *database* (tanpa *refresh*). Namun, jika ada alat/tab lain yang sedang terbuka, *tab* tersebut tidak akan melihat pengurangan stok ini sampai mereka melakukan *refresh* manual (F5). Ini adalah *trade-off* arsitektur yang disengaja.

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
Pada **Fase 3** ini, backend AI dipecah menjadi dua layanan terpisah (Microservices) yang berjalan secara independen, serta menggunakan Model LLM Lokal via Ollama.

#### Persiapan Ollama
Sistem menggunakan Ollama untuk menjalankan LLM (seperti Llama 3 atau Mistral) secara lokal.
Pastikan Ollama sudah terinstal dan berjalan di sistem Anda:
```bash
ollama serve
```

#### A. Backend Predictive (FastAPI - Port 8000)
Backend ini menangani logika prediksi stok (Predictive AI) dan Machine Learning.
```bash
# Masuk ke direktori predictive
cd backend/predictive

# Buat & aktifkan Virtual Environment (Opsional namun disarankan)
python -m venv venv
# Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Jalankan server FastAPI
uvicorn main:app --reload --port 8000
```

#### B. Backend Generative (FastAPI - Port 8001)
Backend ini menangani fungsi Generative AI (Chatbot Asisten, PDF Analysis, dan Retrieval-Augmented Generation / RAG dengan ChromaDB).
```bash
# Buka terminal baru, masuk ke direktori generative
cd backend/generative

# Buat & aktifkan Virtual Environment
python -m venv venv
# Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Jalankan server
python app.py
# (atau: uvicorn app:app --host 0.0.0.0 --port 8001)
```

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
