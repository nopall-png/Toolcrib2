# Presentation Materials — AI Engineer Generative
## PTMI ToolCrib Bootcamp | PT Mattel Internship Selection

---

## 1. ABOUT THE ROLE: AI ENGINEER GENERATIVE

**Main responsibilities:**
1. **Interactive AI Chatbot** — AI assistant for technicians to search tool crib information
2. **Auto-Fill PDF Form** — automatic data extraction from Surat Jalan / DO into forms

**Tech Stack:**
- **Ollama + Llama 3** — Local LLM (no internet needed, privacy-preserving)
- **ChromaDB** — Vector Database for semantic search
- **HuggingFace Embeddings** (all-MiniLM-L6-v2) — converts text into number vectors
- **PDFPlumber** — extracts text from PDF while keeping table structure intact
- **FastAPI** — backend API server (port 8001)
- **LangChain** — orchestration framework for RAG
- **Zustand** — state management on the frontend (Next.js)

---

## 2. FULL SYSTEM ARCHITECTURE

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

### Data Flow:
```
Supabase (live data) ←→ ChromaDB (vector store)
                            ↑
                       /api/sync-chroma  ← live sync endpoint

User Query → Next.js → FastAPI (port 8001) → ChromaDB + Ollama → Response
```

---

## 3. RAG ARCHITECTURE (RETRIEVAL-AUGMENTED GENERATION)

### Complete Pipeline:

```
[PDF ToolCrib Dataset — 100 Items]
        │
        ▼
  [1_ingest_data.py]
  → PDFPlumber extracts text (keeps table structure!)
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
        │    → Gets all data directly by SKU code
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
[Ollama/Llama 3] ← Context from ChromaDB
        │
        ▼
[Natural Language Answer — 100% Indonesian]
```

---

## 4. FEATURE #1: INTERACTIVE AI CHATBOT

### Capabilities:
- Ask about item location: *"Where is the digital vernier caliper?"*
- Ask about specs: *"Show me bearing specifications"*
- Ask about calibration: *"Which items need calibration?"*
- Ask about price: *"How much is the pneumatic cylinder?"*
- Ask about stock: *"How many BRG-MEA-097 in stock?"*
- Ask by Rack/Bin: *"What items are in Rack R-2?"*
- Upload PDF temporarily → ask questions directly about the document

### Key Features:
- **3-Layer Retrieval** — Exact Metadata → Exact SKU → Semantic Search
- **Confidence Threshold** — Prevents answers from irrelevant data (distance > 1.40 = REJECTED)
- **SKU Deduplication** — Priority: location > inspection > spec > calibration > purchase > description
- **Intent Detection** — Auto-detects: spec/calibration/inspection/purchase/location/aggregation
- **Intent-Based Field Masking** — Calibration only shows calibration date, not prices
- **Session PDF Memory** — Upload PDF, ask questions about it directly
- **Graceful Degradation** — Works without Ollama (retrieval-only mode)
- **Indonesian Language** — 100% Indonesian answers, no asterisk bullet points

### Demo Scenario:
```
Technician: "Where is the digital vernier caliper?"
AI:         "Digital Vernier Caliper (BRG-MEA-097) is stored in
             Rack R-2, Bin B-15 in ToolCrib Warehouse.
             Current stock is 5 units."
```

---

## 5. FEATURE #2: AUTO-FILL PDF FORM

### Problems Solved:
- Staff had to **manually type** data from Surat Jalan into the restock form
- **Human error** was common (wrong quantity, wrong item name)
- **Not efficient** — 1 Surat Jalan could have 10+ items

### Solution: AI Auto-Fill
```
[Upload Surat Jalan PDF]
        │
        ▼
  [PDFPlumber] → extracts text (keeps table structure)
        │
        ▼
  [Ollama/Llama 3] → LLM prompt: "Extract item names, quantities,
                        and notes from the Surat Jalan text"
        │
        ▼
  [JSON: {name, quantity, notes}]
        │
        ▼
  [Frontend: Fuzzy Match to Master Data Tool]
  → Fuzzy matching (exact code → name substring → word similarity)
        │
        ▼
  [Auto-fill restock form]
  → Tool ID ✓
  → Quantity ✓
  → Notes ✓ (PER-ITEM, not copied)
```

### Bug Fix I Worked On:
- **Problem**: All items got the same note (LLM hallucination)
- **Fix Prompt**: Notes MUST be per-item, cannot copy from one item to another
- **Fix Frontend**: Guard — if >= 2 items have the same note, clear all except the first
- **Impact**: Note extraction accuracy improved significantly

---

## 6. FEATURE #3: LIVE SUPABASE-TO-CHROMADB SYNC (`/api/sync-chroma`)

### What it is:
An endpoint that keeps ChromaDB in sync with live data from Supabase (PostgreSQL).

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
Upsert to ChromaDB
    │
    ↓
