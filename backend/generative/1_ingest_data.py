# ==============================================================================
# 1_ingest_data.py
# ==============================================================================
# PTMI ToolCrib AI Assistant — PDF Ingestion & Vector Database Creation
# ==============================================================================
#
# PURPOSE:
#   Reads the ToolCrib PDF (100 items), extracts text using PDFPlumber,
#   splits into SKU-aware chunks (preserving metadata), generates embeddings
#   with HuggingFace all-MiniLM-L6-v2, and stores everything in ChromaDB.
#
# CRITICAL RULE:
#   Every chunk MUST contain metadata["sku"]. The backend team uses SKU
#   as the primary key in PostgreSQL.
#
# SKU VALIDATION:
#   Only valid SKUs matching BRG-[A-Z]{3}-\d{3} are accepted.
#   Cover pages and company overview text are preserved in memory
#   but NEVER chunked, embedded, or stored in ChromaDB.
#
# USAGE:
#   python 1_ingest_data.py
#
# OUTPUT:
#   ./chroma_db/  — Persistent ChromaDB directory
#
# ==============================================================================

import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import re
import pdfplumber
import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings

# ==============================================================================
# CONFIGURATION
# ==============================================================================

# Path to the ToolCrib PDF document
PDF_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        "data", "PT_Mattel_ToolCrib_Dataset.pdf")

# ChromaDB persistent storage directory
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                             "db", "chroma_db")

# ChromaDB collection name
COLLECTION_NAME = "toolcrib_inventory"

# Embedding model — lightweight, free, runs locally
# Strong at reading alphanumeric structures like SKU codes
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Chunking parameters
# 500 chars: small enough for precise retrieval, large enough for full item specs
# 50 overlap: prevents context loss at chunk boundaries
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

# SKU pattern regex — STRICT match for PTMI ToolCrib format only
# Valid examples: BRG-MEA-001, BRG-HND-001, BRG-ELC-001, BRG-CUT-001
SKU_PATTERN = re.compile(r'BRG-[A-Z]{3}-\d{3}')

# In-memory storage for cover/overview text (preserved but NOT chunked)
_preserved_header_text = ""


# ==============================================================================
# STEP 1: LOAD PDF WITH PDFPLUMBER
# ==============================================================================

def load_pdf(pdf_path: str) -> str:
    """
    Load PDF using PDFPlumber to preserve table structure.
    
    PDFPlumber is chosen over PyPDF because MRO datasheets contain
    columnar specification data. PyPDF destroys table structure,
    while PDFPlumber preserves it — critical for keeping SKU numbers
    aligned with their technical attributes.
    
    Args:
        pdf_path: Path to the PDF file.
        
    Returns:
        Full extracted text from all pages.
    """
    print(f"[STEP 1] Loading PDF: {pdf_path}")
    
    if not os.path.exists(pdf_path):
        print(f"[ERROR] PDF file not found: {pdf_path}")
        sys.exit(1)
    
    full_text = ""
    page_count = 0
    
    with pdfplumber.open(pdf_path) as pdf:
        page_count = len(pdf.pages)
        print(f"  → Total pages: {page_count}")
        
        for i, page in enumerate(pdf.pages):
            # Extract text from each page
            page_text = page.extract_text()
            if page_text:
                full_text += page_text + "\n\n"
            
            # Also try to extract tables for structured data
            tables = page.extract_tables()
            if tables:
                for table in tables:
                    for row in table:
                        if row:
                            # Join non-None cells with pipe separator
                            row_text = " | ".join([
                                str(cell).strip() for cell in row if cell
                            ])
                            if row_text.strip():
                                full_text += row_text + "\n"
                full_text += "\n"
    
    print(f"  → Extracted {len(full_text)} characters from {page_count} pages")
    return full_text


# ==============================================================================
# STEP 2: PARSE ITEM BLOCKS WITH SKU DETECTION
# ==============================================================================

