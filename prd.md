# Product Requirements & Design System (PRD)
**Project**: Toolcrib Management System (PT Mattel Indonesia)

Dokumen ini memuat standar desain (UI/UX), prinsip estetika, panduan anti-AI slop, arsitektur kode (Codebase Structure), dan dokumentasi cara kerja sistem (*system workflow*) yang wajib diikuti selama pengembangan aplikasi.

---

## 1. Design System & Aesthetics (UI/UX)

Aplikasi ini menggunakan pendekatan desain yang modern, minimalis (*clean*), dan profesional (khas *enterprise/corporate*).

### A. Palet Warna (Color Palette)
Warna dasar menggunakan kombinasi warna universal dan profesional, menghindari warna-warna mencolok yang tidak standar.
- **Primary (Utama)**: Biru (`blue-600`, `blue-700`). Digunakan untuk aksi utama, tombol simpan, tombol *submit*, dan identitas interaksi utama.
- **Neutral (Netral)**: Abu-abu kebiruan / Slate (`slate-50` hingga `slate-900`). 
  - `slate-50` / `slate-100`: Untuk *background* kartu, tabel, dan area sekunder.
  - `slate-200` / `slate-300`: Untuk garis tepi (*border*).
  - `slate-600` / `slate-800` / `slate-900`: Untuk warna teks (dari teks deskripsi hingga *heading* utama).
- **Semantic Colors (Status)**:
  - **Success**: Emerald (`emerald-600`, `emerald-100`). Digunakan untuk status "Selesai", "Diterima", "Stok Terisi".
  - **Danger/Error**: Merah (`red-600`, `red-50`). Digunakan untuk status "Ditolak", tombol "Hapus", dan peringatan "Stok Menipis".
  - **Warning**: Kuning/Amber (`amber-600`, `amber-100`). Digunakan untuk status "Menunggu Persetujuan" (Pending).

### B. Typography (Huruf & Teks)
Menggunakan *font* Sans-serif modern (bawaan Tailwind seperti Inter/Roboto).
- **Heading/Judul**: `text-xl` atau `text-lg` dipadukan dengan `font-bold` dan warna `text-slate-900`.
- **Body/Deskripsi**: `text-sm` untuk teks bacaan standar, `text-xs` untuk informasi padat seperti di dalam tabel.
- **Data Spesifik (Kode/ID)**: Menggunakan gaya *monospace* (`font-mono`) ukuran `text-[10px]` atau `text-[11px]` agar terlihat rapi dan presisi untuk No. PO, SKU, atau Kode Barang.

### C. Tombol (Buttons)
Semua tombol harus memiliki sudut melengkung (*rounded*) dan transisi *hover* yang lembut.
- **Primary Button (Aksi Utama)**: 
  - *Class*: `bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md px-5 py-2`
  - *Fungsi*: Submit form, konfirmasi pesanan.
- **Secondary Button (Aksi Pendukung)**:
  - *Class*: `bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold rounded-lg px-4 py-2`
  - *Fungsi*: Tambah ke keranjang, aksi di dalam daftar list.
- **Ghost/Cancel Button (Batal/Netral)**:
  - *Class*: `bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl px-4 py-2`
  - *Fungsi*: Menutup pop-up (Batal).

### D. Anti-Pattern: Larangan UI "AI Slop"
- **Dilarang keras menggunakan AI Slop UI**:
  - Dilarang menggunakan gradasi warna ungu/pink neon acak atau oranye mencolok yang khas template generik buatan AI.
  - Dilarang menambahkan animasi berlebihan yang mengganggu kenyamanan pengguna operasional pabrik.
  - Dilarang menggunakan komponen generik yang minim fungsi (*superficial MVP*). UI harus terasa kokoh, kaya data (*high data density*), presisi, dan elegan.
  - Setiap gambar produk wajib relevan dan gambar asli (bukan placeholder kosong atau gambar rusak).

---

## 2. Cara Kerja Sistem (System Workflow & Role Interactions)

Aplikasi Toolcrib Management dirancang untuk mengotomatiskan siklus hidup alat/perkakas di pabrik, mulai dari peminjaman oleh pemohon hingga pengadaan stok ulang oleh tim pengadaan.

### A. Peran Pengguna (User Roles)
1. **User (Peminjam Alat / Operator Divisi)**:
   - Mengakses portal katalog alat Toolcrib.
   - Memilih alat dan menentukan kuantitas yang dibutuhkan.
   - Menambahkan alat ke keranjang pengajuan (*Request Cart*) dan mengirimkan formulir peminjaman beserta catatan keperluan (contoh: No Mold / Line produksi).
   - Memantau status pengajuan secara *real-time* (*Pending* -> *Approved* -> *Issued/Taken* -> *Returned*).

