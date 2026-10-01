# PRESENTATION SCRIPT — AI ENGINEER GENERATIVE

## Duration: ~10-15 minutes | Q&A: ~5-10 minutes

---

## SLIDE 1: TITLE

**[AI-POWERED TOOLCRIB INVENTORY SYSTEM]**

---

**Script:**

> "Good morning/afternoon, my name is [Name]. Today I will explain my work as an **AI Engineer Generative** on this ToolCrib project.
>
> I built two main features:
>
> 1. **Interactive AI Chatbot** — technicians can ask about tool crib info in Indonesian
> 2. **Auto-Fill PDF Form** — automatic extraction of Surat Jalan data

---

## SLIDE 2: OVERVIEW — WHAT'S THE PROBLEM?

**[ToolCrib Problem]**

---

**Script:**

> "ToolCrib is the tool warehouse at PT Mattel Indonesia. There are 100+ MRO spare parts — bearings, calipers, pneumatic cylinders, and more.
>
> **Problem #1** — Technicians need info about items: where they are, their specs, when to calibrate. The process is manual, they have to go to the warehouse.
>
> **Problem #2** — When a Surat Jalan arrives, staff have to type the data into the system manually. 1 Surat Jalan can have 10 items. They often make mistakes.
>
> I built AI to solve these three problems."

---

## SLIDE 3: SYSTEM ARCHITECTURE

**[Microservices + RAG Pipeline]**

---

**Script:**

> "This is the microservices architecture.
>
> **Predictive AI** (port 8000) — for forecasting, ABC/XYZ classification, duplicate detection.
>
> **Generative AI** (port 8001) — this is what I built. It consists of:
>
> - FastAPI as the API server
> - ChromaDB as the vector database
> - Ollama/Llama 3 as the local LLM
>
> Data flows from **Supabase PostgreSQL** to **ChromaDB** through the sync endpoint. The Next.js frontend uses both services.
>
> **Why microservices?** Because generative AI and predictive AI have different characteristics — generative needs LLM and vector DB, predictive needs statistical models. By separating them, each can be scaled independently."

---

## SLIDE 4: RAG ARCHITECTURE — 3-LAYER RETRIEVAL

**[Pipeline Diagram]**

---

**Script:**

> "This is the heart of the AI chatbot — the RAG Pipeline, Retrieval-Augmented Generation.
>
> **Stage 1 — Ingestion:**
> I processed the ToolCrib PDF dataset with **PDFPlumber** — I chose this because it keeps the table structure intact, unlike PyPDF which breaks it. I detect the SKU pattern BRG-XXX-NNN. Each item is chunked into 500 characters with 50 overlap. Chunks are embedded using HuggingFace all-MiniLM-L6-v2 — lightweight, fast, and accurate for alphanumeric codes. Stored in ChromaDB.
>
> **Stage 2 — Retrieval (3 Layers):**
> When a technician asks a question, there are 3 retrieval layers in order:
>
> _Layer 1 — Exact Metadata Location:_ If the user asks about 'Rack A', I scan the metadata directly, bypassing embeddings completely. Result: distance = 0.0, confidence = EXACT.
>
> _Layer 2 — Exact SKU Match:_ If the user types 'BRG-MEA-097', I get all the data directly by SKU code.
>
> _Layer 3 — Semantic Search:_ For natural language questions. I use hybrid scoring — embedding similarity plus keyword boost, exact word match boost, and location boost. Distance below 1.40 is included in results, above that is rejected.
>
> **Stage 3 — SKU Deduplication:**
> 1 item can have 3-4 chunks. I deduplicate by SKU, and for location queries, I prioritize location-type chunks. Priority: location > inspection > specification > calibration > purchase > description."

---

## SLIDE 5: FEATURE 1 — AI CHATBOT

**[Screenshot / Demo]**

---

**Script:**

> "Feature 1: Interactive AI Chatbot. Technicians can ask questions in Indonesian.
>
> Example questions:
>
> - 'Where is the digital vernier caliper?' → Rack R-2, Bin B-15, stock 5 units
> - 'Show bearing specifications' → Brand, model, technical specs
> - 'What items are in Rack A?' → List of all items in Rack A
> - 'BRG-MEA-097' → Full item details
> - Upload a temporary PDF → ask questions directly about the document
>
> **What I built:**
>
> - 3-layer retrieval system
> - Confidence threshold — distance > 1.40 is REJECTED
> - Intent detection — the system automatically knows if user wants location, specs, calibration, or price
> - Intent-based field masking — if asking about calibration, only the calibration date shows, not the price
> - Session PDF memory — upload a document, ask questions about it
> - Graceful degradation — works without Ollama (retrieval-only mode)"

---

## SLIDE 6: FEATURE 2 — AUTO-FILL PDF

**[Screenshot / Demo]**

---

**Script:**

