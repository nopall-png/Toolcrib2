import os
import sys
import shutil
import importlib
import uvicorn
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import retrieval_engine

# Add current directory to path to ensure imports work correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import RAG pipeline dynamically since Python imports cannot start with numbers
rag_pipeline = importlib.import_module("3_rag_pipeline")
ToolCribRAG = rag_pipeline.ToolCribRAG

app = FastAPI(title="PTMI ToolCrib AI Assistant API")

# Configure CORS (Cross-Origin Resource Sharing)
# This allows your frontend (Next.js running on port 3000) to communicate with this API (running on port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG in LLM mode (will automatically fallback to retrieval-only if Ollama is not active)
rag = ToolCribRAG(use_llm=True)

@app.get("/")
async def health_check():
    """
    Health check endpoint — confirms the API is running.
    """
    return {"status": "ok", "service": "PTMI ToolCrib AI Assistant API"}

class ChatQuery(BaseModel):
    message: str

@app.post("/api/chat")
async def chat_endpoint(query: ChatQuery):
    """
    Endpoint for chatbot queries.
    Receives user message and returns the matched answer from ChromaDB/LLM.
    """
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
    """
    Endpoint to upload and ingest a new ToolCrib inventory PDF.
    Parses text, chunks, embeds, and registers items into the persistent ChromaDB collection.
    """
    if not file.filename.endswith(".pdf"):
        return {"status": "error", "message": "Only PDF files are supported."}
    
    temp_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_uploaded.pdf")
    try:
        # Save file to temp location
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Load Ingestion Module
        ingest_module = importlib.import_module("1_ingest_data")
        
        # Ingest the PDF
        full_text = ingest_module.load_pdf(temp_path)
        # Store the extracted text temporarily in-memory inside the RAG session.
        # This prevents permanent database bloat while allowing the user to ask about the file.
        rag.session_pdf_text = full_text
        rag.session_pdf_name = file.filename
        
        # Reset the RAG merged SKUs cache in memory
        retrieval_engine._merged_skus_cache = {}
        
        return {
            "status": "success",
            "message": f"Successfully loaded '{file.filename}' temporarily into session memory."
        }
    except Exception as e:
        return {"status": "error", "message": f"Ingestion failed: {str(e)}"}
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/api/parse-restock")
async def parse_restock_endpoint(file: UploadFile = File(...)):
    """
    Endpoint to parse a PDF (Surat Jalan / Delivery Order / Purchase Request)
    and extract item names + quantities using AI (Ollama/Llama 3).
    Returns structured JSON for auto-filling the Restock form.
    """
    if not file.filename.endswith(".pdf"):
        return {"status": "error", "message": "Hanya file PDF yang didukung.", "items": []}
    
    temp_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_parse_restock.pdf")
    try:
        # 1. Save file temporarily
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 2. Extract text from PDF using pdfplumber
        import pdfplumber
        full_text = ""
        with pdfplumber.open(temp_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    full_text += page_text + "\n"
        
        if not full_text.strip():
            return {"status": "error", "message": "PDF tidak mengandung teks yang bisa dibaca.", "items": []}
        
        # 3. Send to Ollama/Llama 3 for structured extraction
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
[{{"name": "Makita Cordless Drill", "quantity": 5, "notes": "Pengganti barang rusak"}}, {{"name": "Safety Glasses", "quantity": 10, "notes": ""}}]

BALASAN JSON:"""
        
        try:
            raw_response = rag.llm.invoke(extraction_prompt)
            print(f"[PARSE-RESTOCK] Raw LLM response: {raw_response[:500]}")
            
            # 4. Parse the JSON response from LLM
            import json
            import re
            
            # Try to find JSON array in the response
            json_match = re.search(r'\[.*\]', raw_response, re.DOTALL)
            if json_match:
                items_raw = json.loads(json_match.group())
            else:
                # Fallback: try parsing the whole response
                items_raw = json.loads(raw_response.strip())
            
            # 5. Validate and clean the items
            parsed_items = []
            for item in items_raw:
                if isinstance(item, dict) and "name" in item:
                    parsed_items.append({
                        "name": str(item.get("name", "")).strip(),
                        "quantity": max(1, int(item.get("quantity", 1))),
                        "notes": str(item.get("notes", "")).strip()
                    })
            
            print(f"[PARSE-RESTOCK] Extracted {len(parsed_items)} items from PDF '{file.filename}'")
            
            return {
                "status": "success",
                "message": f"Berhasil mengekstrak {len(parsed_items)} item dari '{file.filename}'.",
                "items": parsed_items
            }
        
        except json.JSONDecodeError as je:
            print(f"[PARSE-RESTOCK] JSON parse error: {je}")
            print(f"[PARSE-RESTOCK] Raw response was: {raw_response[:500]}")
            return {
                "status": "error",
                "message": "AI gagal menghasilkan format data yang valid. Coba upload ulang.",
                "items": []
            }
        except Exception as llm_err:
            print(f"[PARSE-RESTOCK] LLM error: {llm_err}")
            return {
                "status": "error",
                "message": f"Gagal memproses dengan AI: {str(llm_err)}",
                "items": []
            }
    
    except Exception as e:
        print(f"[PARSE-RESTOCK] General error: {e}")
        return {"status": "error", "message": f"Gagal memproses file: {str(e)}", "items": []}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    # Run server on port 8000 (reload=False to prevent infinite reload loops due to logs/db changes)
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
