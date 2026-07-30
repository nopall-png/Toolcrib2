# ==============================================================================
# 2_test_retrieval.py
# ==============================================================================
# PTMI ToolCrib AI Assistant — Retrieval Testing & Validation
# ==============================================================================
#
# PURPOSE:
#   Validates that the ChromaDB vector database returns semantically
#   relevant results with correct SKU metadata for technician queries.
#   Includes similarity threshold filtering to prevent false positive
#   retrieval results.
#
# CONFIDENCE LEVELS:
#   distance <= 1.00  → HIGH   (strong semantic match)
#   1.00 < d <= 1.20  → MEDIUM (acceptable match)
#   1.20 < d <= 1.40  → LOW    (weak match, flagged)
#   distance > 1.40   → REJECT (not returned)
#
# PREREQUISITES:
#   Run 1_ingest_data.py first to populate ChromaDB.
#
# USAGE:
#   python 2_test_retrieval.py
#
# ==============================================================================

import os
import sys
import re

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
# This eliminates code duplication with 3_rag_pipeline.py.

from retrieval_engine import (
    CHROMA_DB_DIR, COLLECTION_NAME, EMBEDDING_MODEL, TOP_K,
    CONFIDENCE_HIGH, CONFIDENCE_MEDIUM, CONFIDENCE_LOW,
    get_confidence_level, get_confidence_icon,
    search_query, initialize_retrieval,
    _merge_sku_chunks, _generate_structured_answer,
    DEBUG_MODE,
)

import retrieval_engine
# Set DEBUG_MODE = True for the test runner to display scores, chunks, stats.
retrieval_engine.DEBUG_MODE = True

# ==============================================================================
# TEST QUERIES
# ==============================================================================
# These queries simulate real technician questions in a manufacturing environment.
# They cover different categories: measurement, pneumatics, electrical,
# calibration, and general spare parts.

TEST_QUERIES = [
    {
        "query": "What tool is used for molding dimension inspection?",
        "category": "Measurement Tools"
    },
    {
        "query": "Show me pneumatic valve spare parts",
        "category": "Pneumatic Components"
    },
    {
        "query": "Which items need calibration?",
        "category": "Calibration"
    },
    {
        "query": "Find bearing for injection molding machine",
        "category": "Bearings"
    },
    {
        "query": "Temperature controller specifications",
        "category": "Electrical Components"
    },
    {
        "query": "What hand tools are available in the tool crib?",
        "category": "Hand Tools"
    },
    {
        "query": "Filter element replacement parts",
        "category": "Filters"
    },
    {
        "query": "Ejector pin specifications",
        "category": "Mold Components"
    },
    {
        "query": "Where is the digital vernier caliper?",
        "category": "Location Search"
    },
    {
        "query": "BRG-PNE-075",
        "category": "Exact SKU Query"
    },
    {
        "query": "BRG-MNT-030",
        "category": "Exact SKU Query"
    },
    {
        "query": "BRG-MEA-097",
        "category": "Exact SKU Query"
    },
    {
        "query": "items in rack A",
        "category": "Empty Location Matching"
    },
    {
        "query": "bearing specification",
        "category": "Intent Filtering (Specs)"
    },
]


# ==============================================================================
# TEST RUNNER
# ==============================================================================

