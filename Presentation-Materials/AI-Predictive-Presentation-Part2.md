# PRESENTASI — AI PREDICTIVE INSIGHTS (BAGIAN 2)
## Duplicate SKU · ABC/XYZ · Dynamic Min-Max · Optimization
## PTMI ToolCrib | Showcase Presentation
### Target: Juri Teknis Mattel + General Audience

---

## 📌 SLIDE 1: OVERVIEW — 4 FITUR YANG AKAN DIBAHAS

**Script (~30 detik):**

> "Selain Critical Spares dan Stock Forecast, saya juga membangun 4 fitur lain di AI Insights module:
>
> 1. **Duplicate SKU Detection** — deteksi barang yang merupakan duplikat di master data
> 2. **ABC/XYZ Classification** — kategorisasi barang berdasarkan nilai dan pola permintaan
> 3. **Dynamic Min-Max Engine** — batas stok minimum & maksimum yang adaptif
> 4. **Inventory Optimization** — rekomendasi tindakan otomatis untuk hemat anggaran
>
> Tech stack: **Python + FastAPI** (API backend), **Sentence Transformers** (NLP semantic similarity), **NumPy + Pandas** (statistical calculation) — semua berjalan di local AI engine, tidak perlu cloud API."

---

## =========================================================
## BAGIAN A: DUPLICATE SKU DETECTION
## =========================================================

---

## 📌 SLIDE 2: DUPLICATE SKU — PROBLEM STATEMENT

**Script (~45 detik):**

> "**Problem: Master data toolcrib tidak bersih**
>
> Dalam master data, sering ada barang yang sama tapi terdaftar dengan nama berbeda. Contoh:
> - SKU WR-001: 'Wrench Set 8-19mm Chrome Vanadium'
> - SKU WR-002: 'Combination Wrench 8-19mm CV Steel'
>
> Tanpa AI, staff tidak akan sadar ini barang yang sama.
>
> **Dampaknya:**
> - Budget procurement terbuang — beli barang yang sudah ada
> - Gudang penuh dengan barang redundan
> - Report tidak akurat
> - Stok tidak terpantau"

---

## 📌 SLIDE 3: DUPLICATE SKU — CARA KERJA (3 TAHAP)

**Script (~1.5 menit):**

> "**Sistem mendeteksi duplikat dalam 3 tahap:**
>
> **Tahap 1 — Rich Description Build**
> Deskripsi setiap SKU digabung jadi satu teks kaya:
> `Nama barang + Kategori + Spesifikasi teknis + Brand`
>
> Contoh:
> 'Wrench Set 8-19mm. Kategori: Hand Tools. Spesifikasi: Material: Chrome Vanadium, Size: 8-19mm. Merek: Pro-Ikit.'
>
> **Tahap 2 — NLP Semantic Embedding**
> Teks tadi diubah jadi vektor angka pakai model **Sentence Transformer** (paraphrase-multilingual-MiniLM-L12-v2).
>
> Model ini multibahasa — bisa Bahasa Indonesia, Inggris, dll. Teks yang mirip secara makna → punya vektor yang berdekatan.
>
> **Tahap 3 — Cosine Similarity Comparison**
> Semua pasangan SKU dibandingkan. Skor kemiripan dihitung pakai cosine similarity.
> Di atas threshold 40% → masuk kandidat duplikat.
>
> Ada juga filter kritis: jika ada perbedaan dimensi/spesifikasi lebih dari toleransi, skor diturunkan 40% agar tidak salah klasifikasi."

---

## 📌 SLIDE 4: DUPLICATE SKU — 4 AKSI REKOMENDASI

**Script (~1 menit):**

> "Untuk setiap pasangan yang terdeteksi, AI memberikan 1 dari 4 rekomendasi:
>
> **🔵 MERGE** — Similarity ≥ 85%, spesifikasi cocok, kategori sama
> → Staff cek gudang → gabungkan stok → hapus SKU duplikat
> → Untuk item yang sama-sama kosong atau redundan
>
> **🟢 SUBSTITUTE** — Item kosong + ada item pengganti berstok
> → Gunakan item kedua sebagai pengganti sementara
> → Staff tidak perlu pesan baru
> → Ini yang paling sering terjadi di production floor
>
> **⚪ KEEP SEPARATE** — Specs kritis beda / keduanya ada stok
> → Simpan sebagai item berbeda — AI merekomendasikan TIDAK digabung
>
> **🟡 REVIEW** — Similarity rendah atau ambigu
> → Staff harus cek gudang manual untuk memastikan"

