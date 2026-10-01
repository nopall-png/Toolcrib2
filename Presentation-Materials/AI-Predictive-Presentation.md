# PRESENTASI — AI PREDICTIVE INSIGHTS
## PTMI ToolCrib | Showcase Presentation
### Target: Juri Teknis Mattel + General Audience

---

## MAPPING PRESENTASI

### Role dan Fitur

| Role | Fitur yang Dibangun |
|------|---------------------|
| **AI Engineer Generative** | Chatbot AI + Auto-Fill PDF |
| **AI Engineer Predictive** | Duplicate SKU + Critical Spares + Stock Forecast |

> Presentasi ini = **AI Engineer Predictive**

---

## 📌 SLIDE 1: APA YANG SAYA BANGUN

**Script (~30 detik):**

> "Saya sebagai AI Engineer Predictive membangun **3 fitur AI** untuk ToolCrib:
>
> 1. **Duplicate SKU Detection** — deteksi barang yang mungkin duplikat di master data
> 2. **Critical Spares Classification** — klasifikasi barang mana yang kritis jika kosong
> 3. **Stock Forecast** — prediksi kebutuhan stok 30 hari ke depan menggunakan time-series forecasting
>
> Tech stack: **Python + Facebook Prophet** (time-series), **Sentence Transformers** (NLP semantic similarity), **Scikit-learn** (scoring) — semua berjalan di local AI engine, tidak perlu cloud API."

---

## 📌 SLIDE 2: FITUR 1 — CRITICAL SPARES (GAMBARAN)

**Script (~1 menit):**

> "**Critical Spares = Suku Cadang Kritis**
>
> Setiap spare part punya risiko berbeda jika kehabisan stok. Ada yang kalau kosong langsung bikin mesin berhenti — ada yang tidak.
>
> **Pertanyaan kuncinya:**
> - Seberapa sering item ini diminta? *(Usage)*
> - Berapa lama dari pesan sampai datang? *(Lead Time)*
> - Seberapa penting mesin yang bergantung padanya? *(Machine Score)*
>
> AI menjawab ketiganya secara otomatis, lalu menggabungkan jadi **satu skor tunggal** yang menentukan kelas kritikalitas."

---

## 📌 SLIDE 3: CRITICAL SPARES — COMPOSITE SCORE

**Script (~1 menit):**

> "**Rumus Composite Score:**
>
> ```
> Composite Score = (Usage × 35%) + (Lead Time × 25%) + (Machine × 40%)
> ```
>
> **Penjelasan per komponen:**
>
> 1. **Usage Score (35%)** — Seberapa sering item ini diminta dari toolcrib. Item yang sering keluar = score tinggi. Dihitung dari total `Quantity_Issued` dari semua transaksi.
>
> 2. **Lead Time Score (25%)** — Berapa lama dari supplier ke gudang. Item yang lead time panjang = score tinggi. Karena kalau kosong, kita harus tunggu berminggu-minggu.
>
> 3. **Machine Score (40%)** — Seberapa kritis mesin yang bergantung ke item ini. Score tertinggi karena dampak bisnisnya paling besar. Mesin produksi berhenti = output = 0.

> **Kenapa Machine Score paling besar (40%)?**
> Karena downtime mesin itucost-nya paling mahal. Bukan hanya parts-nya — tapi hilangnya produktifitas, deadline yang meleset, dan biaya overtime.

---

## 📌 SLIDE 4: CRITICAL SPARES — 3 KELAS KRITIKALITAS

**Script (~45 detik):**

> "Dari Composite Score, setiap SKU diklasifikasi ke dalam 3 kelas:
>
> | Kelas | Score | Arti | Action |
> |-------|-------|------|--------|
> | 🔴 **CRITICAL** | ≥ 70 | Jika kosong → mesin HALT | PO Darurat, cek gudang setiap hari |
> | 🟡 **IMPORTANT** | 40–69 | Risiko menengah | PO biasa, cek mingguan |
> | 🟢 **STANDARD** | < 40 | Barang umum | Restock normal schedule |
>
> Contoh: Item dengan lead time 21 hari, sering diminta, dan ke mesin CNC kritis → score tinggi → **CRITICAL** → staff otomatis dapat notifikasi dan bisa langsung buat PO Darurat dari UI."

