# ==============================================================================
# retrieval_engine.py
# ==============================================================================
# PTMI ToolCrib AI Assistant — Shared Retrieval Engine
# ==============================================================================
#
# PURPOSE:
#   Single source of truth for all retrieval logic shared between
#   2_test_retrieval.py and 3_rag_pipeline.py. Any fix applied here
#   automatically takes effect in both files.
#
# CONTAINS:
#   - Configuration constants (ChromaDB, embedding model, thresholds)
#   - Confidence level helpers
#   - Chunk type classifier (scoring-based)
#   - SKU deduplication
#   - Hybrid search function (exact SKU + semantic + boosts)
#
# ==============================================================================

import os
import re
import sys
import chromadb
from langchain_huggingface import HuggingFaceEmbeddings

# ==============================================================================
# CONFIGURATION CONSTANTS
# ==============================================================================

# ChromaDB persistent storage directory
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                             "db", "chroma_db")

# Collection name (must match 1_ingest_data.py)
COLLECTION_NAME = "toolcrib_inventory"

# Embedding model (must match 1_ingest_data.py)
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Number of raw results to fetch from ChromaDB before dedup + filtering.
TOP_K = 20

# Global flag to toggle detail presentation (scores, chunks, stats)
DEBUG_MODE = False

# ==============================================================================
# SIMILARITY THRESHOLD CONFIGURATION
# ==============================================================================
# ChromaDB returns L2 (Euclidean) distances when using normalized embeddings.
# Lower distance = higher similarity.
#
# RETRIEVAL TIERS:
#   PRIMARY (returned as results):
#     HIGH   — distance <= 1.00 — Strong semantic match.
#     MEDIUM — distance <= 1.20 — Acceptable match.
#
#   CANDIDATE (shown separately, NOT counted as successful retrieval):
#     LOW    — distance <= 1.40 — Weak match. Displayed under
#              "Possible matches (low confidence)" for reference only.
#
#   REJECTED (discarded, not shown):
#     distance > 1.40 — No semantic relevance.

CONFIDENCE_HIGH = 1.00
CONFIDENCE_MEDIUM = 1.20
CONFIDENCE_LOW = 1.40

# ==============================================================================
# KEYWORD BOOST CONFIGURATION
# ==============================================================================
# Target keywords: if any of these appear in both the query AND the chunk,
# the chunk gets a -0.15 distance bonus (making it more relevant).
# Expanded from the original 7 to cover more ToolCrib tool types.

TARGET_KEYWORDS = [
    # Original 7
    "inspection", "calibration", "pneumatic", "vernier", "insulation",
    "wrench", "bearing",
    # Expanded — common ToolCrib tool terms
    "caliper", "tester", "micrometer", "torque", "multimeter",
    "screwdriver", "pliers", "hammer", "gauge", "puller",
    "blow gun", "cutter", "drill", "socket", "clamp",
]

# Location intent detection keywords (in query)
LOCATION_INTENT_KEYWORDS = [
    "where", "location", "stored", "storage", "rack", "bin",
    "warehouse", "located"
]

# Location keywords to look for inside chunk text
LOCATION_CHUNK_KEYWORDS = [
    "rack", "bin", "warehouse", "location", "stored at"
]


# ==============================================================================
# CONFIDENCE HELPERS
# ==============================================================================

def get_confidence_level(distance: float) -> str:
    """
    Map a ChromaDB distance score to a human-readable confidence level.

    Args:
        distance: L2 distance from ChromaDB query result.

    Returns:
        Confidence label: "HIGH", "MEDIUM", "LOW", or "REJECTED"
    """
    if distance <= CONFIDENCE_HIGH:
        return "HIGH"
    elif distance <= CONFIDENCE_MEDIUM:
        return "MEDIUM"
    elif distance <= CONFIDENCE_LOW:
        return "LOW"
    else:
        return "REJECTED"


def get_confidence_icon(confidence: str) -> str:
    """Return a visual icon for each confidence level."""
    icons = {
        "EXACT": "🔵",
        "HIGH": "🟢",
        "MEDIUM": "🟡",
        "LOW": "🟠",
        "REJECTED": "🔴"
    }
    return icons.get(confidence, "⚪")


# ==============================================================================
# CHUNK TYPE CLASSIFIER (IMPROVED — scoring-based)
# ==============================================================================