---

## 📌 SLIDE 5: DUPLICATE SKU — FITUR CARI SUBSTITUSI

**Script (~45 detik):**

> "**Fitur bonus: Cari Substitusi Otomatis**
>
> Staff tinggal input SKU item yang kosong → AI langsung cari kandidat pengganti.
>
> Kriteria kandidat:
> - Similarity ≥ 40% secara semantik
> - Stok tersedia (> 0 unit)
> - Tidak ada perbedaan spesifikasi kritis
>
> Output diurutkan:
> 1. **Strongly Recommended** — Similarity ≥ 85%, specs cocok, stok aman
> 2. **Consider** — Similarity ≥ 60%, specs cukup cocok
> 3. **Last Resort** — Similarity ≥ 40%, hanya jika tidak ada opsi lain
>
> Semua keputusan staff (MERGE / SUBSTITUTE / KEEP) dicatat di database untuk audit trail."

---

## 📌 SLIDE 6: DUPLICATE SKU — FLOW DI BACKEND

**Script (~30 detik):**

> "**Flow teknis:**
>
> 1. Load semua SKU dari master data
> 2. Build rich description untuk setiap SKU
> 3. Encode jadi vector embedding (cache agar tidak encode ulang)
> 4. Hitung cosine similarity matrix
> 5. Filter pasangan yang di atas threshold
> 6. Apply spec mismatch penalty
> 7. Tentukan aksi rekomendasi
> 8. Kirim ke frontend sebagai JSON
>
> Ada cache di memory — jika data tidak berubah, hasil tidak perlu dihitung ulang."

---

## =========================================================
## BAGIAN B: ABC/XYZ CLASSIFICATION
## =========================================================

---

## 📌 SLIDE 7: ABC/XYZ — APA ITU?

**Script (~1 menit):**

> "**ABC/XYZ = framework klasik inventory management**
>
> Dua klasifikasi berbeda yang digabungkan:
>
> **ABC = Kategorisasi Berdasarkan Nilai (Moneter)**
> Prinsip Pareto: 20% barang menyumbang 80% nilai.
>
> - **Kelas A** — 80% nilai total. Item paling penting. Kontrol ketat, cek sering.
> - **Kelas B** — 15% nilai total. Item menengah. Kontrol standar.
> - **Kelas C** — 5% nilai total. Item paling sedikit nilai. Kontrol longgar.
>
> Cara hitung: Urutkan barang dari Total_Value tertinggi ke terendah. Total_Value = Total_Issued × Unit_Price.
>
> **XYZ = Kategorisasi Berdasarkan Pola Permintaan**
> - **Kelas X** — Permintaan sangat stabil. CV (Coefficient of Variation) ≤ 0.5. Mudah diprediksi, safety stock minim.
> - **Kelas Y** — Fluktuatif/musiman. CV 0.5–1.0. Butuh safety stock ekstra.
> - **Kelas Z** — Sangat acak. CV > 1.0. Sulit diprediksi, butuh pengawasan ekstra."

---

## 📌 SLIDE 8: ABC/XYZ — RUMUS CEPAT

**Script (~30 detik):**

> "**Rumus ABC:**
>
> Urutkan semua item berdasarkan Total_Value (Qty × Price) descending.
> ```
> Cum% = cumulative_sum(Total_Value) / sum(Total_Value)
>
> A → Cum% ≤ 80%
> B → 80% < Cum% ≤ 95%
> C → Cum% > 95%
> ```
>
> **Rumus XYZ:**
>
> Hitung Coefficient of Variation per bulan:
> ```
> CV = std_dev(monthly_demand) / mean(monthly_demand)
>
> X → CV ≤ 0.5   (stabil)
> Y → 0.5 < CV ≤ 1.0  (fluktuatif)
> Z → CV > 1.0    (acak)
> ```
>
> Setiap item punya 2 huruf: AX, BY, CZ, dll. AX = barang paling bernilai dan paling stabil."

