# Materi Presentasi — AI Engineer Generative

## PTMI ToolCrib Bootcamp | Seleksi Magang PT Mattel

---

## 1. TENTANG ROLE: AI ENGINEER GENERATIVE

**Jobdesk utama:**

1. **Chatbot AI Interaktif** — asisten AI untuk teknisi mencari info tool crib
2. **Auto-Fill PDF Form** — ekstraksi data dari Surat Jalan / DO otomatis ke form

**Tech Stack yang digunakan:**

- **Ollama + Llama 3** — LLM lokal (tidak perlu internet, privacy-preserving)
- **ChromaDB** — Vector Database untuk semantic search
- **HuggingFace Embeddings** (all-MiniLM-L6-v2) — untuk mengubah teks jadi vektor angka
- **PDFPlumber** — ekstraksi teks dari PDF dengan struktur tabel tetap
- **FastAPI** — backend API server (port 8001)
- **LangChain** — orchestration framework untuk RAG
- **Zustand** — state management di frontend (Next.js)

---

## 2. ARSITEKTUR SISTEM LENGKAP

### Microservices Layout:

```
Toolcrib2/
├── src/                    # Next.js Frontend (port 3000)
├── backend/
│   ├── predictive/         # ML Forecasting, ABC/XYZ, Duplicate Detection (port 8000)
│   │   ├── forecaster.py   # Facebook Prophet time-series
│   │   ├── duplicate_detector.py  # SentenceTransformer fuzzy matching
│   │   └── inventory_optimizer.py  # ABC/XYZ classification
│   └── generative/         # CHATBOT + RAG + PDF Auto-Fill (port 8001)
│       ├── generative_ai.py   # FastAPI app (main entry)
│       ├── 1_ingest_data.py   # PDF ingestion + ChromaDB population
│       ├── 3_rag_pipeline.py  # Full RAG pipeline
│       └── retrieval_engine.py # Shared retrieval logic (3-layer)
└── db/supabase/            # PostgreSQL — master data source
```

### Aliran Data:

```
Supabase (live data) ←→ ChromaDB (vector store)
                            ↑
                       /api/sync-chroma  ← live sync endpoint

User Query → Next.js → FastAPI (port 8001) → ChromaDB + Ollama → Response
```

---

## 3. ARSITEKTUR RAG (RETRIEVAL-AUGMENTED GENERATION)

### Pipeline Lengkap:

```
[PDF ToolCrib Dataset — 100 Items]
        │
        ▼
  [1_ingest_data.py]
  → PDFPlumber extract teks (preserve table structure!)
  → SKU detection (BRG-[A-Z]{3}-\d{3})
  → SKU-aware chunking (500 chars, 50 overlap)
  → HuggingFace embeddings (all-MiniLM-L6-v2)
  → ChromaDB vector store
        │
        ▼
[User Query]
        │
        ├─── Layer 1: Exact Metadata Location Search
        │    → Bypasses embeddings — exact rack/bin/warehouse match
        │
        ├─── Layer 2: Exact SKU Match
        │    → Langsung dapat semua data oleh SKU code
        │
        └─── Layer 3: Semantic Search (Hybrid Scoring)
             → Embedding similarity (L2 distance)
             → Keyword boost (-0.15)
             → Exact word match boost (-0.15)
             → Location boost (-0.50)
             → Confidence filtering:
               HIGH ≤ 1.00 | MEDIUM ≤ 1.20 | LOW ≤ 1.40 | REJECTED > 1.40
             → SKU Deduplication (location > inspection > spec > calibration > purchase > description)
        │
        ▼
[Ollama/Llama 3] ← Konteks dari ChromaDB
        │
        ▼
[Natural Language Answer — Bahasa Indonesia 100%]
```

---

## 4. FITUR #1: CHATBOT AI INTERAKTIF

### Kemampuan:

- Tanya lokasi barang: _"Di mana digital vernier caliper?"_
- Tanya spesifikasi: _"Tampilkan spesifikasi bearing"_
- Tanya kalibrasi: _"Barang apa yang butuh kalibrasi?"_
- Tanya harga: _"Berapa harga pneumatic cylinder?"_
- Tanya stok: _"Berapa stok BRG-MEA-097?"_
- Tanya berdasarkan Rak/Bin: _"Barang apa saja di Rak R-2?"_
- Upload PDF temporary → tanya langsung ke dokumen tersebut

