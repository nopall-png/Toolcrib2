"""
PTMI ToolCrib - Generative AI Engine
File: generative_ai.py
Purpose: Handles all Large Language Model (LLM) tasks, RAG ChromaDB Retrieval,
         Interactive Chatbot Assistant, PDF Ingestion, and Structured LLM Document Parsing.
Port: 8001
"""

import os
import sys
import shutil
import importlib
import uvicorn
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import retrieval_engine

rag_pipeline = importlib.import_module("3_rag_pipeline")
ToolCribRAG = rag_pipeline.ToolCribRAG

app = FastAPI(
    title="PTMI ToolCrib Generative AI API",
    description="API Engine untuk Generative AI (LLM, RAG Chatbot, PDF Auto-Fill)",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = ToolCribRAG(use_llm=True)


@app.get("/")
async def health_check():
    return {
        "service": "PTMI ToolCrib Generative AI Engine",
        "status": "online",
        "port": 8001,
        "docs": "/docs"
    }


class ChatQuery(BaseModel):
    message: str


@app.post("/api/chat")
async def chat_endpoint(query: ChatQuery):
    """Endpoint untuk chatbot interactive RAG (Llama 3 / Ollama)"""
    try:
        response = rag.query(query.message)
        return {
            "answer": response["answer"],
            "sku": response["sku"],
            "confidence": response["confidence"]
        }
    except Exception as e:
        return {
            "answer": f"Terjadi kesalahan pada backend server: {str(e)}",
            "sku": None,
            "confidence": "ERROR"
        }


@app.post("/api/upload")
async def upload_endpoint(file: UploadFile = File(...)):
    """Endpoint untuk mengunggah dan menganalisis PDF dokumen ke session memory RAG"""
    if not file.filename.endswith(".pdf"):
        return {"status": "error", "message": "Only PDF files are supported."}
    
    temp_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_uploaded.pdf")
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        ingest_module = importlib.import_module("1_ingest_data")
        full_text = ingest_module.load_pdf(temp_path)
        
        rag.session_pdf_text = full_text
        rag.session_pdf_name = file.filename
        retrieval_engine._merged_skus_cache = {}
        
        return {
            "status": "success",
            "message": f"Successfully loaded '{file.filename}' temporarily into session memory."
        }
    except Exception as e:
        return {"status": "error", "message": f"Ingestion failed: {str(e)}"}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/api/parse-restock")
async def parse_restock_endpoint(file: UploadFile = File(...)):
    """Endpoint untuk mengekstraksi nama barang & jumlah dari Surat Jalan PDF menggunakan LLM"""
    if not file.filename.endswith(".pdf"):
        return {"status": "error", "message": "Hanya file PDF yang didukung.", "items": []}
    
    temp_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_parse_restock.pdf")
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        import pdfplumber
        full_text = ""
        with pdfplumber.open(temp_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    full_text += page_text + "\n"
        
        if not full_text.strip():
            return {"status": "error", "message": "PDF tidak mengandung teks yang bisa dibaca.", "items": []}
        
        if rag.llm is None:
            return {"status": "error", "message": "Ollama/Llama 3 tidak tersedia. Pastikan Ollama sudah berjalan.", "items": []}
        
        extraction_prompt = f"""Anda adalah asisten ekstraktor data. Tugas Anda adalah membaca teks dari dokumen PDF (Surat Jalan / Purchase Request / Delivery Order) dan mengekstrak SEMUA item barang beserta jumlahnya.

TEKS DOKUMEN:
{full_text[:3000]}

INSTRUKSI:
1. Ekstrak SETIAP item/barang yang disebutkan beserta jumlah (quantity) nya.
2. WAJIB balas dalam format JSON array yang valid, tanpa teks tambahan.
3. Setiap item harus memiliki field "name" (nama barang), "quantity" (jumlah, angka), dan "notes" (keterangan tambahan jika ada).
4. Jika jumlah tidak disebutkan, gunakan 1 sebagai default.
5. Jika ada keterangan/notes untuk barang tersebut di dalam PDF (seperti alasan, kondisi, atau nomor referensi), masukkan ke field "notes". Jika tidak ada keterangan sama sekali, kosongkan string "".
6. HANYA balas dengan JSON array, JANGAN tambahkan penjelasan apapun.

CONTOH FORMAT BALASAN:
[{{\"name\": \"Makita Cordless Drill\", \"quantity\": 5, \"notes\": \"Pengganti barang rusak\"}}, {{\"name\": \"Safety Glasses\", \"quantity\": 10, \"notes\": \"\"}}]

BALASAN JSON:"""
        
        try:
            raw_response = rag.llm.invoke(extraction_prompt)
            import json
            import re
            
            json_match = re.search(r'\[.*\]', raw_response, re.DOTALL)
            if json_match:
                items_raw = json.loads(json_match.group())
            else:
                items_raw = json.loads(raw_response.strip())
            
            parsed_items = []
            for item in items_raw:
                if isinstance(item, dict) and "name" in item:
                    parsed_items.append({
                        "name": str(item.get("name", "")).strip(),
                        "quantity": max(1, int(item.get("quantity", 1))),
                        "notes": str(item.get("notes", "")).strip()
                    })
            
            return {
                "status": "success",
                "message": f"Berhasil mengekstrak {len(parsed_items)} item dari '{file.filename}'.",
                "items": parsed_items
            }
        
        except Exception as llm_err:
            return {"status": "error", "message": f"Gagal memproses dengan AI: {str(llm_err)}", "items": []}
            
    except Exception as e:
        return {"status": "error", "message": f"Gagal memproses file: {str(e)}", "items": []}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


# ==============================================================================
# SYNC CHROMA — Selective Upsert from Supabase Master Data
# ==============================================================================

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Load .env.local from project root if env vars not set
if not SUPABASE_URL or not SUPABASE_KEY:
    _env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env.local")
    if os.path.exists(_env_path):
        with open(_env_path, "r") as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    key, val = line.split("=", 1)
                    os.environ.setdefault(key.strip(), val.strip().strip('"'))
        SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
        SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")


def _fetch_tools_from_supabase(tool_codes: list[str] | None = None) -> list[dict]:
    """Fetch tool data from Supabase REST API. If tool_codes is None, fetch all."""
    import urllib.request
    import json as _json

    url = f"{SUPABASE_URL}/rest/v1/tools?select=*"
    if tool_codes:
        # Supabase filter: code=in.(val1,val2)
        codes_csv = ",".join(tool_codes)
        url += f"&code=in.({codes_csv})"

    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return _json.loads(resp.read().decode("utf-8"))


def _tool_to_text_chunk(tool: dict) -> str:
    """Convert a Supabase tool row into a rich text chunk for ChromaDB embedding."""
    code = tool.get("code", "UNKNOWN")
    name = tool.get("name", "Unknown")
    category = tool.get("category", "")
    stock = tool.get("stock", 0)
    min_stock = tool.get("min_stock", 0)
    max_stock = tool.get("max_stock", 0)
    unit = tool.get("unit", "pcs")
    location = tool.get("location", "")
    description = tool.get("description", "")
    unit_price = tool.get("unit_price", 0)

    lines = [
        f"SKU: {code}",
        f"Nama Barang: {name}",
        f"Kategori: {category}" if category else "",
        f"Deskripsi: {description}" if description else "",
        f"Stok Saat Ini: {stock} {unit}",
        f"Minimum Stok: {min_stock} {unit}",
        f"Maximum Stok: {max_stock} {unit}",
        f"Lokasi Penyimpanan: {location}" if location else "",
        f"Harga Satuan: Rp {unit_price:,.0f}" if unit_price else "",
    ]
    return "\n".join(line for line in lines if line)


def _log_sync_status(status: str, message: str, tool_codes: list[str] | None):
    """Log sync status to Supabase ai_sync_logs table. Non-blocking."""
    import urllib.request
    import json as _json
    from datetime import datetime, timezone

    try:
        payload = _json.dumps({
            "synced_at": datetime.now(timezone.utc).isoformat(),
            "status": status,
            "message": message[:500],
            "tool_codes": tool_codes or []
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/ai_sync_logs",
            data=payload,
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },
            method="POST"
        )
        urllib.request.urlopen(req, timeout=10)
    except Exception as log_err:
        print(f"[SYNC-LOG] Failed to write to ai_sync_logs: {log_err}", flush=True)


class SyncRequest(BaseModel):
    tool_codes: list[str] | None = None  # None = sync all tools


@app.api_route("/api/sync-chroma", methods=["GET", "POST"])
async def sync_chroma_endpoint(req: SyncRequest = None):
    """
    Selective upsert: fetch tool data from Supabase, generate text chunks,
    upsert into ChromaDB so the chatbot reflects live Master Data.
    """
    import traceback
    from langchain_huggingface import HuggingFaceEmbeddings

    tool_codes = req.tool_codes if req else None
    print(f"\n[SYNC-CHROMA] === Sync triggered ===", flush=True)
    print(f"[SYNC-CHROMA] Tool codes: {tool_codes or 'ALL'}", flush=True)

    try:
        # 1. Fetch tool data from Supabase
        tools = _fetch_tools_from_supabase(tool_codes)
        if not tools:
            msg = "No matching tools found in Supabase."
            print(f"[SYNC-CHROMA] {msg}", flush=True)
            _log_sync_status("warning", msg, req.tool_codes)
            return {"status": "warning", "message": msg, "synced_count": 0}

        print(f"[SYNC-CHROMA] Fetched {len(tools)} tools from Supabase", flush=True)

        # 2. Generate text chunks
        chunks = []
        for tool in tools:
            code = tool.get("code", "")
            if not code:
                continue
            text = _tool_to_text_chunk(tool)
            chunks.append({
                "id": f"{code}_live",
                "text": text,
                "sku": code
            })

        print(f"[SYNC-CHROMA] Generated {len(chunks)} text chunks", flush=True)

        # 3. Initialize embedding model (reuse retriever's if available)
        try:
            embeddings_model = rag.retriever.embeddings
        except Exception:
            embeddings_model = HuggingFaceEmbeddings(
                model_name="all-MiniLM-L6-v2",
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True}
            )

        # 4. Generate embeddings
        texts = [c["text"] for c in chunks]
        embeddings = embeddings_model.embed_documents(texts)
        print(f"[SYNC-CHROMA] Generated {len(embeddings)} embeddings", flush=True)

        # 5. Upsert into ChromaDB collection
        collection = rag.retriever.collection
        
        # DELETE old chunks for these SKUs to prevent duplicates
        synced_codes = list(set([c["sku"] for c in chunks]))
        for code in synced_codes:
            try:
                collection.delete(where={"sku": code})
            except Exception as del_err:
                print(f"[SYNC-CHROMA] Failed to delete old chunks for {code}: {del_err}")
                
        collection.upsert(
            ids=[c["id"] for c in chunks],
            documents=texts,
            metadatas=[{"sku": c["sku"]} for c in chunks],
            embeddings=embeddings
        )

        # Also clear merged SKU cache so retrieval picks up fresh data
        retrieval_engine._merged_skus_cache = {}

        synced_codes = [c["sku"] for c in chunks]
        msg = f"Successfully synced {len(chunks)} tools: {synced_codes}"
        print(f"[SYNC-CHROMA] ✓ {msg}", flush=True)
        _log_sync_status("success", msg, synced_codes)

        return {"status": "success", "message": msg, "synced_count": len(chunks)}

    except Exception as e:
        err_msg = f"Sync failed: {str(e)}"
        print(f"[SYNC-CHROMA] ✗ ERROR: {err_msg}", flush=True)
        print(traceback.format_exc(), flush=True)
        _log_sync_status("error", err_msg, req.tool_codes)
        return {"status": "error", "message": err_msg, "synced_count": 0}


if __name__ == "__main__":
    uvicorn.run("generative_ai:app", host="0.0.0.0", port=8001, reload=False)
