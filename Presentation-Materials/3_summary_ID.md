# RINGKASAN PRESENTASI — AI ENGINEER GENERATIVE
## PTMI ToolCrib | Seleksi Magang PT Mattel

---

## 🎯 ROLE
AI Engineer Generative — membangun fitur AI berbasis LLM untuk ToolCrib System

## 🔑 3 FITUR YANG DIBANGUN

### 1. Chatbot AI Interaktif (RAG)
- Teknisi tanya → AI jawab dari database tool crib
- Bahasa Indonesia, 24/7
- Endpoint: `POST /api/chat`

### 2. Auto-Fill PDF Form
- Upload Surat Jalan → form terisi otomatis
- Waktu: 10-15 menit → 30 detik
- Endpoint: `POST /api/parse-restock`

### 3. Live Data Sync
- Supabase ↔ ChromaDB sinkron real-time
- Endpoint: `POST /api/sync-chroma`

---

## ⚙️ TECH STACK

| Komponen | Teknologi |
|---|---|
| LLM | Ollama + Llama 3 (local) |
| Vector DB | ChromaDB (persistent) |
| Embedding | HuggingFace all-MiniLM-L6-v2 |
| PDF Parser | PDFPlumber |
| API Server | FastAPI (port 8001) |

---

## 🏗️ ARSITEKTUR RAG — 3 LAYER RETRIEVAL

```
User Query
    │
    ├── Layer 1: Exact Metadata Location → bypass embeddings
    ├── Layer 2: Exact SKU Match → BRG-XXX-NNN
    └── Layer 3: Semantic Search → hybrid scoring
              ├── Embedding similarity
              ├── Keyword boost (-0.15)
              ├── Exact word match (-0.15)
              └── Location boost (-0.50)

Confidence Filter:
🟢 HIGH ≤ 1.00  |  🟡 MEDIUM ≤ 1.20  |  🟠 LOW ≤ 1.40  |  🔴 REJECTED > 1.40
```

---

## 🧠 SKU DEDUPLICATION (Location Query Priority)

```
location > inspection > specification > calibration > purchase > description
```

---

## 🔧 BUG FIX — NOTES HALLUCINATION

| | Sebelum | Sesudah |
|---|---|---|
| Bug | Semua item dapat keterangan item 1 | Hanya item dengan keterangan eksplisit |
| Solusi | Prompt + Frontend Guard | Notes per-item, tidak di-copy |

---

## 📊 IMPACT BISNIS

| Metric | Sebelum | Sesudah |
|---|---|---|
| Input Surat Jalan | ~15 menit (manual) | ~30 detik (AI) |
| Error rate | Tinggi | Minim |
| Akses info tool crib | Harus ke warehouse | 24/7 via chatbot |

---

## 💬 JAWABAN CEPAT Q&A

**Q: Kenapa Ollama bukan ChatGPT?**
→ Privacy (data tidak keluar), offline capability, no API cost

**Q: Gimana kalau LLM hallucinate?**
→ Confidence threshold (distance > 1.40 = REJECTED) + ChromaDB grounding

**Q: Kenapa Vector DB, bukan SQL?**
→ SQL = exact match. Vector DB = semantic search ("digital caliper" ketemu "vernier caliper digital")

**Q: Kamu full-stack atau cuma AI?**
→ End-to-end: PDF ingestion → ChromaDB → LLM → FastAPI → React frontend

**Q: Kenapa chunk 500 chars?**
→ Tradeoff: cukup untuk 1 item lengkap (granularity) tapi tidak terlalu besar (precision)

**Q: Data baru gimana masuk ke vector DB?**
→ `/api/sync-chroma` — fetch dari Supabase → embed → upsert ke ChromaDB

---

## 🎤 1 MINUTE ELEVATOR PITCH

> "Saya sebagai AI Engineer Generative membangun 3 fitur AI untuk ToolCrib: (1) chatbot RAG — teknisi tanya info tool crib dalam Bahasa Indonesia dan dapat jawaban instan dari database; (2) auto-fill PDF — upload Surat Jalan, form restock terisi otomatis, hemat 10-15 menit per dokumen; (3) live sync — database SQL dan vector store selalu sinkron. Tech stack-nya Ollama + ChromaDB + HuggingFace — 100% local, privacy-preserving, no API cost."

---

## ✅ CHECKLIST SEBELUM PRESENTASI

- [ ] Jalankan Ollama (`ollama serve`)
- [ ] Jalankan backend (`python app.py`) — port 8001
- [ ] Jalankan frontend (`npm run dev`) — port 3000
- [ ] Siapkan PDF Surat Jalan test untuk demo auto-fill
- [ ] Hafal 1 impact metric: "15 menit → 30 detik"
- [ ] Hafal 1 bug story: notes hallucination + fix-nya