### Fitur Unggulan:

- **3-Layer Retrieval** — Exact Metadata → Exact SKU → Semantic Search
- **Confidence Threshold** — Mencegah jawaban dari data tidak relevan (distance > 1.40 = REJECTED)
- **SKU Deduplication** — Priority map: location > inspection > spec > calibration > purchase > description
- **Intent Detection** — Otomatis detect: spec/calibration/inspection/purchase/location/aggregation
- **Intent-Based Field Masking** — Kalibrasi hanya muncul tanggal kalibrasi, tidak muncul harga
- **Session PDF Memory** — Upload PDF, tanya langsung ke dokumen itu
- **Graceful Degradation** — Jalan tanpa Ollama (retrieval-only mode)
- **Bahasa Indonesia** — Jawaban 100% Bahasa Indonesia, tanpa asterisk bullet points

### Demo Scenario:

```
Teknisi: "Di mana digital vernier caliper?"
AI:      "Digital Vernier Caliper (BRG-MEA-097) disimpan di
         Rack R-2, Bin B-15 di ToolCrib Warehouse.
         Stok saat ini adalah 5 unit."
```

---

## 5. FITUR #2: AUTO-FILL PDF FORM

### Masalah yang Diselesaikan:

- Staff harus **input manual** data dari Surat Jalan ke form restock
- Sering terjadi **human error** (salah ketik quantity, salah nama barang)
- **Tidak efisien** — 1 Surat Jalan bisa punya 10+ item

### Solusi: AI Auto-Fill

```
[Upload Surat Jalan PDF]
        │
        ▼
  [PDFPlumber] → extract teks (struktur tabel tetap)
        │
        ▼
  [Ollama/Llama 3] → LLM prompt: "Ekstrak nama barang, quantity,
                        dan keterangan dari teks Surat Jalan"
        │
        ▼
  [JSON: {name, quantity, notes}]
        │
        ▼
  [Frontend: Fuzzy Match ke Master Data Tool]
  → Fuzzy matching (exact code → name substring → word similarity)
        │
        ▼
  [Auto-fill form restock]
  → Tool ID ✓
  → Quantity ✓
  → Notes ✓ (PER-ITEM, tidak dicopy)
```

### Bug Fix yang Saya Kerjakan:

- **Masalah**: Semua barang dapat keterangan yang sama (LLM hallucination)
- **Fix Prompt**: TASCADE `notes` HARUS per-item, tidak boleh copy antar item
- **Fix Frontend**: Guard — jika >= 2 item punya `notes` identik, kosongkan semua kecuali pertama
- **Impact**: Akurasi ekstraksi keterangan meningkat signifikan

---

## 6. FITUR #3: LIVE SUPABASE-TO-CHROMADB SYNC (`/api/sync-chroma`)

### Apa itu:

Endpoint yang menjaga ChromaDB tetap sinkron dengan data live dari Supabase (PostgreSQL).

### Flow:

```
Supabase (live tools table)
    │
    ↓  /api/sync-chroma
Fetch via REST API
    │
    ↓
Generate text chunks per tool
    │
    ↓
HuggingFace Embedding
    │
    ↓
Upsert ke ChromaDB
    │
    ↓
Log ke ai_sync_logs table
Clear in-memory SKU cache → data langsung searchable
```

---

## 7. TEKNIS: SKILL YANG SAYA KUASAI

### Prompt Engineering:

- Prompt template RAG (system instruction + context + question)
- Prompt untuk ekstraksi dokumen (JSON format, strict rules)
- Bahasa Indonesia enforcement (tanpa asterisk, tanpa sapaan Inggris)
- Handling hallucination dengan confidence threshold

### Vector Database (ChromaDB):

- Setup persistent storage
- Query dengan metadata filtering
- Deduplication strategy
- In-memory cache (`_merged_skus_cache`)

### PDF Processing:

- PDFPlumber (preserve table structure vs PyPDF yang hancurin)
- Tabel extraction dengan pipe separator
- SKU regex validation (BRG-[A-Z]{3}-\d{3})

### Python Backend (FastAPI):

- REST API endpoints (chat, upload, parse-restock, sync-chroma)
- Async file upload handling
- CORS configuration
- Graceful degradation (fallback tanpa Ollama)

### Frontend Integration:

