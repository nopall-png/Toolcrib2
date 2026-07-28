# AI Predictive Insights - Toolcrib MRO System

Modul ini berisi kecerdasan buatan (AI) yang mendukung **Dashboard MRO (Maintenance, Repair, & Operations)** pada sistem Toolcrib. Pengembangan ini mencakup antarmuka (UI) interaktif di sisi Next.js dan model logika matematika/machine learning di sisi Python FastAPI.

## 🛠️ Apa Saja yang Diubah & Ditambahkan?
1. **Frontend (Next.js):** 
   - Pembuatan 6 Tab UI interaktif untuk Dashboard AI.
   - Perbaikan UX agar data sains mentah (seperti *yhat*, *cosine similarity*) diterjemahkan menjadi bahasa operasional yang mudah dimengerti (Contoh: "Aman", "Pesan Darurat", "Uang Tertahan").
2. **Backend (Python):** 
   - Arsitektur modular AI yang memecah logika ke 5 *engine* (mesin) berbeda.
   - Pembungkus REST API menggunakan FastAPI (`main.py`).
   - Mock Data Provider (`data_provider.py`) yang siap disambungkan ke *Database* PostgreSQL.

> [!WARNING]
> **Data Sintetis (Simulasi)**: Data transaksi historis (`stock_transactions`) di-generate secara sintetis untuk keperluan demo dan presentasi, karena dataset asli tidak menyediakan histori transaksi yang lengkap. Pola dan tanggal transaksi bersifat simulasi (termasuk kuantitas yang di-*generate* secara acak atau berdasarkan tren rekayasa), dan **bukan** data pemakaian aktual pabrik. Harap pertimbangkan hal ini saat mempresentasikan *forecast* dari algoritma Prophet. Apabila sistem ini sudah digunakan secara langsung di pabrik (live), biarkan model ML belajar dari data riil setidaknya selama beberapa bulan.

---

## 🧠 Cara Kerja 6 Mesin AI (Logika Bisnis)

### 1. Deteksi SKU Duplikat (`duplicate_detector.py`)
- **Cara Kerja:** Menggunakan *Machine Learning* NLP (Natural Language Processing) yaitu `SentenceTransformer`. 
- **Logika:** AI tidak sekadar mencocokkan huruf (seperti pencarian biasa), melainkan memahami "makna/semantik" dari nama barang. Kemudian AI menghitung *Cosine Similarity*. Jika kemiripan di atas batas toleransi (misal 60%), AI akan menandainya sebagai potensi duplikat untuk mencegah pembelian barang ganda.

### 2. Klasifikasi ABC/XYZ (`inventory_optimizer.py`)
- **Cara Kerja:** Membagi inventaris berdasarkan nilai finansial (ABC) dan volatilitas pemakaian (XYZ).
- **Logika:** 
  - **Class A:** 20% barang yang menghabiskan 80% uang pabrik (Hukum Pareto). Butuh pengawasan ketat.
  - **Class X, Y, Z:** Mengukur seberapa sering barang ini bergerak menggunakan standar deviasi (CV). X = Stabil, Z = Sangat jarang keluar.

### 3. Min-Max Dinamis (`minmax_optimizer.py`)
- **Cara Kerja:** Mengubah batas stok Minimum dan Maksimum secara otomatis setiap bulan (tidak lagi diketik manual).
- **Logika:** AI mengkalkulasi *Safety Stock* dengan mempertimbangkan rata-rata pemakaian harian (*Daily Usage*) dikalikan dengan lama pengiriman barang (*Lead Time*), ditambah metrik Z-Score (faktor keamanan).

### 4. Mesin Suku Cadang Kritis (`criticality_classifier.py`)
- **Cara Kerja:** Menilai risiko operasional (*Downtime Risk*) jika suatu barang kehabisan stok.
- **Logika:** AI memberikan pembobotan dari berbagai sisi: Dampak mesin mati (40%), Lead Time (25%), dan Pemakaian (35%). Barang sepele seperti sarung tangan tidak akan pernah memicu alarm, namun dinamo utama akan langsung memicu tombol merah "Order Darurat" jika stoknya menipis.

### 5. Prediksi Permintaan / Stock Forecast (`forecaster.py`)
- **Cara Kerja:** Prediksi Time-Series menggunakan model algoritma **Facebook Prophet**.
- **Logika:** AI membaca sejarah pengeluaran barang di masa lalu untuk menebak 5-30 hari ke depan. Prophet menghasilkan tebakan utama (*yhat*) beserta batas toleransi (*lower/upper bound*). Jika pemakaian asli melampaui batas atas, staf gudang akan tahu ada anomali pemakaian di pabrik.

### 6. Peluang Optimalisasi (MRO Dashboard)
- **Cara Kerja:** Menghitung kerugian finansial yang tersembunyi (Uang Beku/Tertahan).
- **Logika:** AI mencari barang yang berstatus `OVERSTOCK` (berlebih) atau `SLOW_MOVING` (mati) dan menghitung harga barang tersebut. Tujuannya adalah menyarankan tim *Purchasing* untuk mengembalikan barang ke *supplier* atau menghapusnya dari katalog agar uang perusahaan tidak terbuang percuma.

---

## 🚀 Langkah Selanjutnya (Untuk Tim Backend)
1. Buka file `backend/ai/data_provider.py`.
2. Hapus data *dummy* statis yang ada di dalamnya.
3. Hubungkan file tersebut ke *Database* PostgreSQL utama menggunakan `SQLAlchemy` atau `psycopg2`.
4. Jalankan server lokal: `pip install -r requirements.txt` lalu jalankan `uvicorn main:app --reload`.