def _get_chunk_type(text: str) -> str:
    """
    Classify the chunk type based on a scoring approach.
    Categories: description, location, purchase, calibration, inspection, specification
    """
    text_lower = text.lower()
    text_len = len(text)

    # Keyword lists for each category
    keywords_map = {
        "purchase": ["purchase date", "unit price", "total value", "supplier"],
        "inspection": ["inspection history", "passed inspection", "calibration verified", "tool condition", "inspection date", "remark", "status active"],
        "calibration": ["calibration date", "expiry date", "calibrate", "calibration", "certify", "certificate"],
        "location": ["rack", "bin", "warehouse", "stored at", "location"],
        "specification": ["specification", "specs", "range", "accuracy", "resolution", "dimension", "weight", "capacity", "model", "part number"],
    }

    # Count hits for each category
    scores = {cat: 0 for cat in keywords_map}
    for cat, kws in keywords_map.items():
        scores[cat] = sum(1 for kw in kws if re.search(r'\b' + re.escape(kw) + r'\b', text_lower))

    # Determine highest scoring category
    best_cat = max(scores, key=scores.get)
    if scores[best_cat] > 0:
        # Special logic: long chunks containing location terms as context but also spec/purchase info
        # should be classified as description/spec, not a pure location block.
        if best_cat == "location" and text_len > 300:
            other_scores = sum(scores[c] for c in scores if c != "location")
            if other_scores > 1:
                return "description"
        return best_cat

    return "description"


def is_chunk_relevant_to_intent(text: str, chunk_type: str, intent: str) -> bool:
    """
    Check if a chunk is relevant to the given intent.
    Returns True if chunk_type matches, or if chunk text contains intent-specific terms.
    """
    if intent == "description":
        return True
    
    text_lower = text.lower()
    if intent == "specification":
        return chunk_type in ["specification", "description"] or any(k in text_lower for k in ["specification", "specs", "model", "part number"])
    elif intent == "calibration":
        return chunk_type in ["calibration", "description"] or any(k in text_lower for k in ["calibration date", "calibrate", "calibration"])
    elif intent == "inspection":
        return chunk_type in ["inspection", "description"] or any(k in text_lower for k in ["inspection history", "inspection date", "condition"])
    elif intent == "purchase":
        return chunk_type in ["purchase", "description"] or any(k in text_lower for k in ["purchase date", "unit price", "total value"])
    elif intent == "location":
        return chunk_type in ["location", "description"] or any(k in text_lower for k in ["rack", "bin", "warehouse"])
    
    return True


# ==============================================================================
# SKU DEDUPLICATION
# ==============================================================================

def _deduplicate_by_sku(results: list, is_location_query: bool = False) -> tuple:
    """
    Deduplicate retrieval results by SKU.
    If it is a location query, prioritize chunks in order of:
    location > inspection > specification > calibration > purchase > description

    Args:
        results: List of result dicts with "sku", "distance", "chunk_type".
        is_location_query: If True, prioritize location-type chunks.

    Returns:
        Tuple of (deduplicated_results, duplicates_removed_count)
    """
    seen_skus = {}  # sku -> best result dict

    priority_map = {
        "location": 6,
        "inspection": 5,
        "specification": 4,
        "calibration": 3,
        "purchase": 2,
        "description": 1
    }

    for result in results:
        sku = result["sku"]
        if sku not in seen_skus:
            seen_skus[sku] = result
            continue

        current_best = seen_skus[sku]

        if is_location_query:
            p_new = priority_map.get(result.get("chunk_type", "description"), 0)
            p_old = priority_map.get(current_best.get("chunk_type", "description"), 0)

            if p_new > p_old:
                seen_skus[sku] = result
            elif p_new < p_old:
                pass
            else:
                if result["distance"] < current_best["distance"]:
                    seen_skus[sku] = result
        else:
            if result["distance"] < current_best["distance"]:
                seen_skus[sku] = result

    deduplicated = list(seen_skus.values())
    deduplicated.sort(key=lambda r: r["distance"])

    duplicates_removed = len(results) - len(deduplicated)
    return deduplicated, duplicates_removed


# ==============================================================================
# HYBRID SEARCH ENGINE
# ==============================================================================

