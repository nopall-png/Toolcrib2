# PTMI ToolCrib - Backend AI Engine

Dokumentasi ini dibuat khusus untuk memandu tim *Backend* dalam menjalankan, menguji, dan memahami perubahan terbaru pada **Predictive AI Engine** (Phase 4).

## 🚀 Cara Menjalankan Backend

Karena backend menggunakan algoritma Machine Learning (NLP, Pandas, Prophet), **wajib menggunakan Virtual Environment (`venv`)** agar *dependencies* tidak berbenturan dengan sistem utama.

### Langkah-langkah:
1. Buka Terminal (Command Prompt / PowerShell) di folder root proyek `Toolcrib2`.
2. Aktifkan *Virtual Environment* (Jika belum otomatis aktif):
   - **Windows (PowerShell/CMD):**
     ```bash
     .\venv\Scripts\activate
     ```
   - **Mac/Linux:**
     ```bash
     source venv/bin/activate
     ```
3. Pastikan `pip` sudah terinstall dengan paket-paket terbaru:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Jalankan server FastAPI:
   ```bash
   python backend/main.py
   ```
   *(Atau secara spesifik `.\venv\Scripts\python.exe backend/main.py` jika aktivasi venv gagal).*

5. Server akan berjalan di `http://localhost:8000`. Anda bisa melihat dokumentasi API interaktif di:
   - **Swagger UI:** `http://localhost:8000/docs`
   - **ReDoc:** `http://localhost:8000/redoc`

---

## 🛠️ Apa Saja yang Berubah di Phase 4?

Terdapat beberapa pembaruan kritikal yang telah diselesaikan untuk mengoptimalkan performa dan menambal *bug* integrasi:

### 1. Perbaikan Bug `Failed to fetch` & CORS (HTTP 500)
- **Akar Masalah:** Sebelumnya, saat melakukan *fetch* pada endpoint `/api/ai/critical-spares`, `/api/ai/inventory-optimization`, atau `/api/ai/substitutes/`, pandas DataFrame kadang menghasilkan nilai `NaN` (Not a Number) untuk item yang tidak memiliki histori atau data yang lengkap. FastAPI gagal mengubah `NaN` menjadi JSON, sehingga menyebabkan *crash* `500 Internal Server Error` secara diam-diam.
- **Solusi:** Seluruh endpoint sekarang telah dilengkapi dengan sanitasi `NaN` otomatis menggunakan `replace({np.nan: None})` dan fungsi rekursif `sanitize_dict()`. Data `NaN` sekarang berubah menjadi `null` standar JSON.

### 2. Optimasi Payload Duplicate Detection
- **Akar Masalah:** Endpoint `GET /api/ai/duplicates` sebelumnya mengirimkan seluruh bobot perhitungan AI (teks penjelasan, spesifikasi, dan URL foto) yang berukuran mega-byte, sehingga membuat browser *freeze* (nge-lag).
- **Solusi:** Endpoint dipisah menjadi 2 bagian:
  1. `GET /api/ai/duplicates` : Mengirim versi *lightweight* (hanya skor dan action utama).
  2. `GET /api/ai/duplicates/detail/{sku1}/{sku2}` : Mengambil detail lengkap spesifikasi hanya ketika user meng-klik tombol "Details" (Lazy Loading).

### 3. Persistence Duplicate Decisions (Supabase)
- **Endpoint Baru:** `POST /api/ai/duplicate-decisions`
- **Tujuan:** Menyimpan keputusan audit Staff (seperti `MERGE`, `SUBSTITUTE`, `IGNORE`) ke database Supabase agar tidak hilang saat halaman di-*refresh*.
- (Perubahan Frontend terkait: API `recordDuplicateDecision` di `api-ai.ts` sekarang menggunakan format _snake_case_ yang disesuaikan dengan skema Supabase).

### 4. Middleware & Background Tasks
- Menambahkan **Background Auto-Sync** pada startup event FastAPI untuk memuat model *NLP SentenceTransformers* dan meng-*cache* perbandingan matriks di memori secara _asynchronous_. Hal ini mencegah pemblokiran request pada menit-menit pertama server menyala.