---

## 📌 SLIDE 9: ABC/XYZ — KENAPA PENTING?

**Script (~45 detik):**

> "**Manfaat untuk PT Mattel:**
>
> Dengan ABC → staff tahu item mana yang paling expensive. Jadi:
> - Kelas A: cek gudang tiap hari, order dari vendor terpercaya
> - Kelas B: cek mingguan
> - Kelas C: cukup monthly review
>
> Dengan XYZ → staff tahu item mana yang sulit diprediksi:
> - X: bisa trust forecast, safety stock rendah
> - Z: forecast unreliable, jaga stok lebih tinggi atau siap pesan cepat
>
> **Kombinasi ABC + XYZ:**
> - AX: Prioritas tertinggi — mahal, stabil → kontrol super ketat
> - CZ: Prioritas terendah — murah, acak → review jarang
>
> Di UI, staff bisa filter: 'Tampilkan hanya Kelas A' atau 'Tampilkan hanya XYZ-Z'."

---

## 📌 SLIDE 9b: ABC/XYZ — FLOW DI BACKEND

**Script (~30 detik):**

> "**Flow teknis ABC:**
>
> 1. Ambil semua transaksi SKU → hitung `Total_Value = Qty_Issued × Unit_Price`
> 2. Urutkan descending, hitung cumulative percentage
> 3. Tentukan kelas ABC: A ≤ 80%, B ≤ 95%, C > 95%
>
> **Flow teknis XYZ:**
>
> 1. Ambil transaksi per bulan → hitung `mean` dan `std_dev` per SKU
> 2. Hitung `CV = std_dev / mean`
> 3. Tentukan kelas XYZ: X ≤ 0.5, Y ≤ 1.0, Z > 1.0
>
> **Flow Dynamic Min-Max:**
>
> 1. Untuk setiap SKU, hitung `Daily_Demand = Total_Qty / Actual_Days`
> 2. Ambil `Lead_Time` dan `Criticality` dari data SKU
> 3. Apply Safety Factor → hitung `Dynamic_Min = ceil(Daily × LT × SF)`
> 4. Hitung `Dynamic_Max = ceil(Min + Daily × 30)`
> 5. Bandingkan `Current_Stock` vs Min/Max → tentukan status"

---

## =========================================================
## BAGIAN C: DYNAMIC MIN-MAX ENGINE
## =========================================================

---

## 📌 SLIDE 10: DYNAMIC MIN-MAX — APA ITU?

**Script (~1 menit):**

> "**Min-Max = batas stok minimum dan maksimum untuk setiap item.**
>
> Konsep tradisional: Min dan Max statis, di-set manual, jarang berubah.
> Masalahnya: tidak mengikuti pola aktual permintaan.
>
> **Dynamic Min-Max = AI menghitung batas optimal secara otomatis:**
>
> **Min (ROP = Reorder Point):**
> `Min = (Daily_Demand × Lead_Time) × Safety_Factor`
>
> - Daily_Demand = Total_Issued / Hari_Data
> - Lead_Time = durasi pengiriman dari supplier
> - Safety_Factor = 1.2–2.0 tergantung kritikalitas item
>
> **Max:**
> `Max = Min + (Daily_Demand × 30 hari)`
>
> Arti praktisnya: **jika stok ≤ Min → pesan sampai ke Max.**
>
> Min dan Max berubah jika pola permintaan berubah."

---

## 📌 SLIDE 11: DYNAMIC MIN-MAX — RUMUS

**Script (~30 detik):**

