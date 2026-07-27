# Toolcrib Management System - PT Mattel Indonesia

Sistem Manajemen Toolcrib dan Pengadaan Perkakas (*Requisition & Procurement System*) berbasis Next.js, React, Tailwind CSS, dan Zustand.

---

## 📄 Product Requirements & Design System (PRD)
Dokumentasi lengkap mengenai **Design System (UI/UX), Anti-AI Slop Rules, Cara Kerja Sistem (*System Workflow*), dan Arsitektur Kode** dapat diakses pada file:
👉 **[PRD & Design System (prd.md)](./prd.md)**

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

## 🚀 Jalankan Aplikasi secara Lokal

```bash
# Jalankan server pengembang (Development Server)
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.
