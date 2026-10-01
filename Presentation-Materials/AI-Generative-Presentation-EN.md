# PRESENTASI — AI ENGINEER GENERATIVE

## PTMI ToolCrib | Showcase Presentation

### Target: Juri Teknis Mattel + General Audience

---

## 📌 SLIDE 1: WHAT I BUILT

**Script (~30 seconds):**

> "As an AI Engineer Generative, I built **2 AI features** for ToolCrib:
>
> 1. **AI Chatbot** — technicians ask about tool crib info directly
> 2. **Auto-Fill PDF** — upload a Surat Jalan, restock form fills automatically
>
> Tech stack: **Ollama + Llama 3** (local LLM), **ChromaDB** (vector database), **HuggingFace embeddings** — 100% local, privacy-preserving, no API cost."

---

## 📌 SLIDE 2: FEATURE 1 — AI CHATBOT (DEMO)

**Script (~1.5 minutes):**

> "**Feature 1: Interactive AI Chatbot**
>
> Technicians don't need to open the database or go to the warehouse — just ask the chatbot.
>
> Example questions:
>
> - 'Where is the digital vernier caliper?' → Rack R-2, Bin B-15, stock 5 units
> - 'BRG-MEA-097' → Full item details
> - 'What items are in Rack A?' → List of items in Rack A
>
> **RAG Architecture (Retrieval-Augmented Generation):**
>
> - User asks → **ChromaDB** finds relevant data → **Llama 3** generates answer
> - Confidence threshold: retrieval results below threshold, and then answered
> - Intent detection: system automatically knows if user wants location, specs, or price
>
> **Why RAG, not direct LLM?**
>
> - LLM has knowledge cutoff — doesn't know internal data
> - LLM can hallucinate — gives made-up answers
> - RAG ensures answers are based on actual database data"

**[DEMO: Open chatbot, ask 1 example question]**

---

## 📌 SLIDE 3: FEATURE 2 — AUTO-FILL PDF (DEMO)

**Script (~1 minute):**

> "**Feature 2: Auto-Fill PDF Form**
>
> **Problem:** Staff had to manually type from Surat Jalan to the system. 1 document, 10-15 minutes, often with mistakes.
>
> **Solution:** Upload PDF → AI extracts data → form fills automatically.
>
> Process:
>
> 1. **PDFPlumber** extracts text from Surat Jalan
> 2. **Llama 3** extracts to JSON: {item name, quantity, notes}
> 3. **Fuzzy matching** — AI matches names to master data
> 4. Form fills automatically
>
> **Bug I fixed:** Initially AI copied notes from item 1 to all items — that was LLM hallucination. I fixed the prompt + added frontend guard."

**[DEMO: Upload 1 Surat Jalan PDF, show form fills]**

---

## 📌 SLIDE 4: IMPACT & SKILLS

**Script (~45 seconds):**

> "**Impact:**
>
> | Metric            | Before                 | After           |
> | ----------------- | ---------------------- | --------------- |
> | Surat Jalan input | ~15 minutes            | ~30 seconds     |
> | Error rate        | High                   | Low             |
> | Info access       | Had to go to warehouse | Ask the chatbot |
>
> **Skills I mastered:**
>
> - **Prompt Engineering** — RAG prompts, JSON extraction, hallucination handling
> - **Vector Database** — ChromaDB, embedding models
> - **PDF Processing** — PDFPlumber, regex extraction
> - **LLM Integration** — Ollama + Llama 3 (local, privacy-preserving)
> - **FastAPI** — REST API, async handling

---

## 📌 SLIDE 5: CLOSING

**Script (~15 seconds):**

> "Thank you. I'm ready for questions."

---

## 💬 Q&A PREPARATION

### Q1: Why Ollama / local LLM? Why not ChatGPT?

> "Three reasons: **Privacy** — tool crib data must not leave to third-party. **Offline** — works without internet. **Cost** — no API subscription fee."

### Q2: What if the LLM gives wrong answers / hallucinates?

> "There's a **confidence threshold** — if distance > 1.40, retrieval results are rejected. AI only answers when data from ChromaDB is relevant. Plus **intent-based masking** — irrelevant fields are masked."

### Q3: Why Vector DB? Why not regular SQL?

> "SQL is great for exact match — WHERE sku = 'BRG-MEA-097'. But for natural language questions like 'digital caliper', SQL can't. Vector DB converts text to numbers — 'digital caliper' still matches 'vernier caliper digital'."

### Q4: Are you full-stack or AI-only?

> "I focus on AI, but I understand end-to-end — from PDF ingestion, vector embedding, retrieval algorithm, to React frontend integration."

### Q5: Why 500 chars chunk?

> "Tradeoff between granularity and context. 500 chars is enough for 1 complete item. Smaller chunks = more precise retrieval. 50 char overlap prevents info from being cut at boundaries."