> "**Rumus lengkap:**
>
> ```
> Daily_Demand = Total_Qty_Issued / Actual_Days
>
> Safety_Factor:
>   Kritikalitas HIGH  → 2.0
>   Kritikalitas MEDIUM → 1.5
>   Kritikalitas LOW   → 1.2
>
> Dynamic_Min_ROP = ceil(Daily_Demand × Lead_Time × Safety_Factor)
>
> Dynamic_Max = ceil(Dynamic_Min_ROP + Daily_Demand × 30)
> ```
>
> Contoh:
> - Item: wrench, permintaan 180 unit/tahun, Lead Time 7 hari, Kritikalitas MEDIUM
> - Daily_Demand = 180 / 365 = 0.49 unit/hari
> - Safety_Factor = 1.5
> - **Min = ceil(0.49 × 7 × 1.5) = ceil(5.15) = 6 unit**
> - **Max = ceil(6 + 0.49 × 30) = ceil(20.7) = 21 unit**
>
> → Jika stok ≤ 6 unit → pesan. Pesan sampai stok = 21 unit."

---

## 📌 SLIDE 12: DYNAMIC MIN-MAX — STATUS DI UI

**Script (~45 detik):**

> "**Di UI, setiap item menunjukkan:**
>
> | Status | Kondisi | Warna |
> |--------|---------|-------|
> | **OPTIMAL** | Min ≤ Stok ≤ Max | 🟢 Hijau |
> | **UNDERSTOCK** | Stok < Min | 🔴 Merah |
> | **OVERSTOCK** | Stok > Max | 🟡 Kuning |
> | **SLOW_MOVING** | Kelas CZ + stok berlebih | 🐢 Abu-abu |
>
> Staff bisa tekan **'Hitung Ulang AI'** untuk recalculate semua Min-Max berdasarkan data terbaru.
>
> **Keunggulan Dynamic vs Static:**
> - Static Min-Max → perlu update manual setiap ada perubahan pola
> - Dynamic → recalculate otomatis saat data di-sync
> - Min-Max berubah mengikuti growth/demand pattern"

---

## =========================================================
## BAGIAN D: INVENTORY OPTIMIZATION
## =========================================================

---

## 📌 SLIDE 13: OPTIMIZATION — APA ITU?

**Script (~1 menit):**

> "**Optimization = AI mencari peluang menghemat anggaran inventaris.**
>
> Setiap item yang tidak dalam kondisi OPTIMAL → dianggap sebagai peluang optimasi.
>
> **3 Tipe Peluang:**
>
> **📦 OVERSTOCK** — Stok > Max
> → Berarti uang tertahan di gudang. Bisa dikembalikan ke vendor atau dijual.
> → Nilai dampak = (Stok - Max) × Unit_Price
>
> **📉 UNDERSTOCK** — Stok < Min
> → Berarti risiko mesin berhenti kalau tidak segera dipesan.
> → Nilai dampak = (Min - Stok) × Unit_Price
>
> **🐢 SLOW MOVING** — Item CZ (murah, acak) yang stok berlebih
> → Barang mati di gudang. Bisa dihapus dari katalog.
> → Cost = Stok × Unit_Price

---

## 📌 SLIDE 14: OPTIMIZATION — CONTOH & IMPACT

**Script (~45 detik):**

> "**Contoh nyata:**
>
> Item OVERSTOCK:
> - SKU: WR-015, Stok: 50 unit, Max: 20 unit
> - Excess: 30 unit × Rp 45.000 = **Rp 1.350.000 uang tertahan**
> → Saran: Return ke vendor atau jual
>
> Item UNDERSTOCK:
> - SKU: CNC-BIT-003, Stok: 2 unit, Min: 15 unit
> - Shortage: 13 unit × Rp 120.000 = **Rp 1.560.000 risiko downtime**
> → Saran: PO Segera
>
> Di UI, staff bisa filter OVERSTOCK / UNDERSTOCK / SLOW MOVING.
> Setiap tindakan bisa ditandai 'Sudah Dieksekusi' untuk tracking."

---

## 📌 SLIDE 14b: OPTIMIZATION — FLOW DI BACKEND

**Script (~30 detik):**

