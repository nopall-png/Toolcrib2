# AI Predictive Phase 4 — Duplicate SKU & Persistence

> Branch: `AI-Predictive-Phase-4`
> Base: `ai-predictive-phase-3`
> Tanggal: 1 Oktober 2026

Phase 4 fokus pada tiga hal utama:

1. **UX overhaul Duplicate Detection Tab** — caching, sticky action buttons, one-screen detail panel, dan substitute search tab.
2. **Backend column-name fix di `duplicate_detector.py`** — column yang dipakai adalah `Category`, `Unit`, dan `Brand` yang diekstrak dari `Technical_Specs` (sesuai schema Supabase aktual).
3. **Backend persistence untuk keputusan staff** — keputusan Merge/Substitute/Ignore sekarang ditulis ke database lewat endpoint baru dan tabel `duplicate_decisions`. Confirmation modal modern untuk Critical Spares dan Optimization.

---

## Apa yang berubah di branch ini

### Backend — Python (Predictive AI)

| File | Perubahan |
|---|---|
| `backend/predictive/duplicate_detector.py` | Fix bug column name (`category` → `Category`, `unit` → `Unit`, `Brand` → dari `Technical_Specs` JSON). Rich description sekarang gabungkan `Description` + `Category` + `description` + `Technical_Specs` + `Merek` untuk semantic similarity yang lebih akurat. |
| `backend/predictive/predictive_ai.py` | Tambah `POST /api/ai/duplicate-decisions` endpoint untuk menyimpan keputusan staff ke database. Pydantic model `DuplicateDecisionRequest` dengan validasi action ∈ {MERGE, IGNORE, SUBSTITUTE}. |
| `backend/predictive/data_provider.py` | (sebelumnya) hilangkan kolom `brand` dan `vendor` yang tidak ada di schema Supabase, dan rename `category` → `Category`, `unit` → `Unit` agar konsisten dengan `duplicate_detector.py`. |

### Frontend — Next.js

| File | Perubahan |
|---|---|
| `src/components/staff/toolcrib/ai_insights/DuplicateDetectionTab.tsx` | Complete rewrite: front-end cache per threshold, sticky action buttons di detail panel (fit-1-screen, max-h-[75vh] vertical scroll), 2 tab (Deteksi Duplikat & Cari Substitusi), confirmation dialog dengan textarea notes, toast notification melayang. |
| `src/components/staff/toolcrib/ai_insights/CriticalSparesTab.tsx` | Tambah modal konfirmasi modern untuk "Order Darurat" (backdrop blur, SKU preview, notes textarea). Hapus `handleEmergencyOrder` lama yang silent-update. |
| `src/components/staff/toolcrib/ai_insights/OptimizationTab.tsx` | Tambah modal konfirmasi untuk "Eksekusi" (indigo theme, bedakan dari PO Darurat merah). Hapus unused `OptimizationItem` interface. |
| `src/lib/api-ai.ts` | Tambah `recordDuplicateDecision()` function. Hapus unused `supabase` import. |

### Database — Supabase

| File | Perubahan |
|---|---|
| `supabase/migrations/001_create_duplicate_decisions.sql` | **File baru.** Tabel `duplicate_decisions` dengan field `sku_pair` (JSONB), `action` (varchar), `similarity_score` (decimal), `notes` (text), `decided_by` (varchar), `created_at`/`updated_at`. Trigger `updated_at_trigger()` otomatis. |

---

## Tugas untuk tim Backend (BELUM DIKERJAKAN)

> 7 item ini perlu dijalankan sama tim backend. Ceklis di bawah untuk tracking.

- [ ] **(1) Jalankan migration SQL di Supabase Dashboard**
  - Buka Supabase → SQL Editor → paste isi `supabase/migrations/001_create_duplicate_decisions.sql` → klik Run
  - Verify tabel `duplicate_decisions` muncul di Table Editor

- [ ] **(2) Test endpoint `POST /api/ai/duplicate-decisions` via curl/Postman**
  - Payload: `{ "sku1": "WR-001", "sku2": "WR-002", "action": "MERGE", "similarity_score": 92.5, "notes": "Test dari curl" }`
  - Expected: `200 OK` + `{ "status": "success", "id": "<uuid>", "message": "..." }`
  - Verify row baru masuk di tabel `duplicate_decisions` Supabase