def search_query(collection, embedding_function, query: str,
                 top_k: int = TOP_K) -> dict:
    """
    Execute a hybrid search query. Exact SKU Search layer runs first.
    If match is found, returns immediately. Otherwise, executes semantic search
    augmented with keyword boosting, exact word matching, and location reranking.

    Args:
        collection: ChromaDB collection object.
        embedding_function: HuggingFaceEmbeddings instance.
        query: User query string.
        top_k: Number of raw results to fetch.

    Returns:
        Dict with keys: "primary", "candidates", "rejected_count", "dedup_stats"
    """
    query_lower = query.lower()

    # -- Metadata-based Location Retrieval Layer --
    targets = extract_location_target(query)
    rack_target = targets["rack"]
    bin_target = targets["bin"]
    wh_target = targets["warehouse"]

    # Detect location query intent
    is_location_query = any(
        re.search(r'\b' + re.escape(kw) + r'\b', query_lower)
        for kw in LOCATION_INTENT_KEYWORDS
    )
    is_exact_loc_search = is_location_query and (rack_target or bin_target or wh_target)

    # Only perform exact location metadata matching if no exact SKU code is in the query (SKU query takes precedence)
    sku_pattern = r'BRG-[A-Z]{3}-\d{3}'
    has_sku = bool(re.search(sku_pattern, query.upper()))
    
    if is_exact_loc_search and not has_sku:
        matching_skus = metadata_location_search(collection, query)

        # Build location query representation for fallback message
        m_raw = re.search(r'\b(rack\s+[a-zA-Z0-9\-]+|bin\s+[a-zA-Z0-9\-]+|warehouse\s+[a-zA-Z0-9\-]+)\b', query, re.IGNORECASE)
        loc_query_str = m_raw.group(1).title() if m_raw else (f"Rack {rack_target}" if rack_target else (f"Bin {bin_target}" if bin_target else "the specified location"))

        if not matching_skus:
            # Return empty results but inject custom no-match fallback message in stats
            dedup_stats = {
                "raw_chunks": 0,
                "unique_skus": 0,
                "duplicates_removed": 0,
                "location_intent": "YES",
                "location_chunk_selected": "NO",
                "no_match_msg": f"No inventory items were found in {loc_query_str}."
            }
            return {
                "primary": [],
                "candidates": [],
                "rejected_count": 0,
                "dedup_stats": dedup_stats
            }

        # Retrieve matched chunks for matched SKUs
        primary_results = []
        for sku, fields in matching_skus:
            sku_results = collection.get(where={"sku": sku})
            if sku_results and sku_results["ids"]:
                # Grab best/first chunk for location representation
                for i in range(len(sku_results["ids"])):
                    chunk_text = sku_results["documents"][i]
                    chunk_type = _get_chunk_type(chunk_text)
                    primary_results.append({
                        "chunk_id": sku_results["ids"][i],
                        "sku": sku,
                        "text": chunk_text,
                        "distance": 0.0,
                        "confidence": "HIGH",
                        "chunk_type": chunk_type,
                        "embedding_score": 0.0,
                        "keyword_boost": 0.0,
                        "location_boost": 0.0
                    })

        # Run deduplication
        deduplicated, duplicates_removed = _deduplicate_by_sku(primary_results, is_location_query=True)

        dedup_stats = {
            "raw_chunks": len(primary_results),
            "unique_skus": len(deduplicated),
            "duplicates_removed": duplicates_removed,
            "location_intent": "YES",
            "location_chunk_selected": "YES"
        }

        return {
            "primary": deduplicated,
            "candidates": [],
            "rejected_count": 0,
            "dedup_stats": dedup_stats
        }

    # -- Exact SKU Search Layer --
    sku_match = re.search(sku_pattern, query.strip().upper())

    if sku_match:
        sku_code = sku_match.group(0)
        sku_results = collection.get(where={"sku": sku_code})

        if sku_results and sku_results["ids"]:
            primary_results = []
            intent = detect_query_intent(query)
            for i in range(len(sku_results["ids"])):
                chunk_text = sku_results["documents"][i]
                chunk_type = _get_chunk_type(chunk_text)

                # Intent filtering
                if not is_chunk_relevant_to_intent(chunk_text, chunk_type, intent):
                    continue

                primary_results.append({
                    "chunk_id": sku_results["ids"][i],
                    "sku": sku_results["metadatas"][i].get("sku", sku_code),
                    "text": chunk_text,
                    "distance": 0.0,
                    "confidence": "EXACT",
                    "chunk_type": chunk_type,
                    "embedding_score": 0.0,
                    "keyword_boost": 0.0,
                    "location_boost": 0.0
                })

            dedup_stats = {
                "raw_chunks": len(sku_results["ids"]),
                "unique_skus": 1,
                "duplicates_removed": len(sku_results["ids"]) - len(primary_results),
                "location_intent": "YES" if intent == "location" else "NO",
                "location_chunk_selected": "YES" if intent == "location" else "NO"
            }

            return {
                "primary": primary_results,
                "candidates": [],
                "rejected_count": 0,
                "dedup_stats": dedup_stats
            }

    # -- Semantic Search --
    query_embedding = embedding_function.embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"]
    )

    # Detect query intent
    intent = detect_query_intent(query)

    # Keyword matching setup
    matched_keywords = [
        kw for kw in TARGET_KEYWORDS
        if re.search(r'\b' + re.escape(kw) + r'\b', query_lower)
    ]

    # Exact word matching — extract query content words (3+ chars)
    query_words = [w.strip() for w in re.findall(r'\b\w{3,}\b', query_lower)]

    # Score each result
    all_results = []
    rejected_count = 0

    if results and results["ids"] and results["ids"][0]:
        for i in range(len(results["ids"][0])):
            text = results["documents"][0][i]
            embedding_distance = results["distances"][0][i]
            chunk_type = _get_chunk_type(text)

            # Intent filtering for semantic search
            if not is_chunk_relevant_to_intent(text, chunk_type, intent):
                continue

            # 1. Location boost
            location_bonus = 0.0
            if is_location_query:
                has_location_info = any(
                    re.search(r'\b' + re.escape(kw) + r'\b', text.lower())
                    for kw in LOCATION_CHUNK_KEYWORDS
                )
                if has_location_info:
                    location_bonus = -0.50

            # 2. Keyword boost
            keyword_term_bonus = 0.0
            if matched_keywords:
                has_keyword_match = any(
                    re.search(r'\b' + re.escape(kw) + r'\b', text.lower())
                    for kw in matched_keywords
                )
                if has_keyword_match:
                    keyword_term_bonus = -0.15

            # 3. Exact word matching
            exact_word_bonus = 0.0
            text_lower = text.lower()
            item_name = ""
            brand = ""
            category = ""

            m_name = re.search(
                r'(?:item name|name)\s*[:\|]?\s*([^\n\r\|]+)', text_lower
            )
            if m_name:
                item_name = m_name.group(1).strip()

            m_brand = re.search(r'brand\s*[:\|]?\s*([^\n\r\|]+)', text_lower)
            if m_brand:
                brand = m_brand.group(1).strip()

            m_category = re.search(
                r'category\s*[:\|]?\s*([^\n\r\|]+)', text_lower
            )
            if m_category:
                category = m_category.group(1).strip()

            has_exact_match = False
            for qw in query_words:
                if qw in ["where", "location", "stored", "storage",
                          "located", "rack", "bin", "warehouse"]:
                    continue
                if ((item_name and re.search(
                        r'\b' + re.escape(qw) + r'\b', item_name)) or
                    (brand and re.search(
                        r'\b' + re.escape(qw) + r'\b', brand)) or
                    (category and re.search(
                        r'\b' + re.escape(qw) + r'\b', category))):
                    has_exact_match = True
                    break

            if has_exact_match:
                exact_word_bonus = -0.15

            keyword_bonus = keyword_term_bonus + exact_word_bonus
            final_score = max(0.0000, embedding_distance + keyword_bonus + location_bonus)
            confidence = get_confidence_level(final_score)

            if confidence == "REJECTED":
                rejected_count += 1
                continue

            all_results.append({
                "chunk_id": results["ids"][0][i],
                "sku": results["metadatas"][0][i].get("sku", "MISSING"),
                "text": text,
                "distance": final_score,
                "confidence": confidence,
                "chunk_type": chunk_type,
                "embedding_score": embedding_distance,
                "keyword_boost": keyword_bonus,
                "location_boost": location_bonus
            })

    raw_count = len(all_results)

    # Deduplicate by SKU
    deduplicated, duplicates_removed = _deduplicate_by_sku(
        all_results, is_location_query=is_location_query
    )

    primary_results = [
        r for r in deduplicated
        if r["confidence"] in ("HIGH", "MEDIUM", "EXACT")
    ]
    candidate_results = [
        r for r in deduplicated
        if r["confidence"] == "LOW"
    ]

    dedup_stats = {
        "raw_chunks": raw_count,
        "unique_skus": len(deduplicated),
        "duplicates_removed": duplicates_removed,
        "location_intent": "YES" if is_location_query else "NO",
        "location_chunk_selected": "YES" if any(
            r.get("chunk_type") == "location" for r in primary_results
        ) else "NO"
    }

    return {
        "primary": primary_results,
        "candidates": candidate_results,
        "rejected_count": rejected_count,
        "dedup_stats": dedup_stats
    }