> "**Flow teknis Optimization:**
>
> 1. Ambil hasil Dynamic Min-Max (Min, Max per SKU)
> 2. Ambil `Current_Stock` dan `Unit_Price` dari master data
> 3. Ambil hasil ABC/XYZ Classification
> 4. Untuk setiap SKU, evaluasi kondisi:
>
> | Kondisi | Aksi | Rumus |
> |---------|------|-------|
> | `Stok > Max` | **OVERSTOCK** | Excess_Qty = Stok - Max |
> | `Stok < Min` | **UNDERSTOCK** | Shortage_Qty = Min - Stok |
> | `ABC=C + XYZ=Z + Stok > Max` | **SLOW_MOVING** | Cost = Stok × Price |
> | Lainnya | **OPTIMAL** | — |
>
> 5. Hitung `Excess_Value / Shortage_Value` = Qty × Unit_Price
> 6. Kirim daftar peluang ke frontend, diurutkan berdasarkan nilai dampak terbesar"

---

## 📌 SLIDE 15: KONEKSI ANTAR-FITUR

**Script (~30 detik):**

> "**Keempat fitur ini saling terhubung:**
>
> ```
> ABC/XYZ Classification
>     ↓
> Dynamic Min-Max (Min & Max berdasarkan ABC class)
>     ↓
> Optimization (Bandingkan Stok vs Min-Max)
>     ↓
> Critical Spares (Prioritas berdasarkan criticality)
>     ↓
> Duplicate SKU (Cek duplikat → kurangi redundansi)
>     ↓
> Stock Forecast (Prediksi 30 hari ke depan)
> ```
>
> Hasil akhirnya: **Toolcrib yang efisien, staff yang produktif, mesin yang tidak pernah berhenti.**

---

## 📌 SLIDE 16: IMPACT & SKILLS

**Script (~45 detik):**

> "**Impact ke ToolCrib PT Mattel:**
>
> | Sebelum | Sesudah |
> |---------|---------|
> | Min-Max di-set manual, jarang update | AI hitung ulang otomatis |
> | OVERSTOCK tidak terdeteksi | Langsung terlihat + nilai uang tertahan |
> | UNDERSTOCK baru ketahuan setelah kosong | AI flag sebelum kritis |
> | Barang duplikat menumpuk di gudang | AI deteksi & kasih rekomendasi |
> | Focus tidak jelas | ABC/XYZ memberikan prioritas |
>
> **Skills yang saya kuasai:**
> - **ABC/XYZ Analysis** — Pareto principle, coefficient of variation
> - **Inventory Math** — ROP, Safety Stock, EOQ concept
> - **NLP Semantics** — Sentence transformers, cosine similarity
> - **Statistical Analysis** — CV, cumulative percentage, trend
> - **FastAPI + React** — Full-stack AI integration"

---

## 📌 SLIDE 17: CLOSING

**Script (~15 detik):**

> "Terima kasih. Saya siap untuk pertanyaan."

---

## 💬 Q&A PERSIAPAN

### Q1: Kenapa ABC pakai kumulatif 80/95%?
> "Itu prinsip Pareto yang sudah standard di inventory management. 80% nilai biasanya dari 20% item. Angka 95% untuk kelas B adalah batas yang umum diterima secara industri. Bisa di-tune, tapi default ini sudah proven."

### Q2: Kenapa XYZ pakai Coefficient of Variation?
> "CV mengukur seberapa fluktuatif permintaan relatif terhadap rata-rata. Item dengan permintaan 10±2 unit → CV=0.2 → stabil. Item dengan permintaan 10±15 unit → CV=1.5 → acak. Ini lebih akurat daripada pakai deviasi absolut."

### Q3: Dynamic Min-Max — apa bedanya dengan Safety Stock?
> "Safety Stock = buffer untuk ketidakpastian. Min (ROP) = titik pesan. Dynamic Min kita hitung dari Daily_Demand × Lead_Time × Safety_Factor — jadi sudah termasuk buffer. Max = Min + 30 hari demand forward."

### Q4: Duplikat detection — bisa salah deteksi?
> "Bisa, makanya ada 4 aksi. REVIEW = AI belum yakin, staff harus cek manual. Dan ada spec mismatch penalty — kalau ada perbedaan dimensi kritis, skor turun 40%. Jadi item yang mirip tapi beda ukuran tidak akan diklasifikasikan sebagai duplikat."

