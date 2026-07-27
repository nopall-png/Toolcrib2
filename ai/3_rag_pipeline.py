# ==============================================================================
# 3_rag_pipeline.py
# ==============================================================================
# PTMI ToolCrib AI Assistant — RAG Pipeline
# ==============================================================================
#
# PURPOSE:
#   Full Retrieval-Augmented Generation pipeline. Retrieves relevant context
#   from ChromaDB, feeds it to an LLM (Ollama/Llama 3), and returns
#   structured answers with SKU metadata.
#
#   Includes similarity threshold filtering to prevent hallucinated retrieval
#   results. Only results above the confidence threshold are used as context.
#
# MODES:
#   1. RETRIEVAL-ONLY (default) — Works without Ollama.
#      Returns formatted context from ChromaDB with SKU metadata.
#
#   2. FULL RAG (with Ollama/Llama 3) — Generates natural language answers.
#      Requires: ollama pull llama3
#
# CONFIDENCE LEVELS:
#   distance <= 1.00  → HIGH   (strong semantic match)
#   1.00 < d <= 1.20  → MEDIUM (acceptable match)
#   1.20 < d <= 1.40  → LOW    (weak match, flagged)
#   distance > 1.40   → REJECT (not used as context)
#
# PREREQUISITES:
#   Run 1_ingest_data.py first to populate ChromaDB.
#
# USAGE:
#   python 3_rag_pipeline.py                    # Retrieval-only mode (Technician default)
#   python 3_rag_pipeline.py --debug            # Debug mode (displays stats/scores)
#   python 3_rag_pipeline.py --use-llm          # Full RAG with Ollama
#   python 3_rag_pipeline.py --query "your question here"
#
# ==============================================================================

import os
import sys
import re
import json
import argparse

# Force UTF-8 encoding for standard streams on Windows to prevent UnicodeEncodeError
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# ==============================================================================
# SHARED RETRIEVAL ENGINE
# ==============================================================================
# All retrieval logic (constants, confidence helpers, chunk type classifier,
# SKU deduplication, hybrid search) is imported from the shared module.

from retrieval_engine import (
    CHROMA_DB_DIR, COLLECTION_NAME, EMBEDDING_MODEL, TOP_K,
    CONFIDENCE_HIGH, CONFIDENCE_MEDIUM, CONFIDENCE_LOW,
    LOCATION_INTENT_KEYWORDS,
    get_confidence_level, get_confidence_icon,
    _get_chunk_type, _deduplicate_by_sku,
    search_query, initialize_retrieval,
    _merge_sku_chunks, _generate_structured_answer,
    detect_query_intent,
    DEBUG_MODE,
)

# ==============================================================================
# OLLAMA / LLM CONFIGURATION
# ==============================================================================

OLLAMA_MODEL = "llama3"
OLLAMA_BASE_URL = "http://localhost:11434"

# RAG Prompt Template — instructs LLM to use ToolCrib context and return SKU
RAG_PROMPT_TEMPLATE = """Anda adalah Asisten AI PTMI ToolCrib, sebuah sistem pakar untuk
manajemen suku cadang dan perkakas mesin di PT Mattel Indonesia.

Peran Anda:
- Menjawab pertanyaan teknisi tentang alat, suku cadang, dan inventaris.
- Selalu sebutkan kode SKU (Stock Keeping Unit) di setiap jawaban Anda.
- Jelaskan spesifikasi teknis dengan detail dan akurat.
- Jika konteks tidak memiliki jawabannya, katakan "Saya tidak memiliki informasi tersebut di database ToolCrib."

ATURAN KETAT:
- BAHASA UTAMA: Anda WAJIB membalas dengan Bahasa Indonesia secara penuh (100%).
- DILARANG KERAS menggunakan sapaan Bahasa Inggris seperti "Hello", "I'd be happy to help", "Sure", dsb.
- Gunakan sapaan Bahasa Indonesia seperti "Halo!", "Tentu, saya bantu carikan...", atau "Berikut adalah data yang Anda minta:".
- FORMAT TULISAN: JANGAN PERNAH menggunakan simbol asterisk (*) untuk membuat daftar/list. Sebagai gantinya, gunakan tanda strip (-) atau emoji (✅, 🔹, 📍) agar tampilan bersih dan rapi.
- Buatlah paragraf yang berjarak dan mudah dibaca oleh teknisi.

KONTEKS DARI DATABASE TOOLCRIB:
{context}

PERTANYAAN TEKNISI:
{question}

INSTRUKSI UNTUK ANDA:
1. Jawab pertanyaan HANYA berdasarkan konteks yang diberikan di atas.
2. Sertakan kode SKU yang relevan pada jawaban Anda secara jelas.
3. Bersikaplah ramah, sopan, dan interaktif menggunakan 100% BAHASA INDONESIA.
4. Jika ada beberapa barang yang relevan, sebutkan semuanya dengan jelas beserta SKU-nya.
5. Gunakan emoji sewajarnya agar percakapan lebih hidup dan tidak kaku.

JAWABAN (DALAM BAHASA INDONESIA):"""


