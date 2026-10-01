# SCRIPT PRESENTASI — AI ENGINEER GENERATIVE
## Durasi: ~10-15 menit | Q&A: ~5-10 menit

---

## SLIDE 1: TITLE
**[AI-POWERED TOOLCRIB INVENTORY SYSTEM]**

---

**Script:**
> "Selamat pagi/Siang, nama saya [Nama]. Hari ini saya akan menjelaskan kontribusi saya sebagai **AI Engineer Generative** di project ToolCrib ini.
>
> Ada tiga fitur utama yang saya bangun:
> 1. **Chatbot AI Interaktif** — teknisi bisa tanya info tool crib dalam Bahasa Indonesia
> 2. **Auto-Fill PDF Form** — ekstraksi data Surat Jalan otomatis
> 3. **Live Data Sync** — sinkronisasi real-time antara database SQL dan vector store"

---

## SLIDE 2: OVERVIEW — APA MASALAHNYA?
**[ToolCrib Problem]**

---

**Script:**
> "ToolCrib adalah gudang perkakas di PT Mattel Indonesia. Ada 100+ item suku cadang MRO — bearing, caliper, pneumatic cylinder, dan lain-lain.
>
> **Masalah #1** — Teknisi mau tahu info barang: di mana lokasinya, spesifikasinya, kapan kalibrasi. Prosesnya manual, harus ke warehouse.
>
> **Masalah #2** — Ketika ada Surat Jalan masuk, staff harus input manual ke sistem. 1 Surat Jalan bisa punya 10 item. Sering salah ketik.
>
> **Masalah #3** — Database inventory di PostgreSQL dan vector search di ChromaDB harus selalu sinkron.
>
> Saya membangun AI untuk menyelesaikan ketiga masalah ini."

---

## SLIDE 3: ARSITEKTUR SISTEM
**[Microservices + RAG Pipeline]**

---

**Script:**
> "Ini adalah arsitektur microservices.
>
> **Predictive AI** (port 8000) — untuk forecasting, ABC/XYZ classification, duplicate detection.
>
> **Generative AI** (port 8001) — ini yang saya bangun. Terdiri dari:
> - FastAPI sebagai API server
> - ChromaDB sebagai vector database
> - Ollama/Llama 3 sebagai LLM lokal
>
> Data mengalir dari **Supabase PostgreSQL** ke **ChromaDB** melalui endpoint sync. Frontend Next.js consume kedua service ini.
>
> **Kenapa microservices?** Karena AI generatif dan AI prediktif punya karakteristik berbeda — generatif butuh LLM dan vector DB, prediktif butuh statistical models. Dengan pisah, masing-masing bisa di-scale independent."

---

## SLIDE 4: ARSITEKTUR RAG — 3-LAYER RETRIEVAL
**[Pipeline Diagram]**

---

**Script:**
> "Ini adalah jantung dari chatbot AI — RAG Pipeline, Retrieval-Augmented Generation.
>
> **Tahap 1 — Ingestion:**
> Saya olah PDF ToolCrib dataset dengan **PDFPlumber** — saya pilih ini karena preserve table structure, berbeda dengan PyPDF yang hancurin. Saya detect SKU pattern BRG-XXX-NNN. Setiap item di-chunk jadi 500 karakter dengan overlap 50. Chunk di-embed pakai HuggingFace all-MiniLM-L6-v2 — ringan, cepat, dan akurat untuk kode alfanumerik. Disimpan di ChromaDB.
>
> **Tahap 2 — Retrieval (3 Layer):**
> Ketika teknisi tanya, ada 3 layer retrieval berurutan:
>
> *Layer 1 — Exact Metadata Location:* Kalau user tanya 'Rak A', saya langsung scan metadata, bypass embeddings sepenuhnya. Hasil: distance = 0.0, confidence = EXACT.
>
> *Layer 2 — Exact SKU Match:* Kalau user ketik 'BRG-MEA-097', langsung dapat semua data oleh SKU code.
>
> *Layer 3 — Semantic Search:* Untuk pertanyaan natural language. Saya pakai hybrid scoring — embedding similarity plus keyword boost, exact word match boost, dan location boost. Distance di bawah 1.40 masuk hasil, di atas itu di-reject.
>
> **Tahap 3 — SKU Deduplication:**
> 1 item bisa punya 3-4 chunk. Saya deduplicate berdasarkan SKU, dan kalau location query, saya prioritaskan chunk bertipe location. Priority: location > inspection > specification > calibration > purchase > description."