### Q5: Kenapa Duplicate SKU pakai NLP, bukan SQL LIKE?
> "SQL LIKE = exact match. 'Wrench Set Chrome Vanadium' tidak akan ketemu dengan 'Wrench Combination CV Steel' karena tidak ada kata yang sama persis. NLP semantic = mengerti makna. Kedua kalimat itu punya makna yang sangat dekat, jadi vektornya berdekatan dan cosine similarity-nya tinggi."

### Q6: Optimization — apa yang dilakukan tombol 'Eksekusi'?
> "Tombol Eksekusi menandai tindakan tersebut sudah diproses oleh staff. Ini adalah log/tracking — bukan eksekusi otomatis. Staff yang decide apakah mau return ke vendor, pesan PO, atau hapus item. AI hanya kasih rekomendasi + estimasi nilai dampakfinansial."

### Q7: Bagaimana kalau tidak ada data transaksi untuk 1 SKU?
> "Untuk ABC: Total_Value = 0 → masuk Kelas C. Untuk XYZ: jika kurang dari 3 bulan data → classified sebagai N/A. Untuk Dynamic Min-Max: pakai default lead time + safety factor 1.5."

---

## 🗂️ REFERENSI KODE

### Duplicate SKU
| File | Fungsi |
|------|--------|
| `backend/predictive/duplicate_detector.py` | NLP detection, cosine similarity, action recommendation |
| `src/components/.../DuplicateDetectionTab.tsx` | UI Duplicate SKU + Substitute Finder |

### ABC/XYZ + Dynamic Min-Max
| File | Fungsi |
|------|--------|
| `backend/predictive/minmax_optimizer.py` | ABC/XYZ calculation + Dynamic Min-Max formula |
| `src/components/.../AbcXyzClassificationTab.tsx` | UI ABC/XYZ table |
| `src/components/.../DynamicMinMaxTab.tsx` | UI Dynamic Min-Max + status badges |

### Optimization
| File | Fungsi |
|------|--------|
| `backend/predictive/inventory_optimizer.py` | OVERSTOCK/UNDERSTOCK/SLOW_MOVING detection |
| `src/components/.../OptimizationTab.tsx` | UI Optimization recommendations |

---

## 📐 RUMUS CEPAT — ABC/XYZ

```
ABC Classification:
  Urutkan: Total_Value = Qty_Issued × Unit_Price (descending)
  Cum% = cumsum(Total_Value) / sum(Total_Value)

  A → Cum% ≤ 80%
  B → 80% < Cum% ≤ 95%
  C → Cum% > 95%

XYZ Classification:
  CV = std(monthly_demand) / mean(monthly_demand)

  X → CV ≤ 0.5
  Y → 0.5 < CV ≤ 1.0
  Z → CV > 1.0
```

## 📐 RUMUS CEPAT — DYNAMIC MIN-MAX

```
Daily_Demand = Total_Qty / Actual_Days

Safety_Factor:
  HIGH   → 2.0
  MEDIUM → 1.5
  LOW    → 1.2

Dynamic_Min = ceil(Daily_Demand × Lead_Time × Safety_Factor)
Dynamic_Max = ceil(Dynamic_Min + Daily_Demand × 30)
```

## 📐 RUMUS CEPAT — OPTIMIZATION

```
OVERSTOCK:
  Excess_Qty    = max(0, Current_Stock - Dynamic_Max)
  Excess_Value   = Excess_Qty × Unit_Price

UNDERSTOCK:
  Shortage_Qty  = max(0, Dynamic_Min - Current_Stock)
  Shortage_Value = Shortage_Qty × Unit_Price

SLOW_MOVING:
  Item dengan ABC=C dan XYZ=Z dan Stok > Dynamic_Max
```

---

*File ini adalah Bagian 2 dari AI Predictive Presentation — Duplicate SKU, ABC/XYZ, Dynamic Min-Max, dan Optimization.*

---

## ⚙️ TECH STACK — RINGKASAN PER FITUR

### 1. DUPLICATE SKU DETECTION