---

## 📌 SLIDE 5: CRITICAL SPARES — UI + FLOW

**Script (~45 detik):**

> "**Di UI, staff melihat:**
>
> - Tabel semua item dengan badge CRITICAL / IMPORTANT / STANDARD
> - **Risk Factor** — alasan AI mengapa item ini diklasifikasikan kritis
> - **Status Stok** — apakah di atas atau di bawah Min Stock
> - **Tombol Order Darurat** — muncul otomatis untuk item CRITICAL yang stoknya di bawah minimum
>
> **Flow di backend:**
> 1. Ambil data SKU + Transaksi + Data Mesin
> 2. Hitung Usage Score, Lead Time Score, Machine Score
> 3. Hitung Composite Score
> 4. Tetapkan kelas kritikalitas
> 5. Kirim ke frontend sebagai JSON
>
> Semua berjalan otomatis setiap kali data di-sync."

---

## 📌 SLIDE 6: FITUR 2 — STOCK FORECAST (GAMBARAN)

**Script (~45 detik):**

> "**Stock Forecast = Prediksi Kebutuhan Stok**
>
> Pertanyaan yang sering muncul: *"Kapan saya harus restock?"*
>
> Sebelum: staff cek gudang → tebak → pesan → kadang telat, kadang terlalu cepat.
>
> Sekarang: AI menganalisis **pola historis transaksi** → prediksi kebutuhan 30 hari ke depan → staff tahu persis kapan dan berapa banyak harus pesan.
>
> **Model yang dipakai: Facebook Prophet**
> Prophet adalah library time-series forecasting dari Meta (Facebook). Dirancang untuk data bisnis yang punya pola musiman — cocok untuk toolcrib yang pemakaiannya fluktuatif."

---

## 📌 SLIDE 7: STOCK FORECAST — CARA KERJA

**Script (~1 menit):**

> "**Proses 4 Tahap:**
>
> **Tahap 1 — Data Preparation**
> Ambil semua transaksi untuk 1 SKU. Kelompokkan per hari: jumlah total `Quantity_Issued` per tanggal.
>
> **Tahap 2 — Time-Series Modeling (Prophet)**
> Prophet memodelkan data sebagai:
> `Data = Trend + Weekly Seasonality + Noise`
> - **Trend** — apakah permintaan naik, turun, atau stagnan?
> - **Weekly Seasonality** — apakah ada pola mingguan? (misal: Senin banyak request, Jumat jarang)
> - **Noise** — fluktuasi random yang tidak bisa dijelaskan
>
> **Tahap 3 — Forecasting**
> Model memproyeksikan 30 hari ke depan → menghasilkan:
> - `Expected_Demand` — angka prediksi permintaan
> - `Lower_Bound` — estimasi minimum
> - `Upper_Bound` — estimasi maksimum (toleransi)
>
> **Tahap 4 — Insight Generation**
> AI otomatis memberikan saran berdasarkan angka prediksi:
> - WARNING: Prediksi > 5 unit/hari → Siapkan stok ekstra
> - NORMAL: Prediksi 1–5 unit/hari → Stok saat ini cukup
> - LOW: Prediksi < 1 unit/hari → Tahan pembelian baru

---

## 📌 SLIDE 8: STOCK FORECAST — OUTPUT & UI

**Script (~45 detik):**

