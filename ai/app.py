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

if __name__ == "__main__":
    # Run server on port 8000 (reload=False to prevent infinite reload loops due to logs/db changes)
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
