# PRESENTATION SUMMARY — AI ENGINEER GENERATIVE
## PTMI ToolCrib | PT Mattel Internship Selection

---

## 🎯 ROLE
AI Engineer Generative — building LLM-based AI features for ToolCrib System

## 🔑 3 FEATURES I BUILT

### 1. Interactive AI Chatbot (RAG)
- Technician asks → AI answers from tool crib database
- Indonesian language, 24/7
- Endpoint: `POST /api/chat`

### 2. Auto-Fill PDF Form
- Upload Surat Jalan → form fills automatically
- Time: 10-15 minutes → 30 seconds
- Endpoint: `POST /api/parse-restock`

### 3. Live Data Sync
- Supabase ↔ ChromaDB syncs in real-time
- Endpoint: `POST /api/sync-chroma`

---

## ⚙️ TECH STACK

| Component | Technology |
|---|---|
| LLM | Ollama + Llama 3 (local) |
| Vector DB | ChromaDB (persistent) |
| Embedding | HuggingFace all-MiniLM-L6-v2 |
| PDF Parser | PDFPlumber |
| API Server | FastAPI (port 8001) |

---

## 🏗️ RAG ARCHITECTURE — 3 LAYER RETRIEVAL

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

| | Before | After |
|---|---|---|
| Bug | All items got the same note as item 1 | Only items with explicit notes |
| Solution | Prompt + Frontend Guard | Notes per-item, not copied |

---

## 📊 BUSINESS IMPACT

| Metric | Before | After |
|---|---|---|
| Surat Jalan input | ~15 minutes (manual) | ~30 seconds (AI) |
| Error rate | High | Low |
| Tool crib info access | Had to go to warehouse | 24/7 via chatbot |

---

## 💬 QUICK Q&A ANSWERS

**Q: Why Ollama instead of ChatGPT?**
→ Privacy (data stays local), offline capability, no API cost

**Q: What if the LLM hallucinates?**
→ Confidence threshold (distance > 1.40 = REJECTED) + ChromaDB grounding

**Q: Why Vector DB instead of SQL?**
→ SQL = exact match. Vector DB = semantic search ("digital caliper" matches "vernier caliper digital")

**Q: Are you full-stack or AI-only?**
→ End-to-end: PDF ingestion → ChromaDB → LLM → FastAPI → React frontend

**Q: Why 500 chars chunk?**
→ Tradeoff: enough for 1 complete item (granularity) but not too big (precision)

**Q: How does new data get into the vector DB?**
→ `/api/sync-chroma` — fetch from Supabase → embed → upsert to ChromaDB

---

## 🎤 1 MINUTE ELEVATOR PITCH

> "As an AI Engineer Generative, I built 3 AI features for ToolCrib: (1) RAG chatbot — technicians ask about tool crib info in Indonesian and get instant answers from the database; (2) auto-fill PDF — upload a Surat Jalan, restock form fills automatically, saving 10-15 minutes per document; (3) live sync — SQL database and vector store always stay in sync. Tech stack is Ollama + ChromaDB + HuggingFace — 100% local, privacy-preserving, no API cost."

---

## ✅ PRE-PRESENTATION CHECKLIST

- [ ] Start Ollama (`ollama serve`)
- [ ] Start backend (`python app.py`) — port 8001
- [ ] Start frontend (`npm run dev`) — port 3000
- [ ] Prepare a test Surat Jalan PDF for auto-fill demo
- [ ] Memorize 1 impact metric: "15 minutes → 30 seconds"
- [ ] Memorize 1 bug story: notes hallucination + the fix