def parse_item_blocks(full_text: str) -> list:
    r"""
    Parse the extracted text into individual item blocks.
    Each block represents one ToolCrib item with its full metadata.
    
    Strategy:
    1. Find all valid SKU occurrences (BRG-[A-Z]{3}-\d{3}) in the text.
    2. Split text at SKU boundaries.
    3. Each block gets its SKU assigned.
    4. Cover/overview text before the first SKU is preserved in memory
       but NOT included in the returned item blocks.
    
    This ensures no item's description gets mixed with another item's SKU,
    and no non-inventory text pollutes the vector database.
    
    Args:
        full_text: Complete extracted text from PDF.
        
    Returns:
        List of dicts: [{"sku": "BRG-MEA-001", "text": "..."}, ...]
        Only contains valid BRG-[A-Z]{3}-\d{3} SKUs. No HEADER or UNKNOWN.
    """
    global _preserved_header_text
    
    print(f"\n[STEP 2] Parsing item blocks with SKU detection...")
    
    # Find all SKU matches with their positions
    sku_matches = list(SKU_PATTERN.finditer(full_text))
    print(f"  → Found {len(sku_matches)} SKU occurrences in text")
    
    if not sku_matches:
        print("  [ERROR] No valid SKUs found in PDF! Check document format.")
        raise ValueError("No valid SKUs found in PDF! Check document format. A valid SKU must follow the pattern 'BRG-[A-Z]{3}-\\d{3}'.")
    
    # Deduplicate: track unique SKUs and their first occurrence positions
    seen_skus = {}
    sku_positions = []
    
    for match in sku_matches:
        sku = match.group()
        pos = match.start()
        if sku not in seen_skus:
            seen_skus[sku] = pos
            sku_positions.append((sku, pos))
    
    print(f"  → Found {len(sku_positions)} unique SKUs")
    
    # Sort by position in document
    sku_positions.sort(key=lambda x: x[1])
    
    # Preserve cover/overview text in memory (NOT as a chunk)
    first_sku_pos = sku_positions[0][1]
    _preserved_header_text = full_text[:first_sku_pos].strip()
    if _preserved_header_text:
        print(f"  → Preserved cover/overview text in memory ({len(_preserved_header_text)} chars)")
        print(f"    (This text is NOT chunked, NOT embedded, NOT stored in ChromaDB)")
    
    # Split text into blocks based on SKU positions
    # ONLY valid BRG-[A-Z]{3}-\d{3} SKUs are included
    item_blocks = []
    for i, (sku, start_pos) in enumerate(sku_positions):
        # End position is the start of the next SKU, or end of text
        if i + 1 < len(sku_positions):
            end_pos = sku_positions[i + 1][1]
        else:
            end_pos = len(full_text)
        
        block_text = full_text[start_pos:end_pos].strip()
        
        if block_text:
            item_blocks.append({
                "sku": sku,
                "text": block_text
            })
    
    print(f"  → Created {len(item_blocks)} item blocks (valid SKUs only)")
    
    # --- DIAGNOSTIC: First 10 item block SKUs ---
    first_10_skus = [b["sku"] for b in item_blocks[:10]]
    print(f"  → First 10 SKUs: {first_10_skus}")
    
    # --- DIAGNOSTIC: Validate all SKUs ---
    invalid_blocks = [b for b in item_blocks 
                      if not re.match(r'^BRG-[A-Z]{3}-\d{3}$', b["sku"])]
    if invalid_blocks:
        print(f"  [WARNING] {len(invalid_blocks)} blocks have invalid SKU format!")
        for b in invalid_blocks[:5]:
            print(f"    Invalid: '{b['sku']}'")
    else:
        print(f"  ✓ All {len(item_blocks)} blocks have valid BRG-XXX-NNN format")
    
    # === DEBUG: Verify HEADER is NOT in item_blocks ===
    print("\n  DEBUG ITEM BLOCKS:")
    for block in item_blocks[:10]:
        print(f"    {block['sku']}")
    
    return item_blocks


# ==============================================================================
# STEP 3: SKU-AWARE CHUNKING
# ==============================================================================