> "**Output API ke frontend:**
>
> Setiap SKU menghasilkan array 30+ hari ke depan:
> ```json
> {
>   "Date": "2026-10-15",
>   "Expected_Demand": 3.2,
>   "Lower_Bound": 1.5,
>   "Upper_Bound": 5.8,
>   "Trend_Status": "NORMAL",
>   "Insight": "Permintaan stabil. Pertahankan stok saat ini."
> }
> ```
>
> **Di UI, staff melihat:**
> - **Grafik Area Chart** — garis prediksi + zona toleransi
> - **Tabel harian** — tanggal, angka prediksi, range, dan saran AI
> - **Dropdown SKU** — bisa pilih barang mana yang mau diprediksi
>
> Staff bisa plan restock berdasarkan data, bukan tebakan."

---

## 📌 SLIDE 8b: STOCK FORECAST — FLOW DI BACKEND

**Script (~30 detik):**

> "**Flow teknis Stock Forecast:**
>
> 1. Frontend kirim `sku_id` + `days` (default 30) ke `/api/ai/forecast/{sku_id}`
> 2. Backend ambil semua transaksi untuk SKU tersebut
> 3. Validasi: minimal 2 transaksi → kalau kurang, return empty
> 4. Kelompokkan per hari: `date → sum(Quantity_Issued)`
> 5. Ubah format ke DataFrame: kolom `ds` (date), `y` (qty)
> 6. Inisialisasi Prophet dengan `weekly_seasonality=True`
> 7. `model.fit(df)` — training model
> 8. `model.predict(future_df)` — proyeksi N hari ke depan
> 9. Extract `yhat` (expected), `yhat_lower`, `yhat_upper`
> 10. Apply insight rules: WARNING/NORMAL/LOW
> 11. Return JSON ke frontend → render chart + table"

---

## 📌 SLIDE 9: IMPACT & SKILLS

**Script (~45 detik):**

> "**Impact ke ToolCrib PT Mattel:**
>
> | Sebelum | Sesudah |
> |---------|---------|
> | Staff tebak-buta kapan harus restock | AI prediksi 30 hari ke depan |
> | Critical spares tidak diprioritaskan | Otomatis klasifikasi CRITICAL / IMPORTANT / STANDARD |
> | Mesin pernah berhenti karena parts kosong | PO Darurat otomatis muncul untuk item kritis |
> | Stok berlebih atau justru sering kosong | Reorder point berdasarkan data aktual |
>
> **Skills yang saya kuasai:**
> - **Time-Series Forecasting** — Facebook Prophet, tren & musiman analysis
> - **Statistical Scoring** — composite score dengan bobot yang bisa di-tune
> - **NLP / Semantic Similarity** — sentence transformers, cosine similarity
> - **FastAPI** — REST API untuk AI engine
> - **React Integration** — chart visualization (Recharts), real-time UI"

---

## 📌 SLIDE 10: CLOSING

**Script (~15 detik):**

> "Terima kasih. Saya siap untuk pertanyaan."

---

## 💬 Q&A PERSIAPAN — CRITICAL SPARES

### Q1: Kenapa Machine Score punya bobot tertinggi (40%)?
> "Karena cost downtime mesin itu paling besar. Bukan hanya harga parts-nya — tapi produktifitas yang hilang, deadline yang meleset, biaya overtime. Jadi mesin kritis harus jadi prioritas tertinggi."

### Q2: Dari mana data Machine Score?
> "Dari data mesin di database. Setiap mesin punya skor produktifitas — mesin yang sering jalan punya score tinggi, mesin yang sering idle score rendah. Item yang ke mesin produktif = Machine Score tinggi."

### Q3: Kalau item CRITICAL tapi stoknya masih aman — tetap harus order?
> "Belum. Sistem hanya trigger PO Darurat kalau item CRITICAL DAN stok sudah di bawah reorder point. Jadi tidak over-order."

### Q4: Bagaimana jika lead time berubah?
> "Composite Score dihitung ulang setiap kali data di-sync. Jadi kalau lead time supplier berubah, score otomatis update."

---

