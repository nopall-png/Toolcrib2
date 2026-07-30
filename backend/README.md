# AI Predictive Insights - Toolcrib MRO System

Modul ini berisi kecerdasan buatan (AI) yang mendukung **Dashboard MRO (Maintenance, Repair, & Operations)** pada sistem Toolcrib. Pengembangan ini mencakup antarmuka (UI) interaktif di sisi Next.js dan model logika matematika/machine learning di sisi Python FastAPI.

## 🛠️ Apa Saja yang Diubah & Ditambahkan?
1. **Frontend (Next.js):** 
   - Pembuatan 6 Tab UI interaktif untuk Dashboard AI.
   - **Fitur Baru (Phase 2):** Kolom pencarian *real-time* di panel AI Duplicate.
   - **Fitur Baru (Phase 2):** Integrasi "Saran Substitusi AI" pada menu *Critical Spares* dan "AI Rebalancing" pada *Dynamic Min-Max* untuk menekan pembelian darurat.
   - Perbaikan UX agar data sains mentah (seperti *yhat*, *cosine similarity*) diterjemahkan menjadi bahasa operasional yang mudah dimengerti (Contoh: "Aman", "Pesan Darurat", "Uang Tertahan").
2. **Backend (Python):** 
   - Arsitektur modular AI yang memecah logika ke 5 *engine* (mesin) berbeda.
   - Pembungkus REST API menggunakan FastAPI (`main.py`).
   - Mock Data Provider (`data_provider.py`) yang siap disambungkan ke *Database* PostgreSQL.

> [!WARNING]
> **Data Sintetis (Simulasi)**: Data transaksi historis (`stock_transactions`) di-generate secara sintetis untuk keperluan demo dan presentasi, karena dataset asli tidak menyediakan histori transaksi yang lengkap. Pola dan tanggal transaksi bersifat simulasi (termasuk kuantitas yang di-*generate* secara acak atau berdasarkan tren rekayasa), dan **bukan** data pemakaian aktual pabrik. Harap pertimbangkan hal ini saat mempresentasikan *forecast* dari algoritma Prophet. Apabila sistem ini sudah digunakan secara langsung di pabrik (live), biarkan model ML belajar dari data riil setidaknya selama beberapa bulan.

---

## 🧠 Cara Kerja Mesin AI (Logika Bisnis)

### 1. Deteksi SKU Duplikat & Cross-Referencing (`duplicate_detector.py`)
- **Cara Kerja:** Menggunakan NLP (`SentenceTransformer`) untuk menghitung *Cosine Similarity* dari teks deskripsi barang.
- **Logika Tambahan:** AI tidak hanya mendeteksi "kesalahan input/dobel", tapi juga digunakan sebagai sistem **Substitusi**. Jika ada barang yang stoknya habis dan berstatus Kritis/Understock, AI akan mencari barang kembar yang stoknya masih banyak, sehingga gudang tidak perlu melakukan PO Darurat.

### 2. Klasifikasi ABC/XYZ (`inventory_optimizer.py`)
- **Cara Kerja:** Membagi inventaris berdasarkan nilai finansial (ABC) dan volatilitas pemakaian (XYZ).
- **Logika:** Class A (20% barang menghabiskan 80% uang), Class X (Stabil), Class Z (Jarang keluar).

### 3. Min-Max Dinamis & AI Rebalancing (`minmax_optimizer.py`)
- **Cara Kerja:** Menghitung *Safety Stock* otomatis dari rata-rata pemakaian dan *Lead Time*.
- **Logika:** Jika AI menemukan barang berstatus **UNDERSTOCK**, AI akan mengecek database apakah ada barang duplikat/mirip yang sedang **OVERSTOCK**. Jika ada, AI menyarankan "Inventory Rebalancing" (geser stok) alih-alih beli baru.

### 4. Mesin Suku Cadang Kritis (`criticality_classifier.py`)
- **Cara Kerja:** Menilai risiko operasional pabrik jika suatu barang habis.
- **Logika:** Menghitung bobot Dampak Mesin Mati (40%), Lead Time (25%), dan Pemakaian (35%). Menghasilkan kelas: `CRITICAL` (Merah), `IMPORTANT` (Kuning), `STANDARD` (Hijau).

### 5. Prediksi Permintaan / Stock Forecast (`forecaster.py`)
- **Cara Kerja:** Prediksi Time-Series menggunakan model algoritma **Facebook Prophet**. Membaca masa lalu untuk menebak 30 hari ke depan (*yhat*, *lower/upper bound*).

### 6. Peluang Optimalisasi (MRO Dashboard)
- **Cara Kerja:** Menghitung kerugian finansial yang tersembunyi.
- **Logika:** Mengalikan stok berlebih (Overstock/Dead Stock) dengan harga beli (Unit Price) untuk menemukan total "Uang Beku" yang bisa dihemat perusahaan.

---

## 🚀 PANDUAN INTEGRASI DATABASE (UNTUK TIM BACKEND - DEDE)

Halo Dede! Agar AI ini bisa beroperasi dengan data asli, kamu perlu menyambungkan `data_provider.py` ke Supabase (PostgreSQL) milikmu. Skema database yang kamu buat sudah sangat bagus, namun tolong tambahkan **3 penyesuaian wajib** berikut di Supabase-mu:

### 1. Buat Tabel Penghubung (Junction Table) untuk Mesin & Suku Cadang
Kolom `required_parts text` di tabel `machines` kurang bagus untuk AI *Critical Spares*. Tolong jalankan perintah ini agar AI tahu alat mana dipakai di mesin mana:
```sql
ALTER TABLE public.machines DROP COLUMN IF EXISTS required_parts;

CREATE TABLE IF NOT EXISTS public.machine_tools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT machine_tools_pkey PRIMARY KEY (id)
);
```

### 2. Tambahkan Kolom Caching AI di Tabel `tools`
Agar aplikasi Next.js tidak *lemot* menunggu Python menghitung jutaan data, kita harus menyimpan hasil hitungan AI secara *asynchronous* ke dalam database:
```sql
ALTER TABLE public.tools 
ADD COLUMN IF NOT EXISTS ai_min_stock integer,         
ADD COLUMN IF NOT EXISTS ai_max_stock integer,         
ADD COLUMN IF NOT EXISTS abc_class character varying(1), 
ADD COLUMN IF NOT EXISTS xyz_class character varying(1); 
```

### 3. Logika Query Transaksi
Saat memprogram `data_provider.py`, ketika AI meminta data "Sejarah Pemakaian Harian" (untuk modul Forecast & Min-Max):
- Tolong `JOIN` tabel `user_request_items` dengan `user_requests`.
- **WAJIB FILTER:** `WHERE status = 'Completed'` (atau status yang menandakan barang sudah sah keluar fisik). Jangan pernah berikan data yang masih berstatus `Pending` kepada mesin AI.

Jika 3 hal di atas sudah disesuaikan, jalankan `pip install -r requirements.txt` dan `uvicorn main:app --reload`. AI sudah siap dipakai!