def create_sku_aware_chunks(item_blocks: list) -> list:
    r"""
    Split item blocks into chunks while preserving SKU metadata.
    
    CRITICAL: Unlike naive RecursiveCharacterTextSplitter which would
    slice across item boundaries and lose SKU associations, this function
    chunks WITHIN each item block and propagates the SKU to every sub-chunk.
    
    Only processes blocks with valid BRG-[A-Z]{3}-\d{3} SKUs.
    
    Args:
        item_blocks: List of {"sku": str, "text": str} dicts.
        
    Returns:
        List of dicts: [{"sku": str, "text": str, "chunk_id": str}, ...]
        Guaranteed: every chunk has a valid BRG-XXX-NNN SKU.
    """
    print(f"\n[STEP 3] Creating SKU-aware chunks...")
    print(f"  → Chunk size: {CHUNK_SIZE} chars, Overlap: {CHUNK_OVERLAP} chars")
    
    # Text splitter for items that exceed chunk size
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    
    chunks = []
    items_split = 0      # Items that needed splitting
    items_whole = 0      # Items that fit in one chunk
    skipped = 0          # Items skipped due to invalid SKU
    
    for block in item_blocks:
        sku = block["sku"]
        text = block["text"]
        
        # STRICT VALIDATION: Only process valid BRG-[A-Z]{3}-\d{3} SKUs
        if not re.match(r'^BRG-[A-Z]{3}-\d{3}$', sku):
            skipped += 1
            continue
            
        if len(text) <= CHUNK_SIZE:
            # Item fits in a single chunk — no splitting needed
            chunks.append({
                "sku": sku,
                "text": text,
                "chunk_id": f"{sku}_0"
            })
            items_whole += 1
        else:
            # Item exceeds chunk size — split but propagate SKU
            sub_chunks = text_splitter.split_text(text)
            items_split += 1
            
            for j, sub_chunk in enumerate(sub_chunks):
                # Prepend SKU to sub-chunk text for retrieval context
                # This ensures the SKU appears in the searchable text too
                if sku not in sub_chunk:
                    sub_chunk_text = f"SKU: {sku}\n{sub_chunk}"
                else:
                    sub_chunk_text = sub_chunk
                
                chunks.append({
                    "sku": sku,
                    "text": sub_chunk_text,
                    "chunk_id": f"{sku}_{j}"
                })
    
    print(f"  → Total chunks created: {len(chunks)}")
    print(f"  → Items in single chunk: {items_whole}")
    print(f"  → Items split into multiple chunks: {items_split}")
    if skipped > 0:
        print(f"  → Skipped (invalid SKU): {skipped}")
    
    # --- DIAGNOSTIC: First 10 chunk SKUs ---
    first_10_chunk_skus = [c["sku"] for c in chunks[:10]]
    print(f"  → First 10 chunk SKUs: {first_10_chunk_skus}")
    
    # --- DIAGNOSTIC: Validate ALL chunks have valid SKU ---
    invalid_chunks = [c for c in chunks 
                      if not re.match(r'^BRG-[A-Z]{3}-\d{3}$', c["sku"])]
    header_chunks = [c for c in chunks if c["sku"] == "HEADER"]
    unknown_chunks = [c for c in chunks if c["sku"] == "UNKNOWN"]
    
    print(f"\n  --- CHUNK VALIDATION ---")
    print(f"  Valid BRG-XXX-NNN chunks: {len(chunks) - len(invalid_chunks)}")
    print(f"  HEADER chunks:            {len(header_chunks)}")
    print(f"  UNKNOWN chunks:           {len(unknown_chunks)}")
    print(f"  Other invalid chunks:     {len(invalid_chunks)}")
    
    if invalid_chunks:
        print(f"  [WARNING] Invalid chunks detected!")
        for c in invalid_chunks[:5]:
            print(f"    → SKU='{c['sku']}', chunk_id='{c['chunk_id']}'")
    else:
        print(f"  ✓ All chunks have valid SKU — ready for embedding")
    
    # === DEBUG: Verify HEADER is NOT in chunks ===
    print("\n  DEBUG CHUNKS:")
    for chunk in chunks[:10]:
        print(f"    {chunk['sku']}")
    
    return chunks


# ==============================================================================
# STEP 4: GENERATE EMBEDDINGS & STORE IN CHROMADB
# ==============================================================================

