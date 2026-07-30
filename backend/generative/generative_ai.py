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


if __name__ == "__main__":
    uvicorn.run("generative_ai:app", host="0.0.0.0", port=8001, reload=False)
