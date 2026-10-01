# PRESENTASI — AI ENGINEER GENERATIVE
## PTMI ToolCrib | Showcase Presentation
### Target: Juri Teknis Mattel + General Audience

---

## 📌 SLIDE 1: APA YANG SAYA BANGUN

**Script (~30 detik):**

> "Saya sebagai AI Engineer Generative membangun **2 fitur AI** untuk ToolCrib:
>
> 1. **Chatbot AI** — teknisi bisa tanya info tool crib langsung dalam Bahasa Indonesia
> 2. **Auto-Fill PDF** — upload Surat Jalan, form restock terisi otomatis
>
> Tech stack: **Ollama + Llama 3** (local LLM), **ChromaDB** (vector database), **HuggingFace embeddings** — 100% local, privacy-preserving, no API cost."

---

## 📌 SLIDE 2: FITUR 1 — CHATBOT AI (DEMO)

**Script (~1.5 menit):**

> "**Fitur 1: Interactive AI Chatbot**
>
> Teknisi tidak perlu buka database atau ke warehouse — cukup tanya ke chatbot.
>
> Contoh pertanyaan:
> - 'Di mana digital vernier caliper?' → Rack R-2, Bin B-15, stok 5 unit
> - 'BRG-MEA-097' → Full detail item
> - 'Barang apa saja di Rak A?' → Daftar item di Rak A
>
> **Arsitektur RAG (Retrieval-Augmented Generation):**
> - User tanya → **ChromaDB** cari data relevan → **Llama 3** generate jawaban
> - Confidence threshold: hasil retrieval di bawah threshold, baru dijawab
> - Intent detection: sistem otomatis tahu apakah user mau lokasi, spesifikasi, atau harga
>
> **Kenapa RAG, bukan direct LLM?**
> - LLM punya knowledge cutoff — tidak tahu data internal
> - LLM bisa hallucinate — memberikan jawaban asal
> - RAG memastikan jawaban berdasarkan data aktual dari database"

**[DEMO: Buka chatbot, tanya 1 pertanyaan]**

---

## 📌 SLIDE 3: FITUR 2 — AUTO-FILL PDF (DEMO)

**Script (~1 menit):**

> "**Fitur 2: Auto-Fill PDF Form**
>
> **Problem:** Staff harus input manual dari Surat Jalan ke sistem. 1 dokumen, 10-15 menit, sering salah ketik.
>
> **Solution:** Upload PDF → AI extract data → form terisi otomatis.
>
> Proses:
> 1. **PDFPlumber** extract teks dari Surat Jalan
> 2. **Llama 3** extract ke JSON: {nama barang, quantity, notes}
> 3. **Fuzzy matching** — AI cocokkan nama ke master data
> 4. Form terisi otomatis
>
> **Yang saya fix:** Awalnya AI copy notes dari item 1 ke semua item — itu LLM hallucination. Saya perbaiki prompt + tambah frontend guard."

**[DEMO: Upload 1 Surat Jalan, show form terisi]**

---

## 📌 SLIDE 4: IMPACT & SKILLS

**Script (~45 detik):**

> "**Impact:**
>
> | Metric | Sebelum | Sesudah |
> |--------|---------|---------|
> | Input Surat Jalan | ~15 menit | ~30 detik |
> | Error rate | Tinggi | Minim |
> | Akses info | Harus ke warehouse | Tanya chatbot |
>
> **Skills yang saya kuasai:**
> - **Prompt Engineering** — RAG prompt, JSON extraction, hallucination handling
> - **Vector Database** — ChromaDB, embedding models
> - **PDF Processing** — PDFPlumber, regex extraction
> - **LLM Integration** — Ollama + Llama 3 (local, privacy-preserving)
> - **FastAPI** — REST API, async handling

---

## 📌 SLIDE 5: CLOSING

**Script (~15 detik):**

> "Terima kasih. Saya siap untuk pertanyaan."

---

## 💬 Q&A PERSIAPAN

### Q1: Kenapa Ollama / local LLM? Kenapa bukan ChatGPT?
> "Tiga alasan: **Privacy** — data tool crib tidak boleh keluar ke third-party. **Offline** — bisa jalan tanpa internet. **Cost** — tidak ada biaya API."

### Q2: Gimana kalau LLM salah / hallucinate?
> "Ada **confidence threshold** — kalau distance > 1.40, hasil retrieval di-reject. AI hanya boleh jawab kalau data dari ChromaDB yang relevan. Ditambah **intent-based masking** — field yang tidak sesuai intent langsung di-mask."

### Q3: Kenapa Vector DB? Kenapa bukan SQL biasa?
> "SQL bagus untuk exact match — WHERE sku = 'BRG-MEA-097'. Tapi untuk pertanyaan natural language seperti 'digital caliper', SQL tidak bisa. Vector DB mengubah teks jadi angka — 'digital caliper' tetap ketemu dengan 'vernier caliper digital'."

### Q4: Kamu full-stack atau cuma AI?
> "Saya focus di AI, tapi paham end-to-end — dari PDF ingestion, vector embedding, retrieval algorithm, sampai ke React frontend integration."

### Q5: Kenapa chunk 500 chars?
> "Tradeoff antara granularity dan context. 500 chars cukup untuk 1 item lengkap. Chunk lebih kecil = retrieval lebih precise. Overlap 50 chars supaya informasi tidak terpotong di boundary."