# ==============================================================================
# INITIALIZATION HELPER
# ==============================================================================

def initialize_retrieval():
    """
    Initialize ChromaDB client and HuggingFace embedding model.

    Returns:
        Tuple of (collection, embedding_function)
    """
    print("[INIT] Initializing retrieval engine...")

    # Check if ChromaDB directory exists
    if not os.path.exists(CHROMA_DB_DIR):
        print(f"[ERROR] ChromaDB directory not found: {CHROMA_DB_DIR}")
        print(f"[ERROR] Run 1_ingest_data.py first to create the database.")
        sys.exit(1)

    # Initialize ChromaDB client
    client = chromadb.PersistentClient(path=CHROMA_DB_DIR)

    # Get the collection
    try:
        collection = client.get_collection(name=COLLECTION_NAME)
        doc_count = collection.count()
        print(f"  → Connected to collection '{COLLECTION_NAME}'")
        print(f"  → Collection contains {doc_count} documents")
    except Exception as e:
        print(f"[ERROR] Collection '{COLLECTION_NAME}' not found: {e}")
        print(f"[ERROR] Run 1_ingest_data.py first.")
        sys.exit(1)

    # Initialize embedding model
    print(f"  → Loading embedding model: {EMBEDDING_MODEL}")
    embedding_function = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True}
    )
    print(f"  → Accepted:  HIGH ≤{CONFIDENCE_HIGH}  MEDIUM ≤{CONFIDENCE_MEDIUM}")
    print(f"  → Candidate: LOW ≤{CONFIDENCE_LOW} (shown separately)")
    print(f"  → Rejected:  >{CONFIDENCE_LOW} (discarded)")
    print(f"  → SKU deduplication: ON (best chunk per SKU)")
    print(f"  → Retrieval engine ready!\n")

    return collection, embedding_function