| Komponen | Teknologi | Guna |
|----------|-----------|------|
| **Backend** | `sentence-transformers` | NLP embedding — ubah teks deskripsi jadi vector |
| **Backend** | `scikit-learn` | Hitung cosine similarity antar vector SKU |
| **Backend** | `ChromaDB` | Cache vector embeddings — tidak perlu encode ulang |
| **Backend File** | `duplicate_detector.py` | Rich description — encode — similarity — action |
| **Frontend** | `DuplicateDetectionTab.tsx` | Tabel hasil, panel detail, filter MERGE/SUBSTITUTE |
| **Frontend** | `Tailwind CSS` | White-space pre-line, text wrapping |
| **API Endpoint** | `GET /api/ai/duplicates` | Ambil daftar pasangan kandidat |
| **API Endpoint** | `GET /api/ai/substitutes/{sku_id}` | Cari item pengganti otomatis |
| **API Endpoint** | `POST /api/ai/duplicates/{pair_id}/action` | Catat keputusan staff |

### 2. ABC/XYZ CLASSIFICATION

| Komponen | Teknologi | Guna |
|----------|-----------|------|
| **Backend** | `numpy` | Hitung cumulative sum untuk Pareto ABC |
| **Backend** | `numpy` | Hitung std() dan mean() untuk Coefficient of Variation XYZ |
| **Backend** | `pandas` | Group transaksi per SKU per bulan |
| **Backend File** | `minmax_optimizer.py` | Fungsi classify_abc_xyz() |
| **Frontend** | `AbcXyzClassificationTab.tsx` | Tabel SKU + kelas ABC/XYZ, filter per kelas |
| **Frontend** | `Tailwind CSS` | Badge warna AX/CZ dll |
| **API Endpoint** | `GET /api/ai/minmax` | Kirim ABC/XYZ + Dynamic Min-Max |

### 3. DYNAMIC MIN-MAX ENGINE

| Komponen | Teknologi | Guna |
|----------|-----------|------|
| **Backend** | `math.ceil` | Pembulatan Dynamic Min & Max ke bilangan bulat |
| **Backend** | `pandas` | Hitung Daily_Demand = Total_Qty / Actual_Days |
| **Backend File** | `minmax_optimizer.py` | Fungsi calculate_dynamic_minmax() |
| **Frontend** | `DynamicMinMaxTab.tsx` | Tabel Min/Max, status badges |
| **Frontend** | `Tailwind CSS` | Badge hijau/merah/kuning |
| **API Endpoint** | `GET /api/ai/minmax` | Kirim Min, Max, Status per SKU |
| **Tombol UI** | "Hitung Ulang AI" | Recalculate semua Min-Max |

### 4. INVENTORY OPTIMIZATION

| Komponen | Teknologi | Guna |
|----------|-----------|------|
| **Backend** | `pandas` | Bandingkan Current_Stock vs Min/Max per SKU |
| **Backend** | `numpy` | Hitung Excess_Value = Excess_Qty x Unit_Price |
| **Backend File** | `inventory_optimizer.py` | OVERSTOCK / UNDERSTOCK / SLOW_MOVING / OPTIMAL |
| **Frontend** | `OptimizationTab.tsx` | Tabel peluang, filter per tipe, tombol Eksekusi |
| **Frontend** | `Tailwind CSS` | Card layout, highlight Excess_Qty / Shortage_Qty |
| **API Endpoint** | `GET /api/ai/optimization` | Kirim daftar peluang + nilai dampak |
| **API Endpoint** | `POST /api/ai/optimization/{id}/execute` | Tandai sudah dieksekusi |

### SHARED (Semua Fitur)

| Komponen | Teknologi | Guna |
|----------|-----------|------|
| **Backend** | `FastAPI` | REST API untuk semua endpoints |
| **Database** | `PostgreSQL (Supabase)` | Master data SKU, transaksi, data mesin |
| **Frontend** | `React + TypeScript` | Tab navigation antar 4 fitur |
| **Frontend** | `Axios` | HTTP client ke semua API endpoints |
| **Cache** | `In-memory dict` | Cache hasil duplicate detection |

### KONEKSI TECH STACK ANTAR-FITUR