# ==============================================================================
# RETRIEVAL LAYER
# ==============================================================================

class ToolCribRetriever:
    """
    Retrieval engine for the ToolCrib vector database.
    Wraps the shared retrieval_engine module with a class-based interface.
    """

    def __init__(self):
        """Initialize ChromaDB connection and embedding model."""
        print("[INIT] Initializing ToolCrib Retriever...")

        self.collection, self.embeddings = initialize_retrieval()

    def retrieve(self, query: str, top_k: int = TOP_K) -> dict:
        """
        Search ChromaDB using the shared hybrid search engine.

        Returns dict with keys: "primary", "candidates", "rejected_count", "stats"
        """
        from retrieval_engine import detect_query_intent
        intent = detect_query_intent(query)
        if intent == "aggregation":
            top_k = 100

        raw_result = search_query(
            self.collection, self.embeddings, query, top_k
        )

        dedup = raw_result["dedup_stats"]
        primary = raw_result["primary"]
        candidates = raw_result["candidates"]

        stats = {
            "primary_count": len(primary),
            "candidate_count": len(candidates),
            "rejected_count": raw_result["rejected_count"],
            "raw_chunks": dedup["raw_chunks"],
            "unique_skus": dedup["unique_skus"],
            "duplicates_removed": dedup["duplicates_removed"],
            "location_intent": dedup["location_intent"],
            "location_chunk_selected": dedup["location_chunk_selected"],
        }
        if "no_match_msg" in dedup:
            stats["no_match_msg"] = dedup["no_match_msg"]

        if primary:
            distances = [r["distance"] for r in primary]
            stats["avg_score"] = sum(distances) / len(distances)
            stats["best_score"] = min(distances)
            stats["worst_score"] = max(distances)
        else:
            stats["avg_score"] = None
            stats["best_score"] = None
            stats["worst_score"] = None

        return {
            "primary": primary,
            "candidates": candidates,
            "rejected_count": raw_result["rejected_count"],
            "stats": stats
        }


# ==============================================================================
# RAG PIPELINE
# ==============================================================================