2. **Staff Toolcrib (Penjaga Gudang Alat)**:
   - **Dashboard Overview**: Memantau statistik ringkas (total alat, request pending, alert stok kritis).
   - **Master Data Tools**: Mengelola katalog lengkap alat (stok, lokasi rak & bin, harga satuan, spesifikasi teknis, status stok).
   - **Tambah Tool Baru / Restock**: Menambahkan alat baru ke dalam katalog master data atau melakukan restock manual.
   - **Request dari User (Approval)**: Verifikasi permintaan peminjaman dari User. Penjaga toolcrib bisa menyetujui (ACC), menolak dengan memberikan alasan penolakan, dan mengubah status menjadi "Barang Diambil" saat user mengambil fisik alat di konter gudang.
   - **Request ke Procurement (Requisition)**: Memantau stok yang di bawah batas minimum (diurutkan di posisi paling atas). Dapat mengajukan *Purchase Request (PR)* baik per barang maupun secara kolektif (keranjang pengadaan). Memantau *Riwayat Pembelian (History)*.

3. **Procurement Staff (Bagian Pembelian & Pengadaan)**:
   - **Menerima Request Pembelian**: Menerima pengajuan barang (Purchase Request) dari Staff Toolcrib yang berisi daftar barang apa saja yang harus dibeli berdasarkan request toolcrib.
   - **Tindakan Approval & Pembelian**: 
     - **Diterima** (Approve): Menyetujui permintaan pembelian barang.
     - **Ditolak** (Reject): Menolak permintaan jika anggaran/stok tidak sesuai.
     - **Process**: Mengubah status barang menjadi sedang diproses/dibeli dari vendor.
     - **Sudah dikirim ke toolcrib**: Menandai bahwa barang telah dikirim/diterima oleh toolcrib.
   - **Proses Restock Manual**: Tidak ada otomatisasi penambahan stok. Setelah barang ditandai "Sudah dikirim ke toolcrib", barang tersebut akan diterima secara fisik oleh admin toolcrib, dan admin toolcrib (Staff Toolcrib) wajib memasukkan/menambah jumlah stok barang tersebut ke Master Data secara manual.

### B. Diagram Alur Data (Data Lifecycle)
```
[User Request Flow]
User Katalog -> Keranjang -> Submit Request (Pending) -> Staff Toolcrib ACC (Approved) -> User Ambil Barang (Issued/Taken) -> Dikembalikan (Returned)

[Procurement Requisition Flow]
Master Data Stok Kritis (< Min Stock) -> Staff Toolcrib Cart/Requisition -> Submit PR (Pending Approval) -> Procurement Approval -> Order Vendor -> Terima & Restock (Fulfilled) -> Auto Update Stok Master Data
```

---

## 3. Arsitektur Kode & Struktur File

Kode **TIDAK BOLEH** menumpuk menjadi *monolith* di dalam satu file. Pemisahan wajib dilakukan berdasarkan Role (Peran) dan Fitur (Feature).

### A. Pembagian Berdasarkan Role (Hak Akses)
Struktur folder di `src/components/` dipisah secara ketat:
- `/user/`: Berisi halaman dan komponen khusus User biasa (Peminjam).
  - `UserCatalogView.tsx` (Wrapper Main)
  - `UserCatalogTab.tsx` (Grid & Filter)
  - `UserRequestsTab.tsx` (Riwayat Request User)
  - `UserCartDrawer.tsx` (Drawer Keranjang Peminjaman)
- `/staff/`: Berisi area admin/pekerja, yang kemudian dipecah sub-divisinya:
  - `/staff/toolcrib/`: Fitur khusus penjaga Toolcrib (Master Data, User Requests Approval, Onboarding Dashboard, Add Tool).
  - `/staff/toolcrib/procurement/`: Fitur khusus pengadaan (Procurement Requisition, Approval, History).

### B. Aturan Pemecahan Fitur (Modular Components)
Satu file komponen UI **TIDAK BOLEH** terlalu panjang (maksimal ~250-300 baris). Jika sebuah halaman memiliki banyak fitur, halaman tersebut wajib dipecah:
- **Wrapper Component**: File induk (misal: `ProcurementRequisitionView.tsx`) hanya bertugas membaca *role* dan mengatur Tab/Navigasi. File ini tidak boleh memuat logika UI tabel atau formulir.
- **Panel Component**: Fitur spesifik dibuatkan file sendiri. Contoh:
  - `ToolcribRequisitionPanel.tsx` -> Khusus mengatur keranjang dan list pengadaan.
  - `ToolcribHistoryPanel.tsx` -> Khusus menampilkan tabel histori.
  - `ProcurementApprovalPanel.tsx` -> Khusus menampilkan tabel aksi *approval*.

### C. Manajemen State & Data
- **Global State**: Disimpan di `src/lib/store.tsx` menggunakan Zustand (Store menyimpan state `tools`, `userRequests`, `procurementRequests`, `cart`, dan `session`).
- **Local State**: State yang berhubungan murni dengan UI (seperti Modal Open/Close, Search Query, Tabs) diletakkan murni di komponen yang bersangkutan.