## 💬 Q&A PERSIAPAN — STOCK FORECAST

### Q5: Kenapa pakai Prophet, bukan model lain?
> "Prophet cocok untuk data bisnis yang punya pola musiman dan trend. Toolcrib transactions punya weekly seasonality — hari kerja vs weekend. Prophet menangkap itu dengan baik dan automatis, tanpa perlu feature engineering yang kompleks."

### Q6: Berapa akurat forecast-nya?
> "Forecast memberi tiga angka: `Expected_Demand` (tengah), `Lower_Bound` (minimum), `Upper_Bound` (maksimum). Staff tidak harus percaya angka tengah saja — range memberi toleransi. Semakin jauh ke depan, range semakin lebar — ini normal untuk semua time-series model."

### Q7: Bagaimana kalau data transaksi untuk 1 SKU sangat sedikit?
> "Jika data kurang dari 2 hari transaksi, Prophet tidak bisa modeling — akan return empty. Ini desain: tidak mau memberikan prediksi yang salah karena kurang data. Staff tetap harus cek manual."

### Q8: Bisa forecast lebih dari 30 hari?
> "Bisa. Parameter `days` di API bisa diatur 7–365 hari. Tapi semakin jauh, semakin lebar confidence interval — karena ketidakpastian makin besar."

### Q9: Kamu focus di Predictive AI — bedanya sama Generative AI apa?
> "**Generative AI** = membuat sesuatu yang baru (chatbot menjawab pertanyaan, auto-fill membuat dokumen). **Predictive AI** = menganalisis data historis untuk预测 masa depan (forecast, classification, anomaly detection). Toolcrib butuh keduanya — staff butuh jawaban cepat (Generative) dan planning berbasis data (Predictive)."

---

## 🗂️ REFERENSI KODE

### Backend Files

| File | Fungsi |
|------|--------|
| `backend/predictive/criticality_classifier.py` | Hitung composite score & klasifikasi kritikalitas |
| `backend/predictive/forecaster.py` | Time-series forecast pakai Prophet |
| `backend/predictive/predictive_ai.py` | FastAPI endpoints untuk kedua fitur |
| `backend/predictive/duplicate_detector.py` | NLP-based duplicate SKU detection |
| `backend/predictive/minmax_optimizer.py` | ABC/XYZ classification + dynamic Min/Max |

### Frontend Components

| File | Fungsi |
|------|--------|
| `src/components/staff/toolcrib/ai_insights/CriticalSparesTab.tsx` | UI Critical Spares |
| `src/components/staff/toolcrib/ai_insights/StockForecastTab.tsx` | UI Stock Forecast |
| `src/components/staff/toolcrib/ai_insights/DuplicateDetectionTab.tsx` | UI Duplicate SKU |
| `src/lib/api-ai.ts` | API client untuk semua AI endpoints |

### API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/ai/critical-spares` | Ambil daftar item + skor kritikalitas |
| GET | `/api/ai/forecast/{sku_id}?days=30` | Forecast 1 SKU |
| GET | `/api/ai/duplicates?threshold=0.40` | Deteksi duplikat SKU |
| GET | `/api/ai/minmax` | Dynamic Min/Max + ABC/XYZ |

---

## 📐 RUMUS CEPAT — CRITICAL SPARES

```
Composite Score = (Usage × 0.35) + (Lead_Time × 0.25) + (Machine × 0.40)

Usage Score    = (Total_Issued_SKU / Max_Issued_Semua_SKU) × 100
Lead_Time     = (Lead_Time_SKU / Max_Lead_Time_Semua_SKU) × 100
Machine Score = dari data mesin (di database)

Kelas:
  CRITICAL   → Composite Score ≥ 70
  IMPORTANT   → Composite Score 40–69
  STANDARD    → Composite Score < 40
```

---

## 📐 RUMUS CEPAT — STOCK FORECAST