class ToolCribRAG:
    """
    Full RAG pipeline for the ToolCrib AI Assistant.
    Supports retrieval-only and full LLM RAG mode.
    """

    def __init__(self, use_llm: bool = False):
        """
        Initialize the RAG pipeline.
        """
        self.retriever = ToolCribRetriever()
        self.use_llm = use_llm
        self.llm = None
        self.session_pdf_text = ""
        self.session_pdf_name = ""

        if use_llm:
            self._init_llm()

    def _init_llm(self):
        """
        Initialize Ollama LLM connection.
        """
        print(f"\n[LLM] Attempting to connect to Ollama ({OLLAMA_MODEL})...")
        try:
            from langchain_community.llms import Ollama
            self.llm = Ollama(
                model=OLLAMA_MODEL,
                base_url=OLLAMA_BASE_URL,
                temperature=0.1,
            )
            self.llm.invoke("test")
            print(f"  → Connected to Ollama ({OLLAMA_MODEL}) ✓")
        except ImportError:
            print(f"  → langchain-community Ollama not installed.")
            print(f"  → Falling back to retrieval-only mode.")
            self.use_llm = False
            self.llm = None
        except Exception as e:
            print(f"  → Ollama not available: {e}")
            print(f"  → Falling back to retrieval-only mode.")
            self.use_llm = False
            self.llm = None

    def query(self, question: str) -> dict:
        """
        Process a technician question through the RAG pipeline.
        """
        # --- Pre-retrieval / Capabilities / Greeting Interceptor ---
        q_clean = question.strip().lower()
        # Remove common trailing punctuation
        q_clean = re.sub(r'[?.,!]$', '', q_clean).strip()
        
        greetings = {"hello", "hi", "hey", "halo", "selamat pagi", "selamat siang", "selamat sore"}
        help_queries = {
            "what can you do", 
            "what we can do", 
            "what kind of question you can ask", 
            "what kind of question can i ask",
            "what kind of questions can i ask",
            "what kind of question",
            "apa saja yang bisa kamu lakukan",
            "apa saja yang bisa",
            "pertanyaan seperti apa yang bisa saya tanyakan",
            "pertanyaan seperti apa",
            "bisa bantu apa saja",
            "help", 
            "how to use", 
            "how to use this tool", 
            "fitur", 
            "bantuan"
        }
        
        if q_clean in greetings:
            answer = (
                "Hello! I am the **PTMI ToolCrib AI Assistant**. "
                "I can help you search, locate, and verify all 100 items in our machine tool crib inventory.\n\n"
                "Try asking me about:\n"
                "- **Storage Locations** (e.g., *'Where is the digital vernier caliper?'*)\n"
                "- **Specifications** (e.g., *'Show me bearing specifications'*)\n"
                "- **Calibration Schedules** (e.g., *'Which items need calibration?'*)\n"
                "- **Exact SKU Code** (e.g., *'BRG-MEA-097'*)\n\n"
                "What can I look up for you today?"
            )
            return {
                "answer": answer,
                "sku": None,
                "confidence": "HIGH",
                "merged_fields": None,
                "source_chunks": [],
                "candidate_chunks": [],
                "stats": {
                    "primary_count": 0,
                    "candidate_count": 0,
                    "rejected_count": 0,
                    "raw_chunks": 0,
                    "unique_skus": 0,
                    "duplicates_removed": 0,
                    "location_intent": "NO",
                    "location_chunk_selected": "NO"
                }
            }

        if any(hq in q_clean for hq in help_queries) or q_clean == "help":
            answer = (
                "Saya dapat membantu Anda mencari berbagai macam informasi mengenai inventaris ToolCrib:\n\n"
                "🔍 **1. Pencarian Kode SKU**\n"
                "Ketik kode SKU untuk mendapatkan informasi lengkap secara instan:\n"
                "- *BRG-MEA-097* atau *BRG-ELC-010*\n\n"
                "📍 **2. Pencarian Lokasi**\n"
                "Cari tahu di rak mana barang disimpan:\n"
                "- *'Di mana letak digital vernier caliper?'*\n"
                "- *'Barang apa saja yang ada di Rak R-2?'*\n\n"
                "⚙️ **3. Spesifikasi Teknis**\n"
                "Cek dimensi, merek, model, atau kapasitas alat:\n"
                "- *'Tampilkan spesifikasi bearing'* atau *'Detail model pneumatic cylinder'*\n\n"
                "📅 **4. Status Kalibrasi & Inspeksi**\n"
                "Cari tahu kapan jadwal kalibrasi alat selanjutnya:\n"
                "- *'Barang apa yang butuh kalibrasi?'* atau *'Bagaimana riwayat inspeksi BRG-MEA-097?'*\n\n"
                "💰 **5. Harga & Data Pembelian**\n"
                "Cek harga satuan dan total nilai aset:\n"
                "- *'Berapa harga digital vernier caliper?'*\n\n"
                "Ketik saja pertanyaan Anda, dan saya akan mencarinya di database!"
            )
            return {
                "answer": answer,
                "sku": None,
                "confidence": "HIGH",
                "merged_fields": None,
                "source_chunks": [],
                "candidate_chunks": [],
                "stats": {
                    "primary_count": 0,
                    "candidate_count": 0,
                    "rejected_count": 0,
                    "raw_chunks": 0,
                    "unique_skus": 0,
                    "duplicates_removed": 0,
                    "location_intent": "NO",
                    "location_chunk_selected": "NO"
                }
            }

        # Step 1: Retrieve with 3-tier filtering
        retrieval = self.retriever.retrieve(question, top_k=TOP_K)
        primary = retrieval["primary"]
        candidates = retrieval["candidates"]
        rejected_count = retrieval["rejected_count"]
        stats = retrieval["stats"]

        has_session_doc = bool(self.session_pdf_text)

        # Handle Case: Location query with empty match (Priority 1)
        if not primary and stats and "no_match_msg" in stats and not has_session_doc:
            return {
                "answer": stats["no_match_msg"],
                "sku": None,
                "confidence": "HIGH",
                "merged_fields": None,
                "source_chunks": [],
                "candidate_chunks": [],
                "stats": stats
            }

        # Intercept general capability questions/greetings
        query_lower = question.lower()
        greetings = ["apa saja", "what can you", "halo", "hi", "hello", "pertanyaan seperti", "what kind", "bisa bantu", "help"]
        if any(g in query_lower for g in greetings) and not primary and not has_session_doc:
            intro_msg = "Halo! Saya adalah ToolCrib AI Copilot. Saya bisa membantu Anda mencari informasi mengenai stok barang, spesifikasi suku cadang (SKU), dan inventaris di PT Mattel Indonesia berdasarkan data database ToolCrib. Anda juga bisa mengunggah dokumen PDF (seperti PR) untuk saya baca. Ada spesifikasi atau barang tertentu yang ingin dicari?"
            return {
                "answer": intro_msg,
                "sku": None,
                "confidence": "HIGH",
                "merged_fields": None,
                "source_chunks": [],
                "candidate_chunks": [],
                "stats": stats if stats else {}
            }

        # Handle Case: generic no results
        if not primary and not has_session_doc:
            return {
                "answer": "Saya tidak memiliki informasi tersebut di database ToolCrib.",
                "sku": None,
                "confidence": None,
                "merged_fields": None,
                "source_chunks": [],
                "candidate_chunks": [
                    {
                        "chunk_id": c["chunk_id"],
                        "sku": c["sku"],
                        "confidence": "LOW",
                        "relevance_score": round(c["distance"], 4),
                        "embedding_score": round(c.get("embedding_score", c["distance"]), 4),
                        "keyword_boost": round(c.get("keyword_boost", 0.0), 4),
                        "location_boost": round(c.get("location_boost", 0.0), 4),
                        "text_preview": c["text"][:200]
                    }
                    for c in candidates
                ],
                "stats": stats
            }

        # Step 2: Build context from PRIMARY results only
        context_parts = []
        skus = []
        for r in primary:
            context_parts.append(r["text"])
            if re.match(r'^BRG-[A-Z]{3}-\d{3}$', r["sku"]):
                skus.append(r["sku"])

        context = "\n\n---\n\n".join(context_parts)

        # If a temporary session document is loaded, prepend it to the context
        if has_session_doc:
            session_context = f"[TEMPORARY UPLOADED FILE CONTENT ({self.session_pdf_name})]:\n{self.session_pdf_text}"
            if context:
                context = f"{session_context}\n\n---\n\n[PERSISTENT DATABASE INVENTORY CONTEXT]:\n{context}"
            else:
                context = session_context

        primary_sku = skus[0] if skus else None
        primary_confidence = primary[0]["confidence"] if primary else "EXACT"

        # Rebuild merged fields for the best SKU
        merged_fields = None
        if primary_sku:
            try:
                sku_results = self.retriever.collection.get(where={"sku": primary_sku})
                all_chunks = sku_results["documents"] if sku_results and sku_results["documents"] else [r["text"] for r in primary if r["sku"] == primary_sku]
            except Exception:
                all_chunks = [r["text"] for r in primary if r["sku"] == primary_sku]
            
            # Apply intent filtering on all_chunks to match Priority 2
            from retrieval_engine import detect_query_intent, _get_chunk_type, is_chunk_relevant_to_intent
            intent = detect_query_intent(question)
            filtered_chunks = []
            for chunk in all_chunks:
                chunk_type = _get_chunk_type(chunk)
                if not is_chunk_relevant_to_intent(chunk, chunk_type, intent):
                    continue
                filtered_chunks.append(chunk)
            all_chunks = filtered_chunks

            merged_fields = _merge_sku_chunks(all_chunks, intent=intent)

        # Step 3: Generate answer
        query_lower = question.lower()
        
        from retrieval_engine import extract_location_target
        targets = extract_location_target(question)
        has_location_target = bool(targets["rack"] or targets["bin"] or targets["warehouse"])
        sku_pattern = r'BRG-[A-Z]{3}-\d{3}'
        has_sku = bool(re.search(sku_pattern, question.upper()))
        
        is_list_query = not has_sku and (has_location_target or any(kw in query_lower for kw in [
            "which tools", "which items", "what hand tools", 
            "what tools", "list of", "show me all", "what is stored in",
            "items in", "tools in", "show tools", "show items",
            "list tools", "list items", "show me tools", "show me items"
        ]))

        # If we have a session document, always dispatch to LLM to summarize/discuss
        if self.use_llm and self.llm and (not is_list_query or has_session_doc):
            try:
                answer = self._generate_with_llm(question, context)
            except Exception as e:
                answer = self._generate_without_llm(question, primary, candidates)
        else:
            answer = self._generate_without_llm(question, primary, candidates)

        # Force EXACT confidence for exact SKU queries
        is_sku_query = bool(re.search(r'BRG-[A-Z]{3}-\d{3}', question.upper()))
        if is_sku_query:
            primary_confidence = "EXACT"

        # Step 4: Build response with separated tiers
        response = {
            "answer": answer,
            "sku": primary_sku,
            "confidence": primary_confidence,
            "merged_fields": merged_fields,
            "source_chunks": [
                {
                    "chunk_id": r["chunk_id"],
                    "sku": r["sku"],
                    "confidence": r["confidence"],
                    "relevance_score": round(r["distance"], 4),
                    "embedding_score": round(r.get("embedding_score", r["distance"]), 4),
                    "keyword_boost": round(r.get("keyword_boost", 0.0), 4),
                    "location_boost": round(r.get("location_boost", 0.0), 4),
                    "text_preview": r["text"][:200]
                }
                for r in primary
            ],
            "candidate_chunks": [
                {
                    "chunk_id": c["chunk_id"],
                    "sku": c["sku"],
                    "confidence": "LOW",
                    "relevance_score": round(c["distance"], 4),
                    "embedding_score": round(c.get("embedding_score", c["distance"]), 4),
                    "keyword_boost": round(c.get("keyword_boost", 0.0), 4),
                    "location_boost": round(c.get("location_boost", 0.0), 4),
                    "text_preview": c["text"][:200]
                }
                for c in candidates
            ],
            "stats": stats
        }

        return response

    def _generate_with_llm(self, question: str, context: str) -> str:
        """
        Generate answer using Ollama/Llama 3.
        """
        prompt = RAG_PROMPT_TEMPLATE.format(
            context=context,
            question=question
        )
        try:
            answer = self.llm.invoke(prompt)
            return answer.strip()
        except Exception as e:
            return self._format_context_answer(context)

    def _generate_without_llm(self, question: str,
                               primary: list, candidates: list) -> str:
        """
        Generate a formatted, non-hallucinated natural language summary
        without LLM by parsing and merging the retrieved chunks.
        """
        if not primary:
            return "Saya tidak memiliki informasi tersebut di database ToolCrib."

        query_lower = question.lower()

        # 1. Identify all unique SKUs in primary
        unique_skus = []
        seen = set()
        for r in primary:
            sku = r["sku"]
            if sku not in seen and sku != "MISSING":
                seen.add(sku)
                unique_skus.append(r)

        # 2. Check if this is a general list-oriented query
        is_list_query = any(kw in query_lower for kw in [
            "which tools", "which items", "what hand tools", 
            "what tools", "list of", "show me all", "what is stored in",
            "items in", "tools in", "show tools", "show items",
            "list tools", "list items"
        ])

        if is_list_query and len(unique_skus) > 1:
            items_list = []
            for r in unique_skus:
                sku = r["sku"]
                try:
                    sku_results = self.retriever.collection.get(where={"sku": sku})
                    chunks = sku_results["documents"] if sku_results and sku_results["documents"] else [r["text"]]
                except Exception:
                    chunks = [r["text"]]
                
                merged = _merge_sku_chunks(chunks)
                item_name = merged.get("item_name", "Unknown Item")
                
                if "stored" in query_lower or "rack" in query_lower or "bin" in query_lower or "where" in query_lower:
                    rack = merged.get('rack', 'N/A')
                    bin_loc = merged.get('bin', 'N/A')
                    loc_parts = []
                    if rack != "N/A":
                        loc_parts.append(rack if rack.lower().startswith("rack") else f"Rack {rack}")
                    if bin_loc != "N/A":
                        loc_parts.append(bin_loc if bin_loc.lower().startswith("bin") else f"Bin {bin_loc}")
                    loc_str = f" in {' '.join(loc_parts)}" if loc_parts else ""
                    items_list.append(f"- {item_name} ({sku}){loc_str}")
                else:
                    items_list.append(f"- {item_name} ({sku})")

            if "calibration" in query_lower or "calibrate" in query_lower:
                return "The following tools require periodic calibration:\n" + "\n".join(items_list)
            else:
                return "The following tools were found in the ToolCrib inventory:\n" + "\n".join(items_list)

        # 3. Single SKU or exact SKU summary mode
        primary_sku = primary[0]["sku"]
        try:
            sku_results = self.retriever.collection.get(where={"sku": primary_sku})
            all_chunks = sku_results["documents"] if sku_results and sku_results["documents"] else [r["text"] for r in primary if r["sku"] == primary_sku]
        except Exception:
            all_chunks = [r["text"] for r in primary if r["sku"] == primary_sku]

        # Merge information
        intent = detect_query_intent(question)
        merged = _merge_sku_chunks(all_chunks, intent=intent)

        # Generate the structured natural language response
        return _generate_structured_answer(merged, question, primary_sku)

    def _format_context_answer(self, context: str) -> str:
        """Fallback: format raw context as answer."""
        return f"Based on the ToolCrib database:\n\n{context[:500]}"


