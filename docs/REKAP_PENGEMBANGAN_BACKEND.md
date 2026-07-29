# Rekap Pengembangan Backend & Integrasi AI (Phase 1)

Dokumen ini merupakan log dan rekapitulasi menyeluruh atas pengembangan arsitektur Backend, mesin Data Science (AI), serta integrasi keamanan dan performa yang telah diselesaikan pada fase pertama proyek Toolcrib.

## 1. Pembangunan Mesin Analitik AI (Backend Python)
Kami telah membangun pondasi *Data Science* & Analitik yang sangat kokoh di direktori `backend/ai/`:
- **Data Quality Review (`DATA_QUALITY_REVIEW.md`)**: Melakukan analisis mendalam terhadap kualitas data, mendeteksi duplikat, mengecek konsistensi metrik, dan memvalidasi integritas *database*.
- **`duplicate_detector.py`**: Pembuatan skrip deteksi duplikat otomatis menggunakan *Fuzzy String Matching* untuk membandingkan nama, *brand*, dan spesifikasi barang.
- **`criticality_classifier.py`**: Skrip untuk mendiagnosis skor tingkat kekritisan komponen (A/B/C dan X/Y/Z) berdasarkan nilai *Machine Impact Weight*.
- **`inventory_optimizer.py` & `minmax_optimizer.py`**: Modul yang bertugas menghitung skor kesehatan inventaris, nilai *excess inventory* (stok berlebih), serta merumuskan batas dinamis stok menggunakan analisis Pareto dan teori probabilitas kekurangan stok (*stockout*).
- **`backfill_machine_tools.py`**: Skrip pembersihan dan perbaikan data (*backfill*) untuk memastikan relasi *Many-to-Many* (M2M) antara tabel *Machines* dan *Tools* tidak memiliki *orphan data* atau relasi yang rusak.

## 2. Penambahan API Endpoint (FastAPI)
Seluruh modul *Data Science* Python yang dibuat pada tahap 1 telah "dibungkus" menjadi layanan RESTful API di dalam file `backend/ai/main.py`. Ini memungkinkan *Frontend* (aplikasi web Next.js) untuk memanggil algoritma AI tersebut dengan mudah lewat HTTP *request*.

## 3. Modifikasi Skema Database (Supabase PostgreSQL)
- **Security & Relasi**: Membangun tabel perantara (*junction table*) `machine_tools` untuk pemetaan relasi yang ketat dan memastikan semua entitas diikat dengan tipe data UUID.
- **Penambahan Kolom *Caching* AI**: Menambahkan kolom baru seperti `ai_min_stock`, `ai_max_stock`, `abc_class`, dan `xyz_class` langsung ke tabel master `tools`. Kolom ini menjadi fondasi bagi arsitektur *Hybrid Caching*.

## 4. Perombakan Arsitektur Performa (Sistem Hybrid AI)
Menyadari bahwa pemanggilan API Python secara *real-time* sangat memberatkan *server* dan melambatkan *loading* antarmuka (UI), kami menerapkan sistem **Hybrid Caching**:
- **Data Cepat (*Instant Load*)**: Data analitik seperti kelas ABC/XYZ dan Min-Max tidak lagi diminta ke server Python saat halaman dimuat. Python hanya bertugas menghitung data di belakang layar dan menyimpannya ke kolom *cache* di Supabase. Frontend (`AiInsightsView.tsx`, `api-ai.ts`) kemudian mengambil data langsung dari PostgreSQL Supabase secara instan (dalam hitungan milidetik).
- **Data Berat (*Real-time Forecasting*)**: Komputasi berat yang melibatkan model *Machine Learning/Time Series* (seperti *Prophet Forecast*) tetap memanggil FastAPI Python karena kebutuhannya yang terlalu dinamis untuk di-*cache* sederhana.

## 5. Perbaikan Keamanan & Formulir Autentikasi (Login)
- **User Portal Login (`UserLogin.tsx`)**: Merombak alur *login* yang sebelumnya memakan 2 langkah (pilih departemen -> pilih ID) menjadi 1 langkah praktis. Tampilan diubah dari *dropdown* nama menjadi kolom *input* **"Ketik ID Pegawai"** layaknya sistem input NIK standar industri.
- **Staff Portal Login (`StaffLogin.tsx`)**: Menghapus sistem *Bypass* (login *dummy*). Kami menambahkan kolom `password_hash` ke tabel `users` di Supabase (menggunakan SQL), lalu mengatur *password* valid (seperti `admin123` untuk akun `TC-001` & `PR-001`). *State manager* (`store.tsx`) kemudian diperbarui agar memverifikasi input secara *real-time* ke *database*.

## 6. Perombakan Alur Permintaan Barang (User Request Flow) - Phase 2
Kami telah melakukan restrukturisasi besar-besaran pada alur operasional utama dari User ke Toolcrib agar memenuhi standar *Enterprise*:
- **Pembaruan Skema State Machine (ENUM)**: Migrasi dari status *legacy* ke alur standar industri (`Pending`, `Approved`, `Issued`, `Cancelled`, `Rejected`, `Returned`).
- **RPC Transaksional & ACID Compliant**: Pemotongan dan pengembalian stok barang tidak lagi dilakukan melalui API *Frontend* biasa, melainkan dipindahkan sepenuhnya ke sisi *Database* (PostgreSQL RPC). Ini menggunakan *Row-Level Locking* (`FOR UPDATE`) untuk mengunci baris data saat diproses, mencegah cacat ganda (*double deduction*) atau kebocoran stok saat ada permintaan paralel (*race condition*).
- **Idempotency Guard**: Menanamkan perlindungan agar status yang sama tidak bisa diproses dua kali. Serta mengkonfigurasi `Unique Constraint` pada tabel transaksi historis (`stock_transactions`) untuk mencegah manipulasi data AI.
- **Pemisahan Logika Stok & AI**: Transaksi `Approved` dicatat sebagai barang keluar (`OUT`), sedangkan `Cancelled` dicatat sebagai barang masuk (`IN`). Model *Machine Learning* AI Forecaster di *Backend* Python disetel khusus untuk hanya memvalidasi transaksi `OUT`, memastikan prediksi masa depan tetap murni dan tidak terdistorsi oleh pembatalan pesanan.

---