```
Model: Facebook Prophet
Data input: transaksi harian per SKU (Date + Quantity_Issued)
Output: 30–365 hari ke depan

Forecast = Trend + Weekly_Seasonality + Noise

Insight Rules:
  Expected_Demand > 5  → WARNING — Siapkan stok ekstra
  Expected_Demand 1–5  → NORMAL — Stok cukup
  Expected_Demand < 1  → LOW    — Tahan pembelian
```

---

*File ini dibuat sebagai script、南 untuk presentasi AI Predictive Insights — Critical Spares & Stock Forecast.*

---

### Kenapa Local AI?

> Semua model (Prophet, Sentence Transformers) berjalan **100% local** — tidak ada API call ke cloud, tidak ada biaya langganan, data tidak keluar server. Ini cocok untuk environment factory/industri yang punya kebijakan data security ketat.

---

## ⚙️ TECH STACK — RINGKASAN PER FITUR

### 1. CRITICAL SPARES

| Komponen | Teknologi | Guna |
|----------|-----------|------|
| **Backend** | `scikit-learn` | Normalisasi Usage Score & Lead Time Score ke 0–100 |
| **Backend** | `numpy` | Perhitungan composite score |
| **Backend** | `pandas` | Group transaksi per SKU, hitung total issued |
| **Backend File** | `criticality_classifier.py` | Hitung: Usage Score + Lead Time Score + Machine Score |
| **Frontend** | `React + TypeScript` | Tampilkan badge CRITICAL / IMPORTANT / STANDARD |
| **Frontend** | `Tailwind CSS` | Badge warna: merah/kuning/hijau |
| **API Endpoint** | `GET /api/ai/critical-spares` | Kirim data ke frontend |

### 2. STOCK FORECAST

| Komponen | Teknologi | Guna |
|----------|-----------|------|
| **Backend** | `prophet` (Meta/Facebook) | Time-series modeling: trend + weekly seasonality + noise |
| **Backend** | `pandas` | Group transaksi harian, prepare DataFrame untuk Prophet |
| **Backend File** | `forecaster.py` | Prophet fit → predict 30 hari → generate insight |
| **Frontend** | `React + TypeScript` | Dropdown SKU, render chart + table |
| **Frontend** | `Recharts` | Line chart / area chart untuk visualisasi forecast |
| **Frontend** | `Axios` | HTTP client ke `/api/ai/forecast/{sku_id}` |
| **API Endpoint** | `GET /api/ai/forecast/{sku_id}?days=30` | Proyeksi N hari ke depan |

### 3. DUPLICATE SKU

| Komponen | Teknologi | Guna |
|----------|-----------|------|
| **Backend** | `sentence-transformers` | Ubah teks deskripsi jadi vector embedding |
| **Backend** | `scikit-learn` | Hitung cosine similarity antar vector |
| **Backend** | `ChromaDB` | Cache vector embeddings agar tidak encode ulang |
| **Backend File** | `duplicate_detector.py` | Rich description → encode → similarity → action |
| **Frontend** | `React + TypeScript` | Tabel hasil deteksi, panel detail, filter action |
| **Frontend** | `Tailwind CSS` | Card layout, white-space pre-line untuk teks wrapping |
| **API Endpoint** | `GET /api/ai/duplicates?threshold=0.40` | Kirim daftar pasangan kandidat |
| **API Endpoint** | `GET /api/ai/substitutes/{sku_id}` | Cari item pengganti otomatis |

### SHARED (Semua Fitur)

| Komponen | Teknologi | Guna |
|----------|-----------|------|
| **Backend** | `FastAPI` | REST API untuk semua endpoints |
| **Database** | `PostgreSQL (Supabase)` | Master data SKU, transaksi, data mesin |
| **Frontend** | `React + TypeScript` | Tab navigation antar fitur |
| **Frontend** | `Axios` | HTTP client ke semua API endpoints |
| **Frontend** | `Tailwind CSS` | Styling umum |