# ==============================================================================
# OUTPUT FORMATTING
# ==============================================================================

def print_response(response: dict, query: str = "") -> None:
    """
    Pretty-print the RAG response in a readable format.
    """
    import retrieval_engine
    
    sku_pattern = r'^BRG-[A-Z]{3}-\d{3}$'
    is_pure_sku_query = bool(re.match(sku_pattern, query.strip().upper())) if query else False

    def _print_sku_card(sku: str, merged: dict) -> None:
        print("==================================================")
        print("SKU INFORMATION")
        print("==================================================")
        print(f"SKU:          {sku}")
        if merged.get('item_name') != "N/A":
            print(f"Item:         {merged['item_name']}")
        if merged.get('brand') != "N/A":
            print(f"Brand:        {merged['brand']}")
        if merged.get('department') != "N/A":
            print(f"Department:   {merged['department']}")

        rack = merged.get('rack', 'N/A')
        bin_loc = merged.get('bin', 'N/A')
        loc_parts = []
        if rack != "N/A":
            loc_parts.append(rack if rack.lower().startswith("rack") else f"Rack {rack}")
        if bin_loc != "N/A":
            loc_parts.append(bin_loc if bin_loc.lower().startswith("bin") else f"Bin {bin_loc}")
        location_str = " ".join(loc_parts) if loc_parts else "N/A"

        if location_str != "N/A":
            print(f"Location:     {location_str}")
        if merged.get('warehouse') != "N/A":
            print(f"Warehouse:    {merged['warehouse']}")
        if merged.get('calibration_date') != "N/A":
            print(f"Calibration:  {merged['calibration_date']}")
        if merged.get('status') != "N/A":
            print(f"Status:       {merged['status']}")
        print()
        print("Confidence:   EXACT")
        print("==================================================")

    if not retrieval_engine.DEBUG_MODE:
        # Priority 3 User Mode: Show ONLY the final answer, unless it's a pure SKU query.
        if is_pure_sku_query and response["sku"] and response.get("merged_fields"):
            _print_sku_card(response["sku"], response["merged_fields"])
        else:
            print(f"\n{response['answer']}\n")
        return

    # Debug Mode: Show everything (scores, chunks, stats, JSON)
    is_sku_query = bool(re.search(r'BRG-[A-Z]{3}-\d{3}', query.upper())) if query else False

    if is_sku_query and response["sku"] and response.get("merged_fields"):
        merged = response["merged_fields"]
        print(f"\n{'─' * 70}")
        print(f"  ANSWER:")
        print(f"{'─' * 70}")
        print(f"\n{response['answer']}\n")

        _print_sku_card(response["sku"], merged)

        # Show JSON format for backend team reference
        print(f"\n{'─' * 70}")
        print(f"  JSON OUTPUT (for backend integration):")
        print(f"{'─' * 70}")
        json_output = {
            "answer": response["answer"],
            "sku": response["sku"],
            "confidence": "EXACT"
        }
        print(f"\n{json.dumps(json_output, indent=2, ensure_ascii=False)}\n")
        return

    # Fallback to standard formatted display for general/semantic queries in debug mode
    print(f"\n{'─' * 70}")
    print(f"  ANSWER:")
    print(f"{'─' * 70}")
    print(f"\n{response['answer']}\n")

    if response["sku"]:
        conf = response.get("confidence", "N/A")
        conf_icon = get_confidence_icon(conf) if conf else "⚪"
        print(f"  📦 Primary SKU:    {response['sku']}")
        print(f"  📊 Confidence:     {conf_icon} {conf}")

    print(f"\n  📋 Source Chunks (HIGH/MEDIUM):")
    if response["source_chunks"]:
        for chunk in response["source_chunks"]:
            conf = chunk.get("confidence", "N/A")
            conf_icon = get_confidence_icon(conf)
            print(f"     • {chunk['sku']}  {conf_icon} {conf}")
            print(f"       Embedding:      {chunk.get('embedding_score', 0.0):.2f}")
            print(f"       Keyword boost:  {chunk.get('keyword_boost', 0.0):.2f}")
            print(f"       Location boost: {chunk.get('location_boost', 0.0):.2f}")
            print(f"       Final score:    {chunk.get('relevance_score', 0.0):.4f}")
    else:
        print(f"     (no relevant chunks found)")

    # Show LOW candidates if any
    candidate_chunks = response.get("candidate_chunks", [])
    if candidate_chunks:
        print(f"\n  🟠 Possible matches (low confidence):")
        for chunk in candidate_chunks:
            print(f"     • {chunk['sku']}  🟠 LOW")
            print(f"       Embedding:      {chunk.get('embedding_score', 0.0):.2f}")
            print(f"       Keyword boost:  {chunk.get('keyword_boost', 0.0):.2f}")
            print(f"       Location boost: {chunk.get('location_boost', 0.0):.2f}")
            print(f"       Final score:    {chunk.get('relevance_score', 0.0):.4f}")

    # Show retrieval statistics
    stats = response.get("stats", {})
    if stats:
        print(f"\n  📈 Retrieval Stats:")
        print(f"     Primary:           {stats.get('primary_count', 0)}")
        print(f"     Candidates:        {stats.get('candidate_count', 0)}")
        print(f"     Rejected:          {stats.get('rejected_count', 0)}")
        if stats.get("avg_score") is not None:
            print(f"     Avg primary score: {stats['avg_score']:.4f}")
        print(f"     Raw chunks:        {stats.get('raw_chunks', 0)}")
        print(f"     Unique SKUs:       {stats.get('unique_skus', 0)}")
        print(f"     Duplicates removed:{stats.get('duplicates_removed', 0)}")
        print(f"\n  Location reranking statistics:")
        print(f"     Location intent:           {stats.get('location_intent', 'NO')}")
        print(f"     Location chunk selected:   {stats.get('location_chunk_selected', 'NO')}")

    # Show JSON format for backend team reference
    print(f"\n{'─' * 70}")
    print(f"  JSON OUTPUT (for backend integration):")
    print(f"{'─' * 70}")
    json_output = {
        "answer": response["answer"][:200] + "..."
                  if len(response["answer"]) > 200
                  else response["answer"],
        "sku": response["sku"],
        "confidence": response.get("confidence")
    }
    print(f"\n{json.dumps(json_output, indent=2, ensure_ascii=False)}\n")