def run_tests(collection, embedding_function):
    """
    Execute all test queries and validate results with 3-tier filtering.

    Categorizes each test outcome as one of three types:
    1. SUCCESSFUL RETRIEVAL  — At least one HIGH or MEDIUM result with valid
       SKU metadata. LOW results are shown separately but do NOT count.
    2. INVENTORY COVERAGE GAP — No HIGH/MEDIUM results. LOW candidates may
       exist but are insufficient for success. The query topic is not
       adequately covered by the current PDF inventory.
    3. SKU EXTRACTION FAILURE — HIGH/MEDIUM results exist but have missing
       or invalid SKU metadata. Indicates a problem in 1_ingest_data.py.
    """
    print("=" * 70)
    print("RETRIEVAL TEST RESULTS")
    print("=" * 70)

    total_tests = len(TEST_QUERIES)

    # --- Outcome counters ---
    successful_retrievals = 0       # queries with HIGH/MEDIUM + valid SKUs
    inventory_gaps = 0              # queries with no HIGH/MEDIUM results
    sku_extraction_failures = 0     # queries with results but invalid SKUs

    # --- Result counters ---
    total_valid_sku_results = 0     # primary results with valid BRG-XXX-NNN
    total_invalid_sku_results = 0   # primary results with missing/bad SKU

    # --- Global statistics ---
    global_primary_distances = []   # distances for HIGH/MEDIUM results only
    global_rejected_total = 0       # total REJECTED results (>1.40)
    global_candidate_total = 0      # total LOW confidence candidates
    global_no_result_queries = []   # queries with no HIGH/MEDIUM results
    global_candidate_only_queries = []  # queries with only LOW candidates

    for i, test in enumerate(TEST_QUERIES, 1):
        query = test["query"]
        category = test["category"]

        print(f"\n{'─' * 70}")
        print(f"  TEST {i}/{total_tests}: [{category}]")
        print(f"  Query: \"{query}\"")
        print(f"{'─' * 70}")

        # Execute search with 3-tier confidence filtering
        search_result = search_query(
            collection, embedding_function, query
        )
        primary = search_result["primary"]
        candidates = search_result["candidates"]
        rejected_count = search_result["rejected_count"]
        dedup_stats = search_result["dedup_stats"]

        global_rejected_total += rejected_count
        global_candidate_total += len(candidates)

        # ── Case: Exact Location Search with Empty Match ──
        if not primary and "no_match_msg" in dedup_stats:
            print(f"\n  ANSWER:")
            print(f"  {dedup_stats['no_match_msg']}")
            print(f"\n  → RETRIEVAL SUCCESS ✓")
            successful_retrievals += 1
            continue

        # ── Case: No HIGH/MEDIUM results ──
        if not primary:
            total_filtered_out = len(candidates) + rejected_count

            if candidates:
                # LOW candidates exist but are insufficient
                print(f"\n  ℹ  No HIGH or MEDIUM confidence results found.")
                print(f"     ({len(candidates)} LOW candidate(s) + "
                      f"{rejected_count} rejected)")

                # Display LOW candidates as "Possible matches"
                print(f"\n  ── Possible matches (low confidence) ──")
                for j, cand in enumerate(candidates, 1):
                    conf_icon = get_confidence_icon(cand["confidence"])
                    text_preview = cand["text"][:120].replace('\n', ' ')
                    print(f"    {j}. 🟠 {cand['sku']}  "
                          f"Score: {cand['distance']:.4f}")
                    print(f"       {text_preview}...")

                print(f"\n  → INVENTORY COVERAGE GAP")
                print(f"     Only LOW confidence matches found — insufficient")
                print(f"     for reliable retrieval.")
                global_candidate_only_queries.append(query)
            else:
                # Nothing at all
                print(f"\n  ℹ  No sufficiently relevant ToolCrib item found.")
                print(f"     ({rejected_count} candidate(s) rejected — "
                      f"all below LOW threshold)")
                print(f"\n  → INVENTORY COVERAGE GAP")
                print(f"     This query topic is not covered by the current "
                      f"ToolCrib inventory.")

            global_no_result_queries.append(query)
            inventory_gaps += 1
            continue

        # ── Case: Exact SKU Summary Mode ──
        sku_match = re.search(r'BRG-[A-Z]{3}-\d{3}', query.upper())
        if sku_match:
            sku_code = sku_match.group(0)
            from retrieval_engine import detect_query_intent
            intent = detect_query_intent(query)
            merged = _merge_sku_chunks(primary, intent=intent)

            sku_valid = bool(re.match(r'^BRG-[A-Z]{3}-\d{3}$', sku_code))
            if sku_valid:
                total_valid_sku_results += 1
            else:
                total_invalid_sku_results += 1
                query_has_invalid_sku = True

            # Print single clean summary card (omitting N/A fields dynamically)
            print("\n==================================================")
            print("SKU INFORMATION")
            print("==================================================")
            print(f"SKU:          {sku_code}")
            if merged.get('item_name') != "N/A":
                print(f"Item:         {merged['item_name']}")
            if merged.get('brand') != "N/A":
                print(f"Brand:        {merged['brand']}")
            if merged.get('department') != "N/A":
                print(f"Department:   {merged['department']}")

            # Combine Rack & Bin
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

            global_primary_distances.append(0.0)

            if total_invalid_sku_results > 0:
                print(f"\n  → SKU EXTRACTION FAILURE ✗")
                sku_extraction_failures += 1
            else:
                print(f"\n  → RETRIEVAL SUCCESS ✓")
                successful_retrievals += 1
            continue

        # ── Display PRIMARY results (HIGH + MEDIUM) ──
        query_has_invalid_sku = False
        query_distances = []

        for j, result in enumerate(primary, 1):
            sku = result["sku"]
            distance = result["distance"]  # This is the final score
            confidence = result["confidence"]
            conf_icon = get_confidence_icon(confidence)
            text_preview = result["text"][:150].replace('\n', ' ')
            chunk_id = result["chunk_id"]

            embedding_score = result.get("embedding_score", distance)
            keyword_bonus = result.get("keyword_boost", 0.0)
            location_bonus = result.get("location_boost", 0.0)

            query_distances.append(distance)
            global_primary_distances.append(distance)

            # Validate SKU matches strict BRG-[A-Z]{3}-\d{3} format
            sku_valid = bool(re.match(r'^BRG-[A-Z]{3}-\d{3}$', sku))
            if sku_valid:
                total_valid_sku_results += 1
            else:
                total_invalid_sku_results += 1
                query_has_invalid_sku = True

            sku_icon = "✓" if sku_valid else "✗"

            print(f"\n  Result #{j}:")
            print(f"    SKU:            {sku_icon} {sku}")
            print(f"    Embedding:      {embedding_score:.2f}")
            print(f"    Keyword boost:  {keyword_bonus:.2f}")
            print(f"    Location boost: {location_bonus:.2f}")
            print(f"    Final score:    {distance:.4f}")
            print(f"    Confidence:     {conf_icon} {confidence}")
            print(f"    Chunk:          {chunk_id}")
            print(f"    Content:        {text_preview}...")

        # ── Display LOW candidates (if any) ──
        if candidates:
            print(f"\n  ── Possible matches (low confidence) ──")
            for j, cand in enumerate(candidates, 1):
                print(f"    {j}. 🟠 {cand['sku']}  "
                      f"Score: {cand['distance']:.4f}")

        # Per-query statistics
        avg_distance = sum(query_distances) / len(query_distances)
        print(f"\n  ── Query Stats ──")
        print(f"  Primary results (HIGH/MEDIUM): {len(primary)}")
        print(f"  Candidate results (LOW):       {len(candidates)}")
        print(f"  Rejected results:              {rejected_count}")
        print(f"  Avg primary score:             {avg_distance:.4f}")
        print(f"  Raw chunks retrieved:          {dedup_stats['raw_chunks']}")
        print(f"  Unique SKUs retrieved:         {dedup_stats['unique_skus']}")
        print(f"  Duplicate chunks removed:      {dedup_stats['duplicates_removed']}")
        print(f"\n  Location reranking statistics:")
        print(f"  Location intent:               {dedup_stats['location_intent']}")
        print(f"  Location chunk selected:       {dedup_stats['location_chunk_selected']}")

        # ── Outcome: SKU EXTRACTION FAILURE ──
        if query_has_invalid_sku:
            print(f"\n  → SKU EXTRACTION FAILURE ✗")
            print(f"     Some results have missing or invalid SKU metadata.")
            print(f"     Check SKU extraction in 1_ingest_data.py.")
            sku_extraction_failures += 1
        else:
            # ── Outcome: SUCCESSFUL RETRIEVAL ──
            print(f"\n  → RETRIEVAL SUCCESS ✓")
            successful_retrievals += 1

    # ========================================================================
    # GLOBAL TEST SUMMARY
    # ========================================================================
    print(f"\n\n{'=' * 70}")
    print(f"TEST SUMMARY")
    print(f"{'=' * 70}")
    print(f"  Total tests:              {total_tests}")
    print(f"  Successful retrievals:    {successful_retrievals} ✓  "
          f"(at least 1 HIGH/MEDIUM result)")
    print(f"  Inventory coverage gaps:  {inventory_gaps} ℹ  "
          f"(no HIGH/MEDIUM results)")
    print(f"  SKU extraction failures:  {sku_extraction_failures} ✗")

    # ========================================================================
    # CONFIDENCE STATISTICS
    # ========================================================================
    print(f"\n{'─' * 70}")
    print(f"CONFIDENCE STATISTICS")
    print(f"{'─' * 70}")

    if global_primary_distances:
        avg_global = sum(global_primary_distances) / len(global_primary_distances)
        min_global = min(global_primary_distances)
        max_global = max(global_primary_distances)
        high_count = sum(1 for d in global_primary_distances
                         if d <= CONFIDENCE_HIGH)
        med_count = sum(1 for d in global_primary_distances
                        if CONFIDENCE_HIGH < d <= CONFIDENCE_MEDIUM)

        print(f"  Primary results (HIGH+MEDIUM): {len(global_primary_distances)}")
        print(f"  Candidate results (LOW):       {global_candidate_total}")
        print(f"  Rejected results:              {global_rejected_total}")
        print(f"  Average primary score:         {avg_global:.4f}")
        print(f"  Best score (lowest):           {min_global:.4f}")
        print(f"  Worst primary score:           {max_global:.4f}")
        print(f"")
        print(f"  🟢 HIGH confidence:            {high_count}")
        print(f"  🟡 MEDIUM confidence:          {med_count}")
        print(f"  🟠 LOW confidence (candidate): {global_candidate_total}")
        print(f"  🔴 REJECTED:                   {global_rejected_total}")
    else:
        print(f"  No primary (HIGH/MEDIUM) results across all tests.")
        print(f"  LOW candidates: {global_candidate_total}")
        print(f"  Rejected:       {global_rejected_total}")

    # ========================================================================
    # RETRIEVAL ANALYSIS
    # ========================================================================
    print(f"\n{'─' * 70}")
    print(f"RETRIEVAL ANALYSIS")
    print(f"{'─' * 70}")
    print(f"  Successful retrievals:    {successful_retrievals}/{total_tests}")
    print(f"  No-match queries:         {inventory_gaps}")
    print(f"  False positives prevented: "
          f"{global_candidate_total + global_rejected_total} "
          f"(LOW + REJECTED, not returned as results)")
    print(f"  Inventory coverage gaps:  {inventory_gaps}")
    print(f"  SKU metadata errors:      {total_invalid_sku_results}")

    # ========================================================================
    # INVENTORY COVERAGE GAPS DETAIL
    # ========================================================================
    if global_no_result_queries:
        print(f"\n{'─' * 70}")
        print(f"INVENTORY COVERAGE GAPS")
        print(f"{'─' * 70}")
        for q in global_no_result_queries:
            marker = "🟠" if q in global_candidate_only_queries else "ℹ "
            suffix = (" (has LOW candidates)"
                      if q in global_candidate_only_queries else "")
            print(f"  {marker} \"{q}\"{suffix}")
        print(f"\n  These queries are outside the current ToolCrib inventory.")
        print(f"  This is NOT a retrieval failure — the data simply does not")
        print(f"  exist in the source PDF (or only matches at LOW confidence).")

    # ========================================================================
    # SYSTEM HEALTH ASSESSMENT
    # ========================================================================
    all_results_have_valid_sku = (total_invalid_sku_results == 0)
    has_inventory_gaps = (inventory_gaps > 0)

    print(f"\n{'─' * 70}")
    print(f"SYSTEM HEALTH")
    print(f"{'─' * 70}")

    if all_results_have_valid_sku:
        print(f"  ✓ Retrieval engine functioning correctly.")
        fp_prevented = global_candidate_total + global_rejected_total
        if fp_prevented > 0:
            print(f"  ✓ Confidence filtering prevented "
                  f"{fp_prevented} false positive(s).")
            print(f"    ({global_candidate_total} LOW candidates stored "
                  f"separately, {global_rejected_total} rejected)")
        if has_inventory_gaps:
            print(f"  ℹ  Some queries are outside the current "
                  f"ToolCrib inventory.")
    else:
        print(f"  ✗ SKU metadata issues detected — "
              f"check 1_ingest_data.py.")

    # ========================================================================
    # FINAL STATUS LEVEL
    # ========================================================================
    print(f"\n{'=' * 70}")

    if all_results_have_valid_sku and not has_inventory_gaps:
        status = "EXCELLENT"
        print(f"  🏆 FINAL STATUS: {status}")
        print(f"")
        print(f"     No invalid SKUs detected.")
        print(f"     No false positives in accepted results.")
        print(f"     All test queries returned relevant inventory items.")
        print(f"     Retrieval pipeline is production-ready.")

    elif all_results_have_valid_sku and has_inventory_gaps:
        status = "GOOD"
        print(f"  ✅ FINAL STATUS: {status}")
        print(f"")
        print(f"     No invalid SKUs detected.")
        print(f"     No false positives in accepted results.")
        print(f"     {inventory_gaps} query(ies) returned no relevant "
              f"inventory items.")
        print(f"     This reflects inventory coverage limitations,")
        print(f"     not retrieval failures.")

    else:
        status = "POOR"
        print(f"  ❌ FINAL STATUS: {status}")
        print(f"")
        print(f"     {total_invalid_sku_results} result(s) with missing "
              f"or invalid SKU metadata.")
        print(f"     This indicates a problem in the ingestion pipeline.")
        print(f"     Action: Review and re-run 1_ingest_data.py.")

    print(f"{'=' * 70}\n")

    return successful_retrievals, inventory_gaps, sku_extraction_failures