- [ ] **(3) Test error case (invalid action)**
  - Kirim `action: "INVALID"` → expected `400 Bad Request`
  - Verify error message menyebut action yang valid

- [ ] **(4) Test alur penuh dari UI ke DB**
  - Start backend: `python -m uvicorn predictive_ai:app --port 8000`
  - Start frontend: `npm run dev`
  - Buka tab AI Predictive Insight → Duplicate SKU → klik "Merge Duplikat" → konfirmasi di dialog
  - Verify toast success muncul
  - Cek di Supabase Table Editor → `duplicate_decisions` → row baru dengan action `MERGE`

- [ ] **(5) Tambah endpoint `GET /api/ai/duplicate-decisions` (opsional, history audit)**
  - Return semua keputusan staff dengan filter by date range / action
  - Pakai di audit log atau dashboard admin nanti

- [ ] **(6) Setup RLS policy untuk tabel `duplicate_decisions`**
  - Supabase Row Level Security: staff authenticated bisa INSERT, hanya admin yang bisa DELETE/UPDATE
  - SQL: `CREATE POLICY "Staff can insert decisions" ON duplicate_decisions FOR INSERT TO authenticated WITH CHECK (true);`

- [ ] **(7) Verifikasi di browser DevTools**
  - Buka Network tab saat klik "Merge"
  - Lihat request ke `http://localhost:8000/api/ai/duplicate-decisions` dengan method `POST`
  - Response status `200` + body JSON yang valid

---

## Cara menjalankan ulang dari nol

### 1. Setup Supabase

```bash
# Login ke https://supabase.com/dashboard
# Pilih project → SQL Editor → New Query
# Paste seluruh isi supabase/migrations/001_create_duplicate_decisions.sql
# Klik Run
```

### 2. Setup backend Python

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn predictive_ai:app --port 8000
```

### 3. Setup frontend Next.js

```bash
# di root project
npm install
npm run dev
```

### 4. Test di UI

- Login sebagai staff → Master Data → AI Insigths
- Tab Duplicate SKU → klik Detail di baris manapun → klik "Merge Duplikat" → konfirmasi
- Cek toast: "✅ Merge disimpan!"
- Cek Supabase table `duplicate_decisions`

---

## Catatan teknis untuk reviewer

- **Cache strategy**: Frontend cache pakai `cacheRef` Map per percentage threshold. Backend cache pakai `DuplicateDetector._cache` + `DuplicateDetector._embedding_cache` (per deskripsi). Ganti filter = API call baru, filter sama = instant load.
- **Anti-blunder measurement**: regex extraction + tolerance per unit (mm: 5, cm: 0.5, kg: 0.5, dll). Kalau beda ukuran > toleransi, score dipenalty -40.
- **Rich description composition**: untuk semantic similarity AI, tiap item dibangun dari `Description` + `Category` + `description` (kolom deskripsi lengkap) + `Technical_Specs` JSON + `Merek`. Brand tidak ada kolom di `tools`, jadi diekstrak dari specs.
- **Action recommendation logic**:
  - `MERGE` — similarity ≥85%, specs match ≥80%, kategori sama, kedua-duanya kosong
  - `SUBSTITUTE` — similarity ≥40% tapi ada satu yang kosong, atau keduanya ada tapi salah satu stok banyak
  - `KEEP_SEPARATE` — beda ukuran kritis (melebihi toleransi)
  - `REVIEW` — similarity rendah tapi tidak ada konflik ukuran
- **Pydantic validation**: action wajib salah satu dari {MERGE, IGNORE, SUBSTITUTE}. HTTP 400 kalau tidak valid.

---

## File yang **TIDAK** boleh disentuh

- `backend/main.py` — Express server yang handle backend TypeScript (Node.js), bukan Python AI
- `backend/generative/` — port 8001 RAG pipeline, ini domain generative, bukan predictive
- File apapun di luar `backend/predictive/`, `src/components/staff/toolcrib/ai_insights/`, dan `supabase/migrations/`

Kalau teman backend bingung, tanya dulu di grup supaya tidak refactor file yang bukan domain-nya.