# ==============================================================================
# INTERACTIVE REPL
# ==============================================================================

def interactive_repl(rag: ToolCribRAG) -> None:
    """
    Interactive Read-Eval-Print Loop for technician queries.
    """
    mode = "FULL RAG (Ollama)" if rag.use_llm else "RETRIEVAL-ONLY"

    print(f"\n{'=' * 70}")
    print(f"  PTMI TOOLCRIB AI ASSISTANT")
    print(f"  Mode: {mode}")
    print(f"  Confidence Filter: ON (thresholds: primary <= {CONFIDENCE_MEDIUM}, candidate <= {CONFIDENCE_LOW})")
    print(f"{'=' * 70}")
    print(f"  Ask me about tools, spare parts, and ToolCrib inventory.")
    print(f"  Type 'quit' to exit.\n")

    while True:
        try:
            question = input("👷 Technician: ").strip()
        except (KeyboardInterrupt, EOFError):
            break

        if not question:
            continue
        if question.lower() in ("quit", "exit", "q"):
            break

        # Process query
        response = rag.query(question)

        # Display response
        print_response(response, question)

    print("\n[EXIT] ToolCrib AI Assistant session ended.")


# ==============================================================================
# DEMO QUERIES
# ==============================================================================

def run_demo(rag: ToolCribRAG) -> None:
    """
    Run demonstration queries to showcase the RAG pipeline.
    """
    demo_queries = [
        "What tool is used for molding dimension inspection?",
        "Show me bearing specifications",
        "Which items are stored in rack A?",
    ]

    print(f"\n{'=' * 70}")
    print(f"  RAG PIPELINE DEMO (with Confidence Filtering)")
    print(f"{'=' * 70}")

    for i, query in enumerate(demo_queries, 1):
        print(f"\n{'=' * 70}")
        print(f"  DEMO QUERY {i}/{len(demo_queries)}")
        print(f"  \"{query}\"")
        print(f"{'=' * 70}")

        response = rag.query(query)
        print_response(response, query)

    print(f"\n{'=' * 70}")
    print(f"  DEMO COMPLETE")
    print(f"{'=' * 70}\n")