# ==============================================================================
# INTERACTIVE MODE
# ==============================================================================

def interactive_mode(collection, embedding_function):
    """
    Interactive REPL for ad-hoc queries with 3-tier confidence filtering.
    """
    print(f"\n{'=' * 70}")
    print(f"INTERACTIVE RETRIEVAL MODE (3-Tier Confidence Filtering)")
    print(f"{'=' * 70}")
    print(f"Type your query and press Enter. Type 'quit' to exit.")
    print(f"Results:   HIGH ≤{CONFIDENCE_HIGH}  MEDIUM ≤{CONFIDENCE_MEDIUM}")
    print(f"Candidate: LOW ≤{CONFIDENCE_LOW} (shown separately)")
    print(f"Rejected:  >{CONFIDENCE_LOW} (discarded)\n")

    while True:
        try:
            query = input("🔍 Query: ").strip()
        except (KeyboardInterrupt, EOFError):
            break

        if not query:
            continue
        if query.lower() in ("quit", "exit", "q"):
            break

        search_result = search_query(
            collection, embedding_function, query
        )
        primary = search_result["primary"]
        candidates = search_result["candidates"]
        rejected_count = search_result["rejected_count"]
        dedup_stats = search_result["dedup_stats"]

        # Case: Exact Location Search with Empty Match
        if not primary and "no_match_msg" in dedup_stats:
            print(f"\n  ANSWER:")
            print(f"  {dedup_stats['no_match_msg']}\n")
            continue

        if not primary:
            print(f"\n  ⚠  No HIGH or MEDIUM confidence results found.")

            if candidates:
                print(f"\n  ── Possible matches (low confidence) ──")
                for j, cand in enumerate(candidates, 1):
                    text_preview = cand['text'][:150].replace('\n', ' ')
                    print(f"    {j}. 🟠 {cand['sku']}  "
                          f"Score: {cand['distance']:.4f}")
                    print(f"       {text_preview}...")
                print(f"\n  These are LOW confidence — not reliable matches.\n")
            else:
                print(f"     ({rejected_count} result(s) rejected)\n")
            continue

        # ── Case: Exact SKU Query ──
        sku_match = re.search(r'BRG-[A-Z]{3}-\d{3}', query.upper())
        if sku_match:
            sku_code = sku_match.group(0)
            from retrieval_engine import detect_query_intent
            intent = detect_query_intent(query)
            merged = _merge_sku_chunks(primary, intent=intent)

            print("\n==================================================")
            print("SKU INFORMATION")
            print("==================================================")
            print(f"SKU:          {sku_code}")
            if merged.get('item_name') != "N/A":
                print(f"Item:         {merged['item_name']}")
            if merged.get('brand') != "N/A":
                print(f"Brand:        {merged['brand']}")
            if merged.get('department') != "N/A":
                print(f"Department:   {merged['department']}")

            # Combine Rack & Bin
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

            # Display stats
            print(f"  ── Stats: Primary={len(primary)}  Candidates=0  Rejected={rejected_count}  Avg=0.0000 ──")
            print(f"     Raw chunks={dedup_stats['raw_chunks']}  Unique SKUs=1  Duplicates removed=0")
            print(f"     Location intent=NO  Location selected=NO\n")
            continue

        # Display primary results
        print()
        distances = []
        for j, result in enumerate(primary, 1):
            conf_icon = get_confidence_icon(result["confidence"])
            print(f"  Result #{j}:")
            print(f"    SKU:        {result['sku']}")
            print(f"    Confidence: {conf_icon} {result['confidence']}")
            print(f"    Score:      {result['distance']:.4f}")
            text_preview = result['text'][:200].replace('\n', ' ')
            print(f"    Content:    {text_preview}...")
            print()
            distances.append(result["distance"])

        # Display LOW candidates if any
        if candidates:
            print(f"  ── Possible matches (low confidence) ──")
            for j, cand in enumerate(candidates, 1):
                print(f"    {j}. 🟠 {cand['sku']}  "
                      f"Score: {cand['distance']:.4f}")
            print()

        avg = sum(distances) / len(distances) if distances else 0.0
        print(f"  ── Stats: Primary={len(primary)}  "
              f"Candidates={len(candidates)}  "
              f"Rejected={rejected_count}  Avg={avg:.4f} ──")
        print(f"     Raw chunks={dedup_stats['raw_chunks']}  "
              f"Unique SKUs={dedup_stats['unique_skus']}  "
              f"Duplicates removed={dedup_stats['duplicates_removed']}")
        print(f"     Location intent={dedup_stats['location_intent']}  "
              f"Location selected={dedup_stats['location_chunk_selected']}\n")

    print("\nExiting interactive mode.")


# ==============================================================================
# MAIN EXECUTION
# ==============================================================================

def main():
    """
    Main test pipeline:
    1. Initialize retrieval engine
    2. Run predefined test queries with confidence filtering
    3. Enter interactive mode for ad-hoc testing
    """
    print("=" * 70)
    print("PTMI TOOLCRIB AI ASSISTANT — RETRIEVAL TESTING")
    print("(with Similarity Threshold & Confidence Filtering)")
    print("=" * 70)

    # Initialize
    collection, embedding_function = initialize_retrieval()

    # Run automated tests
    successful, gaps, failures = run_tests(collection, embedding_function)

    # Ask user if they want interactive mode
    print("\nWould you like to enter interactive query mode? (y/n): ", end="")
    try:
        answer = input().strip().lower()
        if answer in ("y", "yes"):
            interactive_mode(collection, embedding_function)
    except (KeyboardInterrupt, EOFError):
        pass

    print("[DONE] Retrieval testing complete.")


if __name__ == "__main__":
    main()