```
PostgreSQL (data master)
       |
       v
+--------------------------------------------------+
|               FastAPI Backend                       |
|                                                    |
|  minmax_optimizer.py  inventory_optimizer.py      |
|  (ABC/XYZ + Min-Max)  (OVERSTOCK/UNDERSTOCK)     |
|                                                    |
|  duplicate_detector.py  criticality_classifier.py |
|  (NLP + ChromaDB)     (Composite Score)          |
+--------------------------------------------------+
       |
       v
+--------------------------------------------------+
|            React Frontend (AI Insights)             |
|  DuplicateDetectionTab | AbcXyzClassificationTab  |
|  DynamicMinMaxTab      | OptimizationTab           |
+--------------------------------------------------+
```

### KENAPA LOCAL AI? (Tidak Pakai Cloud API)

> Semua model berjalan 100% local — tidak ada biaya API, tidak perlu internet, data tidak keluar server.
> Ini penting untuk environment factory/industri yang punya kebijakan keamanan data ketat.

### 1. DUPLICATE SKU DETECTION

| Library | Kegunaan |
|---------|----------|
| **sentence-transformers** | NLP embedding — ubah teks jadi vector untuk duplicate detection |
| **scikit-learn** | Cosine similarity, statistical calculations |
| **numpy** | ABC cumulative sum, coefficient of variation (std/mean) |
| **pandas** | Data manipulation, grouping transactions by SKU & date |
| **FastAPI** | REST API endpoints untuk semua fitur AI |
| **math (ceil)** | Pembulatan Dynamic Min-Max ke bilangan bulat |

### AI Models

| Model | Fungsi |
|-------|--------|
| **paraphrase-multilingual-MiniLM-L12-v2** | Sentence Transformer untuk Duplicate SKU — multibahasa |
| **NumPy std/mean** | Coefficient of Variation untuk XYZ classification |
| **Cumulative %** | Pareto analysis untuk ABC classification |

### Database & Storage

| Teknologi | Kegunaan |
|-----------|---------|
| **PostgreSQL (Supabase)** | Master data SKU, transaksi, data mesin |
| **ChromaDB** | Vector cache untuk duplicate SKU embeddings |
| **In-memory cache** | Cache hasil duplicate detection agar tidak encode ulang |

### Frontend

| Teknologi | Kegunaan |
|-----------|----------|
| **React + TypeScript** | UI tabs: Duplicate Detection, ABC/XYZ, Dynamic Min-Max, Optimization |
| **Recharts** | Visualisasi data |
| **Axios** | HTTP client ke FastAPI endpoints |
| **Tailwind CSS** | Styling komponen UI |

### API Endpoints

| Method | Endpoint | Fitur |
|--------|----------|-------|
| GET | `/api/ai/duplicates` | Duplicate SKU detection |
| GET | `/api/ai/substitutes/{sku_id}` | Cari substitusi otomatis |
| GET | `/api/ai/minmax` | ABC/XYZ + Dynamic Min-Max |
| GET | `/api/ai/optimization` | OVERSTOCK / UNDERSTOCK / SLOW_MOVING |
| POST | `/api/ai/duplicates/{pair_id}/action` | Record keputusan staff |
| POST | `/api/ai/optimization/{id}/execute` | Tandai sudah dieksekusi |

### Architecture Overview

```
┌──────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│  PostgreSQL   │────▶│  FastAPI Backend    │────▶│  React Frontend │
│  (master data)│     │  predictive/        │     │  ai_insights/   │
└──────────────┘     │                     │     └─────────────────┘
                     │  duplicate_detector │◀────│  /duplicates    │
                     │  minmax_optimizer   │◀────│  /abc-xyz        │
                     │  inventory_optimizer│◀────│  /minmax         │
                     │                     │     │  /optimization   │
                     └──────────┬──────────┘
                                │
                     ┌──────────▼──────────┐
                     │  ChromaDB (cache)   │
                     │  Sentence Transform │
                     └─────────────────────┘
```

### Kenapa Local AI? (Tidak Pakai Cloud API)

> Semua model berjalan di **local** — tidak perlu internet, tidak ada biaya API, data tidak keluar server. Ini penting untuk environment industri seperti toolcrib factory yang biasanya punya keamanan data ketat.