# ==============================================================================
# MAIN EXECUTION
# ==============================================================================

def main():
    """
    Main RAG pipeline entry point.
    """
    parser = argparse.ArgumentParser(
        description="PTMI ToolCrib AI Assistant — RAG Pipeline"
    )
    parser.add_argument(
        "--use-llm",
        action="store_true",
        help="Enable Ollama/Llama 3 for answer generation"
    )
    parser.add_argument(
        "--query",
        type=str,
        help="Run a single query and exit"
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run demonstration queries"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug mode to show scores, chunks, and statistics"
    )

    args = parser.parse_args()

    # Override DEBUG_MODE globally if --debug CLI flag is provided
    if args.debug:
        import retrieval_engine
        retrieval_engine.DEBUG_MODE = True

    print("=" * 70)
    print("PTMI TOOLCRIB AI ASSISTANT — RAG PIPELINE")
    print("(with Similarity Threshold & Confidence Filtering)")
    print("=" * 70)

    # Initialize RAG pipeline
    rag = ToolCribRAG(use_llm=args.use_llm)

    if args.query:
        # Single query mode
        print(f"\n  Query: \"{args.query}\"")
        response = rag.query(args.query)
        print_response(response, args.query)
    elif args.demo:
        # Demo mode
        run_demo(rag)
    else:
        # Interactive REPL mode
        run_demo(rag)
        interactive_repl(rag)

    print("[DONE] RAG pipeline session complete.")


if __name__ == "__main__":
    main()