---

## SLIDE 5: FEATURE 1 — CHATBOT AI
**[Screenshot / Demo]**

---

**Script:**
> "Fitur pertama: Chatbot AI Interaktif. Teknisi bisa tanya dalam Bahasa Indonesia.
>
> Contoh pertanyaan:
> - 'Di mana digital vernier caliper?' → Rack R-2, Bin B-15, stok 5 unit
> - 'Tampilkan spesifikasi bearing' → Brand, model, technical specs
> - 'Barang apa di Rak A?' → Daftar semua barang di Rak A
> - 'BRG-MEA-097' → Full detail item
> - Upload PDF sementara → tanya langsung ke dokumen itu
>
> **Yang saya bangun:**
> - 3-layer retrieval system
> - Confidence threshold — distance > 1.40 langsung REJECTED
> - Intent detection — sistem otomatis tahu apakah mau lokasi, spec, kalibrasi, atau harga
> - Intent-based field masking — kalau tanya kalibrasi, yang muncul hanya tanggal kalibrasi, bukan harga
> - Session PDF memory — upload dokumen, tanya langsung
> - Graceful degradation — jalan tanpa Ollama (retrieval-only mode)"

---

## SLIDE 6: FEATURE 2 — AUTO-FILL PDF
**[Screenshot / Demo]**

---

**Script:**
> "Fitur kedua: Auto-Fill PDF Form. Staff upload Surat Jalan → AI isi form restock otomatis.
>
> **Workflow:**
> Upload PDF → PDFPlumber extract teks → LLM extract ke JSON {name, quantity, notes} → Fuzzy match ke master data → Form terisi.
>
> **Hasil:**
> Waktu input dari 10-15 menit jadi ~30 detik. Error rate berkurang drastis.
>
> **Bug yang pernah saya fix:**
> Semula, kalau Surat Jalan punya 3 item tapi hanya item pertama yang ada keterangan, semua 3 item malah dapat keterangan yang sama. Ini LLM hallucination.
>
> **Solusi:**
> 1. Prompt diperkuat — 'notes HANYA boleh diisi jika SECARA EKSPLISIT melekat pada barang tersebut, JANGAN copy antar item'
> 2. Frontend guard — kalau >= 2 item punya notes identik, kosongkan semua kecuali yang pertama"

---

## SLIDE 7: FEATURE 3 — LIVE SUPABASE-TO-CHROMADB SYNC
**[Diagram Sync Flow]**

---

**Script:**
> "Fitur ketiga yang saya bangun: Live Sync Endpoint.
>
> **Masalah:** ChromaDB dan Supabase harus sinkron. Kalau ada update stok di Supabase, ChromaDB harus ikut update.
>
> **Solusi:** Endpoint `/api/sync-chroma` yang:
> 1. Fetch data dari Supabase via REST API
> 2. Generate text chunks per tool
> 3. Generate embeddings
> 4. Upsert ke ChromaDB
> 5. Log status ke `ai_sync_logs` table
> 6. Clear in-memory SKU cache
>
> Hasilnya: data langsung searchable via chatbot tanpa delay."

---

## SLIDE 8: TECHNICAL DEEP DIVE — CONFIDENCE & INTENT
**[Scoring + Field Masking]**

---

**Script:**
> "Saya mau highlight 2 hal teknis yang menjadi diferensiasi:
>
> **Pertama — Confidence Threshold:**
> ChromaDB kasih distance score. Saya buat 4-tier filter:
> - Distance ≤ 1.00 → HIGH 🟢 — langsung pakai
> - Distance ≤ 1.20 → MEDIUM 🟡 — masih acceptable
> - Distance ≤ 1.40 → LOW 🟠 — tampilkan tapi ditandai
> - Distance > 1.40 → REJECTED 🔴 — tidak dipakai
>
> Ini mencegah LLM menjawab dari data yang tidak relevan — explainable AI.
>
> **Kedua — Intent-Based Field Masking:**
> Pertanyaan berbeda butuh field berbeda. Kalau user tanya kalibrasi, saya hanya kembalikan item name + calibration date. Harga, lokasi, semua di-mask jadi N/A. Ini mencegah noise di jawaban."