# ==============================================================================
# USER-ORIENTED SUMMARY & ANSWER GENERATION
# ==============================================================================

_merged_skus_cache = {}

def _get_all_merged_skus(collection) -> dict:
    """Get all merged SKUs fields, caching the result on the first run."""
    global _merged_skus_cache
    if _merged_skus_cache:
        return _merged_skus_cache

    print("[CACHING] Compiling in-memory location index of all 100 SKUs...")
    all_docs = collection.get(include=["documents", "metadatas"])
    sku_to_texts = {}
    for doc, meta in zip(all_docs["documents"], all_docs["metadatas"]):
        sku = meta.get("sku")
        if sku and re.match(r'^BRG-[A-Z]{3}-\d{3}$', sku):
            sku_to_texts.setdefault(sku, []).append(doc)

    for sku, texts in sku_to_texts.items():
        _merged_skus_cache[sku] = _merge_sku_chunks(texts)

    print("  ✓ Caching complete.")
    return _merged_skus_cache


def detect_query_intent(query: str) -> str:
    """Classify the target query intent based on keywords."""
    query_lower = query.lower()
    if any(kw in query_lower for kw in ["specification", "spec", "specs", "technical spec", "model", "part number", "dimension", "resolution", "accuracy"]):
        return "specification"
    if any(kw in query_lower for kw in ["calibration", "calibrate", "certify", "next calibration"]):
        return "calibration"
    if any(kw in query_lower for kw in ["inspection", "passed", "history", "verified", "condition"]):
        return "inspection"
    if any(kw in query_lower for kw in ["purchase", "price", "value", "supplier", "cost"]):
        return "purchase"
    if any(kw in query_lower for kw in ["where", "location", "stored", "rack", "bin", "warehouse", "located"]):
        return "location"
    return "description"


def extract_location_target(query: str) -> dict:
    """
    Extract rack, bin, and warehouse targets from a query string.
    """
    query_lower = query.lower()
    
    # 1. Rack
    rack = None
    m_rack = re.search(r'\brack\s*([a-zA-Z0-9\-]+)\b', query_lower)
    if m_rack:
        rack = m_rack.group(1).upper()
    else:
        m_r = re.search(r'\b(r-\d+)\b', query_lower)
        if m_r:
            rack = m_r.group(1).upper()

    # 2. Bin
    bin_val = None
    m_bin = re.search(r'\bbin\s*([a-zA-Z0-9\-]+)\b', query_lower)
    if m_bin:
        bin_val = m_bin.group(1).upper()
    else:
        m_b = re.search(r'\b(b-\d+)\b', query_lower)
        if m_b:
            bin_val = m_b.group(1).upper()

    # 3. Warehouse
    warehouse = None
    m_wh = re.search(r'\b([a-zA-Z0-9\-]+)\s+warehouse\b', query_lower)
    if m_wh:
        warehouse = m_wh.group(1).upper()
    elif "warehouse" in query_lower:
        warehouse = "ANY"

    return {
        "rack": rack,
        "bin": bin_val,
        "warehouse": warehouse
    }