Log to ai_sync_logs table
Clear in-memory SKU cache → data immediately searchable
```

---

## 7. TECHNICAL SKILLS I MASTERED

### Prompt Engineering:
- RAG prompt template (system instruction + context + question)
- Document extraction prompt (JSON format, strict rules)
- Indonesian language enforcement (no asterisk, no English greetings)
- Handling hallucination with confidence threshold

### Vector Database (ChromaDB):
- Setting up persistent storage
- Querying with metadata filtering
- Deduplication strategy
- In-memory cache (`_merged_skus_cache`)

### PDF Processing:
- PDFPlumber (keeps table structure vs PyPDF which breaks it)
- Table extraction with pipe separator
- SKU regex validation (BRG-[A-Z]{3}-\d{3})

### Python Backend (FastAPI):
- REST API endpoints (chat, upload, parse-restock, sync-chroma)
- Async file upload handling
- CORS configuration
- Graceful degradation (fallback without Ollama)

### Frontend Integration:
- Fetch API → Python backend (port 8001)
- Fuzzy matching algorithm (3-level)
- Zustand state management

---

## 8. CHALLENGES & SOLUTIONS

### Challenge 1: LLM Hallucination
- **Problem**: LLM gives wrong or made-up answers
- **Solution**: RAG with confidence threshold + ChromaDB retrieval validation

### Challenge 2: Different PDF Layouts
- **Problem**: Every Surat Jalan has a different format
- **Solution**: PDFPlumber keeps structure + robust LLM prompt

### Challenge 3: SKU Duplicates in Vector DB
- **Problem**: 1 item can have multiple chunks → duplicate retrieval results
- **Solution**: SKU Deduplication with priority map

### Challenge 4: Notes Copied to All Items
- **Problem**: LLM hallucinated — copied notes from item 1 to items 2 & 3
- **Solution**: (1) Strengthened prompt | (2) Frontend guard

### Challenge 5: Data Out of Sync
- **Problem**: ChromaDB and Supabase could get out of sync
- **Solution**: `/api/sync-chroma` endpoint for live sync

---

## 9. BUSINESS IMPACT

| Metric | Before | After |
|--------|---------|-------|
| Time to input 1 Surat Jalan | ~10-15 minutes (manual) | ~30 seconds (AI auto-fill) |
| Input error rate | High (human error) | Low (AI extraction) |
| Technician question response | Had to search manually | Instant via chatbot |
| Access to tool crib info | Limited (had to go to warehouse) | 24/7 via chatbot |
| Data synchronization | Manual / batch | Real-time via sync endpoint |

---

## 10. SLIDE DECK OUTLINE

### Slide 1: Title
**"AI-Powered ToolCrib Inventory System"**
Role: AI Engineer Generative

### Slide 2: Overview
- What is ToolCrib?
- Why does it need AI?

### Slide 3: Role & Responsibilities
- AI Engineer Generative
- Chatbot + Auto-Fill PDF + Live Sync

### Slide 4: Architecture Overview
- Microservices diagram
- Tech stack

### Slide 5: RAG Pipeline
- 3-layer retrieval
- Confidence threshold

### Slide 6: Feature 1 — AI Chatbot
- Demo / screenshot
- Chatbot capabilities

### Slide 7: Feature 2 — Auto-Fill PDF
- Demo / screenshot
- Extraction process

### Slide 8: Feature 3 — Live Sync
- Supabase to ChromaDB sync

### Slide 9: Technical Deep Dive
- SKU-aware chunking
- Intent detection & field masking
- Graceful degradation

### Slide 10: Bug Fix Example
- Problem: notes copied
- Solution I worked on

### Slide 11: Skills & Impact
- Tech stack
- Metric improvement

### Slide 12: Closing
- Thank you + Q&A

---

## 11. PRESENTATION TIPS

### Things to Highlight:
1. **I understand end-to-end** — from PDF ingestion to UI
2. **I solve real problems** — reducing human error, saving time
3. **I'm aware of hallucination risk** — and I've mitigated it with confidence threshold
4. **I use local LLM** — not dependent on internet/external API
5. **I can debug & fix bugs** — example: the notes bug I already fixed

### Things to Avoid:
- Don't just talk theory — **show code / demo**
- Don't exaggerate — **be honest about limitations**
- Don't say "it's easy" — **respect the complexity**

### Prepared Answers for Questions:
- "Why Ollama instead of ChatGPT?" → Privacy + offline + cost-effective
- "What if the LLM makes mistakes?" → Confidence threshold + ChromaDB validation
- "Why 500 chars chunk?" → Tradeoff between granularity and context
- "Why vector DB instead of SQL?" → SQL for exact match; Vector DB for semantic search
- "Do you only know AI or are you full-stack?" → End-to-end, from ingestion to UI