---

## SLIDE 9: SKILLS & TOOLS
**[Tech Stack Grid]**

---

**Script:**
> "Skill yang saya kuasai:
>
> **Prompt Engineering** — RAG prompt template, JSON extraction prompt, hallucination prevention
>
> **Vector Database** — ChromaDB setup, query, metadata filtering, deduplication, in-memory cache
>
> **Embedding Models** — all-MiniLM-L6-v2: lightweight ~80MB, CPU-friendly, akurat untuk SKU alphanumeric
>
> **PDF Processing** — PDFPlumber (preserve table structure), regex extraction
>
> **LLM Integration** — Ollama + Llama 3: local, privacy-preserving, no API cost
>
> **FastAPI** — REST API, async file upload, CORS, graceful degradation
>
> **Frontend Integration** — Next.js + Zustand, fuzzy matching, state management
>
> Semua berjalan di local environment — tidak butuh cloud service."

---

## SLIDE 10: IMPACT & CLOSING
**[Metric Improvement]**

---

**Script:**
> "**Impact bisnis:**
>
> - Input Surat Jalan: 10-15 menit → 30 detik
> - Human error: berkurang signifikan karena AI extraction
> - Akses info: teknisi bisa tanya 24/7 via chatbot
> - Data sync: real-time antara SQL dan vector DB
>
> **Yang membuat saya bangga:**
> Saya membangun fitur AI dari zero to production — bukan tutorial atau latihan, tapi sistem yang benar-benar dipakai staff ToolCrib. Saya juga sudah fix bug sendiri, optimasi retrieval, dan improve accuracy.
>
> Terima kasih. Saya siap untuk pertanyaan."

---

## PERSIAPAN Q&A

### Q1: Kenapa pakai Ollama / local LLM? Kenapa bukan ChatGPT?
> "Tiga alasan: **Privacy** — data ToolCrib tidak boleh keluar ke third-party. **Offline** — bisa jalan tanpa internet. **Cost** — tidak ada subscription fee."

### Q2: Gimana kalau LLM salah / hallucinate?
> "Makanya saya bangun **confidence threshold** + retrieval validation. LLM hanya boleh menjawab BERDASARKAN konteks dari ChromaDB. Distance > 1.40 langsung di-reject. Ditambah **intent-based field masking** — jadi即使 LLM mau hallucinate pun, field yang tidak relevan sudah di-mask."

### Q3: Kenapa chunk 500 chars? Kenapa tidak 1000 atau 2000?
> "Ini tradeoff antara granularity dan context. 500 chars cukup untuk menyimpan 1 item lengkap. Chunk lebih kecil = retrieval lebih precise. Overlap 50 chars supaya informasi tidak terpotong di boundary."

### Q4: Kenapa vector DB, bukan SQL biasa?
> "SQL bagus untuk exact match — WHERE sku = 'BRG-MEA-097'. Tapi untuk pertanyaan natural language seperti 'digital vernier caliper', SQL tidak bisa. Vector DB mengubah teks jadi angka — 'digital caliper' tetap ketemu meskipun yang di-database 'vernier caliper digital'."

### Q5: Kamu cuma ngerti AI-nya aja? Atau full-stack?
> "End-to-end. Dari PDF ingestion, vector embedding, retrieval algorithm, LLM integration, sampai ke frontend React integration. Termasuk debug dan fix bug — contoh bug notes hallucination yang sudah saya ceritakan."

### Q6: Bagaimana kamu handle kalau ada item baru di Supabase?
> "Lewat `/api/sync-chroma` endpoint. Setiap ada update di Supabase, endpoint ini di-call, data di-embed lagi, dan di-upsert ke ChromaDB. Cache juga di-clear supaya data langsung searchable."