def metadata_location_search(collection, query: str) -> list:
    """
    Perform exact location search by scanning parsed metadata,
    bypassing embeddings entirely.
    """
    targets = extract_location_target(query)
    rack_target = targets["rack"]
    bin_target = targets["bin"]
    wh_target = targets["warehouse"]

    if not rack_target and not bin_target and not wh_target:
        return []

    all_skus = _get_all_merged_skus(collection)
    matching_skus = []

    def clean_loc(val):
        return re.sub(r'[^A-Z0-9]', '', val)

    for sku, fields in all_skus.items():
        rack_val = fields.get("rack", "").upper()
        bin_val = fields.get("bin", "").upper()
        wh_val = fields.get("warehouse", "").upper()

        match = True
        if rack_target:
            if clean_loc(rack_target) not in clean_loc(rack_val) and clean_loc(rack_val) not in clean_loc(rack_target):
                match = False
        if bin_target:
            if clean_loc(bin_target) not in clean_loc(bin_val) and clean_loc(bin_val) not in clean_loc(bin_target):
                match = False
        if wh_target:
            if wh_target == "ANY":
                if rack_val == "N/A" and bin_val == "N/A" and wh_val == "N/A":
                    match = False
            elif clean_loc(wh_target) not in clean_loc(wh_val):
                match = False

        if match:
            matching_skus.append((sku, fields))

    return matching_skus


def _clean_noise_text(text: str) -> str:
    """
    Remove development-only text or ingestion notes from the chunk text.
    """
    # Matches the noise phrase with optional leading/trailing spaces/punctuation
    pattern = r'\s*,?\s*chunking agar ChromaDB dapat mengembalikan nilai sku kepada backend\s*\.?\s*'
    return re.sub(pattern, ' ', text).strip()