> "Feature 2: Auto-Fill PDF Form. Staff upload a Surat Jalan → AI fills the restock form automatically.
>
> **Workflow:**
> Upload PDF → PDFPlumber extracts text → LLM extracts to JSON {name, quantity, notes} → Fuzzy match to master data → Form is filled.
>
> **Result:**
> Input time from 10-15 minutes to ~30 seconds. Error rate dropped significantly.
>
> **Bug I fixed:**
> At first, if a Surat Jalan had 3 items but only the first item had a note, all 3 items would get the same note. This was LLM hallucination.
>
> **Solution:**
>
> 1. Prompt strengthened — 'notes can ONLY be filled if the note is EXPLICITLY attached to that specific item, DO NOT copy between items'
> 2. Frontend guard — if >= 2 items have the same note, clear all except the first"

---

## SLIDE 7: FEATURE 3 — LIVE SUPABASE-TO-CHROMADB SYNC

**[Diagram Sync Flow]**

---

**Script:**

> "Feature 3 that I built: Live Sync Endpoint.
>
> **Problem:** ChromaDB and Supabase must be in sync. If stock is updated in Supabase, ChromaDB must be updated too.
>
> **Solution:** The `/api/sync-chroma` endpoint that:
>
> 1. Fetches data from Supabase via REST API
> 2. Generates text chunks per tool
> 3. Generates embeddings
> 4. Upserts to ChromaDB
> 5. Logs status to the `ai_sync_logs` table
> 6. Clears the in-memory SKU cache
>
> Result: data is immediately searchable via the chatbot without delay."

---

## SLIDE 8: TECHNICAL DEEP DIVE — CONFIDENCE & INTENT

**[Scoring + Field Masking]**

---

**Script:**

> "I want to highlight 2 technical things that make this special:
>
> **First — Confidence Threshold:**
> ChromaDB gives a distance score. I created a 4-tier filter:
>
> - Distance ≤ 1.00 → HIGH 🟢 — use it directly
> - Distance ≤ 1.20 → MEDIUM 🟡 — still acceptable
> - Distance ≤ 1.40 → LOW 🟠 — show but flag it
> - Distance > 1.40 → REJECTED 🔴 — don't use it
>
> This prevents the LLM from answering based on irrelevant data — explainable AI.
>
> **Second — Intent-Based Field Masking:**
> Different questions need different fields. If the user asks about calibration, I only return item name + calibration date. Price, location, all masked as N/A. This prevents noise in the answer."

---

## SLIDE 9: SKILLS & TOOLS

**[Tech Stack Grid]**

---

**Script:**

> "Skills I have:
>
> **Prompt Engineering** — RAG prompt template, JSON extraction prompt, hallucination prevention
>
> **Vector Database** — ChromaDB setup, query, metadata filtering, deduplication, in-memory cache
>
> **Embedding Models** — all-MiniLM-L6-v2: lightweight ~80MB, CPU-friendly, accurate for SKU alphanumeric codes
>
> **PDF Processing** — PDFPlumber (keeps table structure), regex extraction
>
> **LLM Integration** — Ollama + Llama 3: local, privacy-preserving, no API cost
>
> **FastAPI** — REST API, async file upload, CORS, graceful degradation
>
> **Frontend Integration** — Next.js + Zustand, fuzzy matching, state management
>
> Everything runs in a local environment — no cloud service needed."

---

## SLIDE 10: IMPACT & CLOSING

**[Metric Improvement]**

---

**Script:**

> "**Business impact:**
>
> - Surat Jalan input: 10-15 minutes → 30 seconds
> - Human error: significantly reduced because of AI extraction
> - Info access: technicians can ask 24/7 via chatbot
> - Data sync: real-time between SQL and vector DB
>
> **What I'm proud of:**
> I built AI features from zero to production — not a tutorial or exercise, but a system that is actually used by ToolCrib staff. I also fixed bugs myself, optimized retrieval, and improved accuracy.
>
> Thank you. I'm ready for questions."

---

## Q&A PREPARATION

### Q1: Why Ollama / local LLM? Why not ChatGPT?

> "Three reasons: **Privacy** — ToolCrib data cannot leave to third-party. **Offline** — it works without internet. **Cost** — no subscription fee."

### Q2: What if the LLM makes mistakes / hallucinates?

> "That's why I built the **confidence threshold** + retrieval validation. The LLM can only answer BASED ON context from ChromaDB. Distance > 1.40 is immediately rejected. Plus **intent-based field masking** — so even if the LLM tries to hallucinate, irrelevant fields are already masked."

### Q3: Why 500 chars chunk? Why not 1000 or 2000?

> "It's a tradeoff between granularity and context. 500 chars is enough to store 1 complete item. Smaller chunks = more precise retrieval. 50 char overlap so information isn't cut off at boundaries."

### Q4: Why vector DB instead of regular SQL?

> "SQL is great for exact match — WHERE sku = 'BRG-MEA-097'. But for natural language questions like 'digital vernier caliper', SQL can't do it. Vector DB converts text to numbers — 'digital caliper' still matches 'vernier caliper digital'."

### Q5: Do you only know AI, or are you full-stack?

> "End-to-end. From PDF ingestion, vector embedding, retrieval algorithm, LLM integration, all the way to React frontend integration. Including debugging and fixing bugs — like the notes hallucination bug I mentioned."

### Q6: How do you handle new items added to Supabase?

> "Through the `/api/sync-chroma` endpoint. Whenever there's an update in Supabase, this endpoint is called, the data is embedded again, and upserted to ChromaDB. The cache is also cleared so the data is immediately searchable."