def store_in_chromadb(chunks: list, recreate: bool = True) -> None:
    """
    Generate embeddings using HuggingFace all-MiniLM-L6-v2 and store
    in ChromaDB with full metadata preservation.
    
    Each document in ChromaDB contains:
    - id:       Unique chunk ID (e.g., "BRG-MEA-001_0")
    - document: The chunk text
    - metadata: {"sku": "BRG-MEA-001"} — CRITICAL for backend integration
    
    Args:
        chunks: List of {"sku": str, "text": str, "chunk_id": str} dicts.
        recreate: If True, deletes and rebuilds the collection. If False, appends.
    """
    print(f"\n[STEP 4] Generating embeddings & storing in ChromaDB...")
    print(f"  → Embedding model: {EMBEDDING_MODEL}")
    print(f"  → ChromaDB directory: {CHROMA_DB_DIR}")
    print(f"  → Collection name: {COLLECTION_NAME}")
    
    # Initialize HuggingFace embedding model
    print(f"  → Loading embedding model (first run downloads ~80MB)...")
    embedding_function = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True}
    )
    
    # Initialize ChromaDB persistent client
    client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    
    if recreate:
        # Delete existing collection if it exists (clean re-ingestion)
        try:
            client.delete_collection(name=COLLECTION_NAME)
            print(f"  → Deleted existing collection '{COLLECTION_NAME}'")
        except Exception:
            pass  # Collection doesn't exist yet
        
        # Create new collection
        collection = client.create_collection(
            name=COLLECTION_NAME,
            metadata={"description": "PTMI ToolCrib Inventory - 100 Items"}
        )
        print(f"  → Created collection '{COLLECTION_NAME}'")
    else:
        # Get or create collection to preserve existing documents
        collection = client.get_or_create_collection(name=COLLECTION_NAME)
        print(f"  → Opened existing collection '{COLLECTION_NAME}' (appending data)")
    
    # Prepare data for batch insertion
    print(f"  → Generating embeddings for {len(chunks)} chunks...")
    
    # Generate embeddings in batches for efficiency
    batch_size = 32
    all_texts = [chunk["text"] for chunk in chunks]
    all_embeddings = []
    
    for i in range(0, len(all_texts), batch_size):
        batch = all_texts[i:i + batch_size]
        batch_embeddings = embedding_function.embed_documents(batch)
        all_embeddings.extend(batch_embeddings)
        
        progress = min(i + batch_size, len(all_texts))
        print(f"    Embedded {progress}/{len(all_texts)} chunks...")
    
    # Prepare for ChromaDB insertion
    ids = []
    documents = []
    metadatas = []
    embeddings_list = []
    
    for i, chunk in enumerate(chunks):
        ids.append(chunk["chunk_id"])
        documents.append(chunk["text"])
        metadatas.append({"sku": chunk["sku"]})
        embeddings_list.append(all_embeddings[i])
    
    # Batch insert into ChromaDB
    # ChromaDB has a batch limit, so we insert in chunks of 100
    insert_batch_size = 100
    for i in range(0, len(ids), insert_batch_size):
        end = min(i + insert_batch_size, len(ids))
        collection.add(
            ids=ids[i:end],
            documents=documents[i:end],
            metadatas=metadatas[i:end],
            embeddings=embeddings_list[i:end]
        )
    
    print(f"  → Successfully stored {len(ids)} chunks in ChromaDB")
    
    # --- CHROMADB VERIFICATION ---
    print(f"\n  --- CHROMADB VERIFICATION ---")
    count = collection.count()
    print(f"  Collection document count: {count}")
    
    # Sample IDs and metadata
    sample = collection.peek(limit=5)
    print(f"  Sample IDs: {sample['ids'][:5]}")
    print(f"  Sample metadata: {sample['metadatas'][:5]}")
    
    # Verify no HEADER or UNKNOWN in ChromaDB
    # Query for any invalid SKUs
    all_docs = collection.get(include=["metadatas"])
    all_skus_in_db = [m.get("sku", "") for m in all_docs["metadatas"]]
    invalid_in_db = [s for s in all_skus_in_db 
                     if not re.match(r'^BRG-[A-Z]{3}-\d{3}$', s)]
    
    if invalid_in_db:
        print(f"  ✗ INVALID SKUs found in ChromaDB: {invalid_in_db[:10]}")
    else:
        print(f"  ✓ All {count} documents in ChromaDB have valid BRG-XXX-NNN SKUs")
    
    unique_skus_in_db = set(all_skus_in_db)
    print(f"  Unique SKUs in ChromaDB: {len(unique_skus_in_db)}")


# ==============================================================================
# STEP 5: PRINT INGESTION SUMMARY
# ==============================================================================