def _merge_sku_chunks(chunks: list, intent: str = "general") -> dict:
    """
    Extract, clean, deduplicate, and merge information from all chunks of a single SKU.
    """
    # Extract string texts
    texts = []
    for chunk in chunks:
        if isinstance(chunk, dict):
            text = chunk.get("text", "")
        else:
            text = chunk
        texts.append(_clean_noise_text(text))

    combined_text = "\n\n".join(texts)

    # Initialize fields
    fields = {
        "item_name": "N/A",
        "brand": "N/A",
        "model": "N/A",
        "department": "N/A",
        "rack": "N/A",
        "bin": "N/A",
        "warehouse": "N/A",
        "calibration_date": "N/A",
        "status": "N/A",
        "condition": "N/A",
        "unit_price": "N/A",
        "purchase_date": "N/A",
        "total_value": "N/A",
        "tech_spec": "N/A",
        "inspection_history": []
    }

    # Helper regex extractors
    # 1. Item Name
    m_name = re.search(r'(?:item name|item|name)\s*[\|:]\s*([^\n\r\|]+)', combined_text, re.IGNORECASE)
    if m_name:
        fields["item_name"] = m_name.group(1).strip()
    else:
        # Fallback to the dash format in first chunk: "BRG-XXX-NNN - Item Name Here SKU BRG-..."
        m_dash = re.search(r'BRG-[A-Z]{3}-\d{3}\s*-\s*([^S\n\|]+?)(?:\s+SKU\s+BRG-|\s+Item\s+ID|\s*\||\s*$)', combined_text, re.IGNORECASE)
        if m_dash:
            fields["item_name"] = m_dash.group(1).strip()

    # 2. Brand
    m_brand = re.search(r'\bbrand\s*[\|:]\s*([^\n\r\|]+)', combined_text, re.IGNORECASE)
    if m_brand:
        fields["brand"] = m_brand.group(1).strip()

    # 3. Model
    m_model = re.search(r'\bmodel\s*[\|:]\s*([^\n\r\|]+)', combined_text, re.IGNORECASE)
    if m_model:
        fields["model"] = m_model.group(1).strip()

    # 4. Department
    m_dept = re.search(r'\b(?:department|dept)\s*[\|:]\s*([^\n\r\|]+)', combined_text, re.IGNORECASE)
    if m_dept:
        fields["department"] = m_dept.group(1).strip()

    # 5. Rack
    m_rack = re.search(r'\brack\s*[\|:]\s*([^\n\r\|]+)', combined_text, re.IGNORECASE)
    if m_rack:
        fields["rack"] = m_rack.group(1).strip()

    # 6. Bin
    m_bin = re.search(r'\bbin\s*[\|:]\s*([^\n\r\|]+)', combined_text, re.IGNORECASE)
    if m_bin:
        fields["bin"] = m_bin.group(1).strip()

    # 7. Warehouse
    # Try tab/pipe first
    m_wh = re.search(r'\bwarehouse\s*[\|:]\s*([^\n\r\|]+)', combined_text, re.IGNORECASE)
    if m_wh:
        fields["warehouse"] = m_wh.group(1).strip()
    else:
        # Check narrative format "ToolCrib Warehouse"
        m_wh_narrative = re.search(r'\b([A-Za-z0-9\-]+)\s+Warehouse\b', combined_text, re.IGNORECASE)
        if m_wh_narrative:
            fields["warehouse"] = m_wh_narrative.group(1).strip() + " Warehouse"

    # 8. Calibration Date
    m_cal = re.search(r'(?:calibration date|cal date|calibration)\s*[\|:]\s*([^\n\r\|]+)', combined_text, re.IGNORECASE)
    if m_cal:
        fields["calibration_date"] = m_cal.group(1).strip()

    # 9. Status
    m_status = re.search(r'\bstatus\s*[\|:]\s*([^\n\r\|]+)', combined_text, re.IGNORECASE)
    if m_status:
        fields["status"] = m_status.group(1).strip()

    # 10. Condition
    m_condition = re.search(r'\bcondition\s*[\|:]\s*([^\n\r\|]+)', combined_text, re.IGNORECASE)
    if m_condition:
        fields["condition"] = m_condition.group(1).strip()

    # 11. Purchase information
    m_pd = re.search(r'purchase\s+date\s*[\|:]\s*([^\n\r\|]+)', combined_text, re.IGNORECASE)
    if m_pd:
        fields["purchase_date"] = m_pd.group(1).strip()

    m_up = re.search(r'unit\s+price\s*[\|:]\s*([^\n\r\|]+)', combined_text, re.IGNORECASE)
    if m_up:
        fields["unit_price"] = m_up.group(1).strip()

    m_tv = re.search(r'total\s+value\s*[\|:]\s*([^\n\r\|]+)', combined_text, re.IGNORECASE)
    if m_tv:
        fields["total_value"] = m_tv.group(1).strip()

    # 12. Technical Specification
    m_ts = re.search(r'technical\s+specification\s*[\|:]\s*([^\n\r\|]+)', combined_text, re.IGNORECASE)
    if m_ts:
        fields["tech_spec"] = m_ts.group(1).strip()

    # 13. Inspection History
    history_matches = re.findall(r'(\d{4}-\d{2}-\d{2})\s*:\s*([^\.]+?)(?:\.|$)', combined_text)
    seen_history = set()
    for date, event in history_matches:
        event_clean = event.strip()
        if "passed" in event_clean.lower() or "verified" in event_clean.lower() or "good" in event_clean.lower() or "failed" in event_clean.lower() or "inspection" in event_clean.lower():
            record = f"{date}: {event_clean}."
            if record not in seen_history:
                seen_history.add(record)
                fields["inspection_history"].append(record)

    # Let's clean N/A or empty values
    for k, v in fields.items():
        if isinstance(v, str):
            v_cleaned = re.sub(r'\s*[\|:]\s*$', '', v).strip()
            if v_cleaned.upper() in ("", "N/A", "NONE", "-"):
                fields[k] = "N/A"
            else:
                fields[k] = v_cleaned

    # Apply intent-based field masking to strictly enforce category separation
    if intent == "specification":
        allowed = ["item_name", "brand", "model", "tech_spec"]
        for k in fields:
            if k not in allowed:
                fields[k] = [] if isinstance(fields[k], list) else "N/A"
    elif intent == "location":
        allowed = ["item_name", "rack", "bin", "warehouse"]
        for k in fields:
            if k not in allowed:
                fields[k] = [] if isinstance(fields[k], list) else "N/A"
    elif intent == "calibration":
        allowed = ["item_name", "calibration_date"]
        for k in fields:
            if k not in allowed:
                fields[k] = [] if isinstance(fields[k], list) else "N/A"
    elif intent == "inspection":
        allowed = ["item_name", "status", "condition", "inspection_history"]
        for k in fields:
            if k not in allowed:
                fields[k] = [] if isinstance(fields[k], list) else "N/A"
    elif intent == "purchase":
        allowed = ["item_name", "unit_price", "purchase_date", "total_value"]
        for k in fields:
            if k not in allowed:
                fields[k] = [] if isinstance(fields[k], list) else "N/A"

    return fields