- Fetch API → Python backend (port 8001)
- Fuzzy matching algorithm (3-level)
- Zustand state management

---

## 8. CHALLENGE & SOLUSI

### Tantangan 1: LLM Hallucination

- **Masalah**: LLM memberikan jawaban yang salah atau asal
- **Solusi**: RAG dengan confidence threshold + ChromaDB retrieval validation

### Tantangan 2: PDF Layout Berbeda

- **Masalah**: Setiap Surat Jalan punya format berbeda
- **Solusi**: PDFPlumber preserve structure + LLM prompt yang robust

### Tantangan 3: SKU Duplicate di Vector DB

- **Masalah**: 1 item bisa punya banyak chunk → hasil retrieval duplikat
- **Solusi**: SKU Deduplication dengan priority map

### Tantangan 4: Keterangan (Notes) di Copy ke Semua Item

- **Masalah**: LLM hallucinate — copy notes item 1 ke item 2 & 3
- **Solusi**: (1) Prompt diperkuat | (2) Frontend guard

### Tantangan 5: Data Tidak Sinkron

- **Masalah**: ChromaDB dan Supabase bisa tidak sync
- **Solusi**: `/api/sync-chroma` endpoint untuk live sync

---

## 9. IMPACT BISNIS

| Metric                    | Sebelum                       | Sesudah                     |
| ------------------------- | ----------------------------- | --------------------------- |
| Waktu input 1 Surat Jalan | ~10-15 menit (manual)         | ~30 detik (AI auto-fill)    |
| Error rate input          | Tinggi (human error)          | Minim (AI extraction)       |
| Respon pertanyaan teknisi | Butuh cari manual             | Instan via chatbot          |
| Akses info tool crib      | Terbatas (harus ke warehouse) | 24/7 via chatbot            |
| Sinkronisasi data         | Manual / batch                | Real-time via sync endpoint |

---

## 10. SLIDE DECK OUTLINE

### Slide 1: Title

**"AI-Powered ToolCrib Inventory System"**
Role: AI Engineer Generative

### Slide 2: Overview

- Apa itu ToolCrib?
- Kenapa perlu AI?

### Slide 3: Role & Jobdesk

- AI Engineer Generative
- Chatbot + Auto-Fill PDF + Live Sync

### Slide 4: Architecture Overview

- Diagram microservices
- Tech stack

### Slide 5: RAG Pipeline

- 3-layer retrieval
- Confidence threshold

### Slide 6: Feature 1 — Chatbot AI

- Demo / screenshot
- Kemampuan chatbot

### Slide 7: Feature 2 — Auto-Fill PDF

- Demo / screenshot
- Proses ekstraksi

### Slide 8: Feature 3 — Live Sync

- Supabase to ChromaDB sync

### Slide 9: Technical Deep Dive

- SKU-aware chunking
- Intent detection & field masking
- Graceful degradation

### Slide 10: Bug Fix Example

- Masalah: notes ter-copy
- Solusi yang saya kerjakan

### Slide 11: Skills & Impact

- Tech stack
- Metric improvement

### Slide 12: Closing

- Thank you + Q&A

---

## 11. TIPS PRESENTASI

### Hal yang Perlu Di-highlight:

1. **Saya mengerti end-to-end** — dari PDF ingestion sampai UI
2. **Saya solve real problem** — mengurangi human error, saving time
3. **Saya aware hallucination risk** — dan sudah mitigasi dengan confidence threshold
4. **Saya pakai local LLM** — tidak dependent ke internet/external API
5. **Saya bisa debug & fix bug** — contoh: bug keterangan yang sudah saya perbaiki

### Hal yang Perlu Diavoid:

- Jangan cuma bicara teori — **tunjukkan kode / demo**
- Jangan夸大 — **jujur soal limitation**
- Jangan bilang "itu mudah" — **hargai complexity** yang ada

### Jawaban Persiapan untuk Pertanyaan:

- "Kenapa pakai Ollama bukan ChatGPT?" → Privacy + offline + cost-effective
- "Gimana kalau LLM salah?" → Confidence threshold + ChromaDB validation
- "Kenapa chunk 500 chars?" → Tradeoff antara granularity dan context
- "Kenapa vector DB, bukan SQL?" → SQL untuk exact match; Vector DB untuk semantic search
- "Kamu ngerti full-stack atau cuma AI-nya?" → End-to-end, dari ingestion sampai UI