def print_summary(chunks: list) -> None:
    """
    Print a detailed summary of the ingestion results.
    Shows SKU distribution, chunk statistics, and sample data.
    
    Args:
        chunks: List of processed chunks.
    """
    print("\n" + "=" * 70)
    print("INGESTION SUMMARY")
    print("=" * 70)
    
    # Count unique SKUs
    unique_skus = set(c["sku"] for c in chunks)
    print(f"\n  Total chunks:      {len(chunks)}")
    print(f"  Unique SKUs:       {len(unique_skus)}")
    print(f"  Avg chunk length:  {sum(len(c['text']) for c in chunks) // len(chunks)} chars")
    
    # SKU distribution
    sku_counts = {}
    for c in chunks:
        sku_counts[c["sku"]] = sku_counts.get(c["sku"], 0) + 1
    
    print(f"\n  SKU Distribution (chunks per SKU):")
    print(f"  {'SKU':<20} {'Chunks':<10}")
    print(f"  {'-'*20} {'-'*10}")
    
    # Show first 10 SKUs
    for sku, count in sorted(sku_counts.items())[:10]:
        print(f"  {sku:<20} {count:<10}")
    
    if len(sku_counts) > 10:
        print(f"  ... and {len(sku_counts) - 10} more SKUs")
    
    # Sample chunk content
    print(f"\n  Sample Chunk (first chunk):")
    print(f"  {'-'*60}")
    sample = chunks[0]
    print(f"  SKU:      {sample['sku']}")
    print(f"  Chunk ID: {sample['chunk_id']}")
    preview = sample['text'][:200].replace('\n', ' ')
    print(f"  Text:     {preview}...")
    
    # Final validation
    valid_chunks = [c for c in chunks 
                    if re.match(r'^BRG-[A-Z]{3}-\d{3}$', c["sku"])]
    header_chunks = [c for c in chunks if c["sku"] == "HEADER"]
    unknown_chunks = [c for c in chunks if c["sku"] == "UNKNOWN"]
    invalid_chunks = [c for c in chunks 
                      if not re.match(r'^BRG-[A-Z]{3}-\d{3}$', c["sku"])]
    
    print(f"\n  ═══ FINAL VALIDATION ═══")
    print(f"  Valid SKU chunks:         {len(valid_chunks)}")
    print(f"  HEADER chunks:            {len(header_chunks)}")
    print(f"  UNKNOWN chunks:           {len(unknown_chunks)}")
    print(f"  Other invalid chunks:     {len(invalid_chunks)}")
    
    if len(invalid_chunks) == 0:
        print(f"  ✓ PASS — All chunks have valid BRG-XXX-NNN SKU metadata")
    else:
        print(f"  ✗ FAIL — {len(invalid_chunks)} invalid chunks detected!")
    
    print(f"\n{'=' * 70}")
    print(f"ChromaDB stored at: {CHROMA_DB_DIR}")
    print(f"Collection name:    {COLLECTION_NAME}")
    print(f"{'=' * 70}\n")


# ==============================================================================
# MAIN EXECUTION
# ==============================================================================

def main():
    """
    Main ingestion pipeline:
    1. Print runtime environment
    2. Load PDF with PDFPlumber
    3. Parse item blocks with SKU detection
    4. Create SKU-aware chunks
    5. Store in ChromaDB with embeddings
    6. Print summary
    """
    print("=" * 70)
    print("PTMI TOOLCRIB AI ASSISTANT — DATA INGESTION")
    print("=" * 70)
    
    # --- RUNTIME ENVIRONMENT DIAGNOSTIC ---
    print(f"\n  [ENV] Python version:    {sys.version}")
    print(f"  [ENV] Python executable: {sys.executable}")
    print(f"  [ENV] Working directory: {os.getcwd()}")
    print(f"  [ENV] Script location:   {os.path.abspath(__file__)}")
    
    print(f"\n  PDF:       {PDF_PATH}")
    print(f"  Database:  {CHROMA_DB_DIR}")
    print(f"  Model:     {EMBEDDING_MODEL}")
    print("=" * 70)
    
    # Step 1: Load PDF
    full_text = load_pdf(PDF_PATH)
    
    # Step 2: Parse item blocks (valid SKUs only, no HEADER)
    item_blocks = parse_item_blocks(full_text)
    
    # Step 3: SKU-aware chunking (double-validated)
    chunks = create_sku_aware_chunks(item_blocks)
    
    # Step 4: Store in ChromaDB
    store_in_chromadb(chunks)
    
    # Step 5: Print summary
    print_summary(chunks)
    
    print("[DONE] Ingestion complete. Run 2_test_retrieval.py to validate.")


if __name__ == "__main__":
    main()