def _generate_structured_answer(fields: dict, query: str, sku: str) -> str:
    """
    Generate a clean natural language answer based on the merged fields, query, and SKU.
    """
    if not fields or fields.get("item_name") == "N/A":
        return "Saya tidak memiliki informasi tersebut di database ToolCrib."

    item = fields.get("item_name", "Unknown Item")
    brand = fields.get("brand", "N/A")
    model = fields.get("model", "N/A")
    dept = fields.get("department", "N/A")
    rack = fields.get("rack", "N/A")
    bin_loc = fields.get("bin", "N/A")
    wh = fields.get("warehouse", "N/A")
    cal_date = fields.get("calibration_date", "N/A")
    status = fields.get("status", "N/A")
    condition = fields.get("condition", "N/A")
    price = fields.get("unit_price", "N/A")
    pur_date = fields.get("purchase_date", "N/A")
    val_total = fields.get("total_value", "N/A")
    tech_spec = fields.get("tech_spec", "N/A")
    history = fields.get("inspection_history", [])

    # Clean warehouse name formatting
    if wh != "N/A":
        wh_clean = wh if "warehouse" in wh.lower() else f"{wh} Warehouse"
    else:
        wh_clean = "ToolCrib Warehouse"

    # Build location string
    loc_parts = []
    if rack != "N/A":
        loc_parts.append(rack if rack.lower().startswith("rack") else f"Rack {rack}")
    if bin_loc != "N/A":
        loc_parts.append(bin_loc if bin_loc.lower().startswith("bin") else f"Bin {bin_loc}")

    if loc_parts:
        location_str = f"stored in {' '.join(loc_parts)} inside the {wh_clean}"
    else:
        location_str = ""

    # Detect query intent
    intent = detect_query_intent(query)

    # 1. Location Intent
    if intent == "location":
        if not location_str:
            return "Location information is not available."
        return f"The {item} ({sku}) is {location_str}."

    # 2. Calibration Intent
    if intent == "calibration":
        if cal_date == "N/A":
            return "Calibration information is not available."
        return f"The {item} ({sku}) requires periodic calibration. The next calibration date is {cal_date}."

    # 3. Inspection Intent
    if intent == "inspection":
        history_str = " ".join(history) if history else ""
        history_part = f" History: {history_str}" if history_str else ""
        return f"The inspection record for {item} ({sku}) is as follows: Status: {status}. Condition: {condition}.{history_part}"

    # 4. Purchase Intent
    if intent == "purchase":
        purchase_details = []
        if pur_date != "N/A":
            purchase_details.append(f"Purchase Date: {pur_date}")
        if price != "N/A":
            purchase_details.append(f"Unit Price: {price}")
        if val_total != "N/A":
            purchase_details.append(f"Total Value: {val_total}")
        
        pd_str = ", ".join(purchase_details) if purchase_details else "Purchase details not available"
        return f"Purchase details for {item} ({sku}): {pd_str}."

    # 5. Specification Intent
    if intent == "specification":
        spec_details = []
        if brand != "N/A":
            spec_details.append(f"Brand: {brand}")
        if model != "N/A":
            spec_details.append(f"Model: {model}")
        if tech_spec != "N/A":
            spec_details.append(f"Technical Specs: {tech_spec}")
        
        spec_str = ". ".join(spec_details) if spec_details else "Specification details not available"
        return f"Specifications for {item} ({sku}): {spec_str}."

    # 6. Fallback/Description Intent (general information)
    is_sku_query = bool(re.search(r'BRG-[A-Z]{3}-\d{3}', query.upper()))
    if is_sku_query:
        dept_str = f" belongs to the {dept} department and" if dept != "N/A" else ""
        if location_str:
            return f"The {item} ({sku}){dept_str} is {location_str}."
        else:
            return f"The {item} ({sku}){dept_str} is stored in the ToolCrib Warehouse."

    desc_parts = [f"The {item} ({sku}) is registered in the ToolCrib inventory."]
    if dept != "N/A":
        desc_parts.append(f"It belongs to the {dept} department.")
    if location_str:
        desc_parts.append(f"It is {location_str}.")
    if cal_date != "N/A":
        desc_parts.append(f"Its next calibration date is {cal_date}.")

    return " ".join(desc_parts)


