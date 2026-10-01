import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import hashlib
import json
import numpy as np
import re


class DuplicateDetector:
    def __init__(self):
        print("[INFO] Memuat Model NLP Semantik untuk Deteksi Duplikat & Substitusi...")
        self.nlp_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        print("[INFO] Model NLP Semantik berhasil dimuat.")
        self._cache = {}
        self._embedding_cache = {}

    def _get_cache_key(self, df_sku: pd.DataFrame, threshold: float) -> str:
        data = df_sku[['SKU_ID', 'Description', 'Current_Stock']].sort_values('SKU_ID').to_dict(orient="records")
        key_str = json.dumps({'data': data, 'threshold': threshold})
        return hashlib.md5(key_str.encode('utf-8')).hexdigest()

    def _build_rich_description(self, row) -> str:
        parts = []

        # Description = name dari tools (sudah direname dari 'name' -> 'Description')
        base_desc = str(row.get('Description', ''))
        if base_desc and base_desc != 'nan':
            parts.append(base_desc)

        # Category (sudah direname 'category' -> 'Category')
        category = row.get('Category', '')
        if category and not pd.isna(category) and str(category) != 'nan':
            parts.append(f"Kategori: {category}")

        # description = kolom deskripsi lengkap dari tools
        full_desc = row.get('description', '')
        if full_desc and not pd.isna(full_desc) and str(full_desc) != 'nan':
            parts.append(str(full_desc))

        # Technical specs
        specs = row.get('Technical_Specs')
        if specs and not pd.isna(specs):
            if isinstance(specs, str):
                try:
                    specs = json.loads(specs)
                except:
                    specs = None
            if isinstance(specs, dict):
                filtered_specs = {
                    k: v for k, v in specs.items()
                    if str(k).lower() not in ('brand', 'merek')
                }
                if filtered_specs:
                    spec_str = ", ".join([f"{k}: {v}" for k, v in filtered_specs.items()])
                    parts.append(f"Spesifikasi: {spec_str}")

        # Brand dari technical_specs jika ada
        if specs and isinstance(specs, dict):
            for k in ('brand', 'merek', 'Brand', 'Merek'):
                if k in specs:
                    b = str(specs[k])
                    if b and b != 'nan':
                        parts.append(f"Merek: {b}")
                    break

        return ". ".join(parts)

    def _wrap_text(self, text: str, max_len: int = 30) -> str:
        """Wrap long text with \n at word boundaries, max_len chars per line."""
        if not text or len(text) <= max_len:
            return text
        words = text.split()
        lines, current = [], ""
        for word in words:
            if len(current) + len(word) + 1 <= max_len:
                current = (current + " " + word).strip()
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
        return "\n".join(lines)

    def _parse_specs(self, specs_raw):
        """Parse technical specs dari berbagai format."""
        if specs_raw is None or (isinstance(specs_raw, float) and pd.isna(specs_raw)):
            return {}
        if isinstance(specs_raw, str):
            try:
                return json.loads(specs_raw)
            except:
                return {}
        if isinstance(specs_raw, dict):
            return specs_raw
        return {}

    def _extract_measurements(self, text: str) -> dict:
        """Ekstrak ukuran fisik dari teks deskripsi."""
        pattern = r'(\d+(?:\.\d+)?)\s*(mm|cm|m|kg|g|mg|ml|l|v|w|volt|amp|inch|in|ft|pcs|ea|box|unit)'
        meas = re.findall(pattern, text.lower())
        result = {}
        for val, unit in meas:
            clean_unit = unit.replace('volt', 'v').replace('amp', 'a').replace('inch', 'in').replace('ea', 'pcs')
            result[clean_unit] = float(val)
        return result

    def _get_stock_status(self, current: int, min_s: int, max_s: int) -> str:
        if current <= 0:
            return "OUT_OF_STOCK"
        if current <= min_s:
            return "LOW_STOCK"
        if current >= max_s:
            return "OVERSTOCK"
        return "OPTIMAL"

    def _determine_action(self, sim_score: float,
                           specs_match: float, category_match: bool,
                           measurement_diff: float,
                           stock1_out: bool, stock2_out: bool) -> tuple:
        """
        Tentukan aksi eksplisit untuk Toolcrib staff.
        Returns: (action, reason)
        """
        both_out = stock1_out and stock2_out
        one_out = stock1_out != stock2_out
        action = "REVIEW"
        reasons = []

        # === SPEC CRITICAL MISMATCH ===
        if measurement_diff > 0 and measurement_diff > 10:
            action = "KEEP_SEPARATE"
            reasons.append(f"Perbedaan ukuran kritis ({measurement_diff:.1f} unit)")
            return action, reasons

        # === HIGH SIMILARITY + STOCK OVERLAP → MERGE CANDIDATE ===
        if sim_score >= 85 and specs_match >= 0.8 and category_match:
            if both_out:
                action = "MERGE"
                reasons.append("Kedua item sangat mirip (semantik & spesifikasi cocok) tapi sama-sama kosong — pertimbangkan untuk di-merge")
            elif one_out:
                action = "SUBSTITUTE"
                reasons.append("Item kosong bisa digantikan oleh item berstok")
            else:
                action = "KEEP_SEPARATE"
                reasons.append("Item mirip tapi keduanya masih punya stok — pertimbangkan sebagai alternatif satu sama lain")
            return action, reasons

        # === MEDIUM SIMILARITY + SPECS COINCIDE ===
        if sim_score >= 60 and specs_match >= 0.5:
            if one_out:
                action = "SUBSTITUTE"
                reasons.append("Item kosong memiliki item pengganti potensial")
            elif sim_score >= 70:
                action = "KEEP_SEPARATE"
                reasons.append("Item cukup mirip untuk dijadikan cadangan satu sama lain")
            else:
                action = "REVIEW"
                reasons.append("Kemungkinan duplikat rendah — perlu review manual")
            return action, reasons

        # === LOW SIMILARITY ===
        if sim_score >= 40:
            action = "REVIEW"
            reasons.append("Similaritas rendah — kemungkinan bukan duplikat")
        else:
            action = "KEEP_SEPARATE"
            reasons.append("Skor similaritas terlalu rendah untuk dianggap terkait")

        return action, reasons

    def detect_duplicate_sku(self, df_sku: pd.DataFrame, threshold: float = 0.40) -> pd.DataFrame:
        """
        Deteksi duplikat antar semua SKU.
        Sekarang termasuk: Stock, Price, Lead Time, Brand, Action Recommendation.
        """
        if df_sku.empty:
            return pd.DataFrame()

        cache_key = self._get_cache_key(df_sku, threshold)
        if cache_key in self._cache:
            print("[INFO] Menggunakan hasil deteksi duplikat dari cache.")
            return self._cache[cache_key]

        print("[INFO] Menghitung kesamaan semantik (dengan incremental embedding cache)...")
        rich_descriptions = df_sku.apply(self._build_rich_description, axis=1).tolist()

        new_descs = [desc for desc in rich_descriptions if desc not in self._embedding_cache]
        if new_descs:
            print(f"[INFO] Encoding {len(new_descs)} deskripsi baru...")
            new_embeddings = self.nlp_model.encode(new_descs)
            for desc, emb in zip(new_descs, new_embeddings):
                self._embedding_cache[desc] = emb

        embeddings = [self._embedding_cache[desc] for desc in rich_descriptions]
        similarity_matrix = cosine_similarity(embeddings)

        triu_indices = np.triu_indices_from(similarity_matrix, k=1)
        valid_mask = similarity_matrix[triu_indices] >= threshold

        i_indices = triu_indices[0][valid_mask]
        j_indices = triu_indices[1][valid_mask]

        duplicate_pairs = []

        def safe_str(val):
            if val is None or (isinstance(val, float) and pd.isna(val)):
                return '-'
            return str(val)

        def safe_float(val):
            try:
                return float(val) if val is not None and not (isinstance(val, float) and pd.isna(val)) else 0.0
            except:
                return 0.0

        def format_specs(specs_raw):
            specs = self._parse_specs(specs_raw)
            if not specs:
                return '-'
            raw = ', '.join([f"{k}: {v}" for k, v in specs.items()])
            return self._wrap_text(raw)

        for i, j in zip(i_indices, j_indices):
            item1 = df_sku.iloc[i]
            item2 = df_sku.iloc[j]

            # === SEMANTIC SCORE ===
            raw_score = float(similarity_matrix[i][j]) * 100
            sim_score = round(raw_score, 1)

            # === CATEGORY MATCH ===
            # Kolom di df_sku sudah direname: 'category' -> 'Category'
            cat1 = safe_str(item1.get('Category')).strip().lower()
            cat2 = safe_str(item2.get('Category')).strip().lower()
            category_match = (cat1 and cat2 and cat1 == cat2 and cat1 != 'nan' and cat1 != '-')

            # === SPECS COMPARISON ===
            specs1 = self._parse_specs(item1.get('Technical_Specs'))
            specs2 = self._parse_specs(item2.get('Technical_Specs'))
            all_keys = set(list(specs1.keys()) + list(specs2.keys()))
            critical_keys_lower = {'size', 'ukuran', 'dimension', 'dimensi', 'weight', 'berat',
                                   'diameter', 'panjang', 'lebar', 'volume', 'capacity', 'kapasitas',
                                   'length', 'width', 'height'}
            match_count = 0
            total_count = 0
            critical_mismatch = False

            for k in all_keys:
                v1 = safe_str(specs1.get(k))
                v2 = safe_str(specs2.get(k))
                total_count += 1
                if v1 != '-' and v2 != '-' and v1.lower() == v2.lower():
                    match_count += 1
                elif k.lower() in critical_keys_lower:
                    try:
                        diff = abs(float(v1) - float(v2))
                        if diff > 5:
                            critical_mismatch = True
                    except:
                        pass

            specs_match = match_count / total_count if total_count > 0 else 0.0

            # === MEASUREMENT TOLERANCE CHECK ===
            desc1_str = str(item1.get('Description', '')).lower()
            desc2_str = str(item2.get('Description', '')).lower()
            meas1 = self._extract_measurements(desc1_str)
            meas2 = self._extract_measurements(desc2_str)
            measurement_diff = 0.0

            if meas1 and meas2:
                tolerances = {'mm': 5, 'cm': 0.5, 'kg': 0.5, 'g': 50,
                              'ml': 50, 'l': 0.05, 'v': 5, 'w': 10,
                              'in': 0.2, 'pcs': 0}
                for unit in meas1:
                    if unit in meas2:
                        diff = abs(meas1[unit] - meas2[unit])
                        tol = tolerances.get(unit, abs(meas1[unit]) * 0.2)
                        if diff > tol:
                            measurement_diff = diff
                            critical_mismatch = True

            # Apply penalty if critical mismatch
            final_score = sim_score
            if critical_mismatch:
                final_score -= 40.0

            # Only include if still above threshold after penalty
            if final_score < threshold * 100:
                continue

            # === ATTRIBUTE COMPARISON ===
            attr_comparison = []

            c1 = safe_str(item1.get('Category'))
            c2 = safe_str(item2.get('Category'))
            attr_comparison.append({
                'field': 'Kategori', 'val1': self._wrap_text(c1), 'val2': self._wrap_text(c2),
                'match': c1.lower() == c2.lower() and c1 != '-'
            })

            u1 = safe_str(item1.get('Unit'))
            u2 = safe_str(item2.get('Unit'))
            attr_comparison.append({
                'field': 'Satuan', 'val1': self._wrap_text(u1), 'val2': self._wrap_text(u2),
                'match': u1.lower() == u2.lower() and u1 != '-'
            })

            # Brand dari Technical_Specs (tidak ada kolom brand di tools)
            def get_brand_from_specs(item):
                raw_specs = item.get('Technical_Specs')
                if raw_specs:
                    parsed = self._parse_specs(raw_specs)
                    if parsed:
                        for k in ('brand', 'merek', 'Brand', 'Merek'):
                            b = parsed.get(k)
                            if b:
                                return safe_str(b)
                return '-'
            b1 = get_brand_from_specs(item1)
            b2 = get_brand_from_specs(item2)
            attr_comparison.append({
                'field': 'Merek', 'val1': self._wrap_text(b1), 'val2': self._wrap_text(b2),
                'match': b1.lower() == b2.lower() and b1 != '-' and b1 != 'nan'
            })

            lt1 = safe_float(item1.get('Lead_Time_Days'))
            lt2 = safe_float(item2.get('Lead_Time_Days'))
            attr_comparison.append({
                'field': 'Lead Time', 'val1': self._wrap_text(f"{int(lt1)} hari"), 'val2': self._wrap_text(f"{int(lt2)} hari"),
                'match': abs(lt1 - lt2) <= 1
            })

            # Technical specs
            for k in sorted(all_keys):
                sv1 = safe_str(specs1.get(k))
                sv2 = safe_str(specs2.get(k))
                attr_comparison.append({
                    'field': str(k).title(), 'val1': self._wrap_text(sv1), 'val2': self._wrap_text(sv2),
                    'match': sv1.lower() == sv2.lower() and sv1 != '-'
                })

            # === MATCH/MISMATCH STATS ===
            total_match = sum(1 for a in attr_comparison if a['match'])
            total_attrs = len(attr_comparison)
            match_fields = [a['field'] for a in attr_comparison if a['match']]
            mismatch_fields = [a['field'] for a in attr_comparison if not a['match']]

            # === STOCK COMPARISON ===
            curr1 = int(safe_float(item1.get('Current_Stock')))
            curr2 = int(safe_float(item2.get('Current_Stock')))
            min1 = int(safe_float(item1.get('Min_Stock', 1)))
            min2 = int(safe_float(item2.get('Min_Stock', 1)))
            max1 = int(safe_float(item1.get('Max_Stock', 10)))
            max2 = int(safe_float(item2.get('Max_Stock', 10)))

            stock1_status = self._get_stock_status(curr1, min1, max1)
            stock2_status = self._get_stock_status(curr2, min2, max2)

            # === PRICE COMPARISON ===
            price1 = safe_float(item1.get('Unit_Price'))
            price2 = safe_float(item2.get('Unit_Price'))
            price_diff = price2 - price1
            if abs(price_diff) < 1:
                price_diff_str = "±Rp 0"
            elif price_diff > 0:
                price_diff_str = f"+Rp {int(price_diff):,}"
            else:
                price_diff_str = f"-Rp {int(abs(price_diff)):,}"

            # === STOCK-BASED VARIABLES ===
            stock1_out = curr1 <= 0
            stock2_out = curr2 <= 0
            both_out = stock1_out and stock2_out
            one_out = stock1_out != stock2_out

            # === ACTION RECOMMENDATION ===
            action, action_reasons = self._determine_action(
                final_score, specs_match, category_match, measurement_diff,
                stock1_out, stock2_out)

            # === STOCK-BASED ACTION LABEL ===
            if action == "SUBSTITUTE":
                if stock1_out and not stock2_out:
                    action_label = f"SUBSTITUTE → {item1['SKU_ID']} (kosong) ← gunakan {item2['SKU_ID']}"
                elif stock2_out and not stock1_out:
                    action_label = f"SUBSTITUTE → {item2['SKU_ID']} (kosong) ← gunakan {item1['SKU_ID']}"
                else:
                    action_label = "SUBSTITUTE → Item bisa saling menggantikan"
            elif action == "MERGE":
                action_label = "MERGE → Pertimbangkan gabungkan kedua item"
            elif action == "KEEP_SEPARATE":
                action_label = "KEEP SEPARATE → Simpan sebagai item berbeda"
            else:
                action_label = "REVIEW → Perlu review manual"

            # === AI VERDICT FOR TOOLCRIB STAFF ===
            if final_score >= 85:
                if both_out:
                    verdict = f"Kedua item adalah DUPLIKAT (similaritas {final_score:.0f}%) dan sama-sama KOSONG. Rekomendasi: MERGE untuk hindari pemborosan data master."
                elif one_out:
                    out_item = item1['SKU_ID'] if stock1_out else item2['SKU_ID']
                    sub_item = item2['SKU_ID'] if stock1_out else item1['SKU_ID']
                    verdict = f"{out_item} kosong tapi {sub_item} tersedia dan spesifikasi mirip ({final_score:.0f}%). Gunakan {sub_item} sebagai SUBSTITUSI sementara."
                else:
                    verdict = f"Item sangat mirip ({final_score:.0f}%) dengan spesifikasi yang cocok ({total_match}/{total_attrs} atribut identik). Jika stok berlebih di satu sisi, pertimbangkan SUBSTITUSI."
            elif final_score >= 65:
                if one_out:
                    verdict = f"Item SERUPA ({final_score:.0f}%) — item kosong bisa digantikan. Matching attrs: {total_match}/{total_attrs}."
                else:
                    verdict = f"Item SERUPA ({final_score:.0f}%) — {total_match}/{total_attrs} atribut cocok. Simpan sebagai CADANGAN satu sama lain."
            else:
                verdict = f"Item MEMILIKI KEMIRIPAN ({final_score:.0f}%) — {total_match}/{total_attrs} atribut cocok. Perlu review manual."

            # Add substitution potential if applicable
            if stock1_out and curr2 > 0 and final_score >= 40:
                verdict += f"\n[OPSI SUBSTITUSI] {item1['SKU_ID']} (0 unit) ← Ganti dengan {item2['SKU_ID']} ({curr2} unit)."
            elif stock2_out and curr1 > 0 and final_score >= 40:
                verdict += f"\n[OPSI SUBSTITUSI] {item2['SKU_ID']} (0 unit) ← Ganti dengan {item1['SKU_ID']} ({curr1} unit)."

            duplicate_pairs.append({
                'SKU_1': item1['SKU_ID'],
                'Desc_1': self._wrap_text(safe_str(item1.get('Description'))),
                'Full_Desc_1': self._wrap_text(safe_str(item1.get('description'))),
                'Category_1': c1,
                'Unit_1': u1,
                'Brand_1': b1,
                'Specs_1': format_specs(item1.get('Technical_Specs')),
                'Stock_1': curr1,
                'Stock_Status_1': stock1_status,
                'Price_1': price1,
                'Lead_Time_1': int(lt1),
                'Image_URL_1': safe_str(item1.get('Image_URL')),

                'SKU_2': item2['SKU_ID'],
                'Desc_2': self._wrap_text(safe_str(item2.get('Description'))),
                'Full_Desc_2': self._wrap_text(safe_str(item2.get('description'))),
                'Category_2': c2,
                'Unit_2': u2,
                'Brand_2': b2,
                'Specs_2': format_specs(item2.get('Technical_Specs')),
                'Stock_2': curr2,
                'Stock_Status_2': stock2_status,
                'Price_2': price2,
                'Lead_Time_2': int(lt2),
                'Image_URL_2': safe_str(item2.get('Image_URL')),

                'Similarity_Score': round(final_score, 1),
                'Specs_Match_Rate': round(specs_match * 100, 1),
                'Match_Attributes': f"{total_match}/{total_attrs}",
                'Matching_Terms': ', '.join(match_fields[:5]) if match_fields else '-',
                'Mismatch_Fields': self._wrap_text(', '.join(mismatch_fields[:3])) if mismatch_fields else '-',
                'Price_Difference': price_diff_str,
                'Stock_Comparison': f"{curr1} vs {curr2} unit",
                'Attr_Comparison': attr_comparison,

                'Action': action,
                'Action_Label': action_label,
                'Action_Reasons': action_reasons,
                'Verdict': verdict
            })

        result_df = pd.DataFrame(duplicate_pairs)
        if not result_df.empty:
            # Sort: OUT_OF_STOCK items first, then by similarity
            priority_order = {'OUT_OF_STOCK': 0, 'LOW_STOCK': 1, 'OPTIMAL': 2, 'OVERSTOCK': 3}
            result_df['_p1'] = result_df['Stock_Status_1'].map(priority_order).fillna(4)
            result_df['_p2'] = result_df['Stock_Status_2'].map(priority_order).fillna(4)
            result_df['_priority'] = result_df['_p1'] + result_df['_p2']
            result_df = result_df.sort_values(['_priority', 'Similarity_Score'], ascending=[True, False])
            result_df = result_df.drop(columns=['_p1', '_p2', '_priority'])
            result_df = result_df.reset_index(drop=True)

        self._cache[cache_key] = result_df
        return result_df

    def find_substitutes(self, df_sku: pd.DataFrame, sku_id: str, threshold: float = 0.40) -> dict:
        """
        Cari pengganti untuk 1 SKU spesifik.
        Ini endpoint terpisah yang dipanggil ketika staff ingin tahu
        'apa yang bisa dipakai sebagai pengganti item X yang kosong?'
        """
        if df_sku.empty:
            return {
                "sku_id": sku_id,
                "sku_name": None,
                "current_stock": 0,
                "stock_status": "UNKNOWN",
                "min_stock": 0,
                "max_stock": 0,
                "substitutes": [],
                "message": "Master data kosong."
            }

        # Ambil data item target
        target_rows = df_sku[df_sku['SKU_ID'] == sku_id]
        if target_rows.empty:
            return {
                "sku_id": sku_id,
                "sku_name": None,
                "current_stock": 0,
                "stock_status": "UNKNOWN",
                "min_stock": 0,
                "max_stock": 0,
                "substitutes": [],
                "message": f"SKU '{sku_id}' tidak ditemukan di master data."
            }

        target = target_rows.iloc[0]
        target_stock = int(target.get('Current_Stock', 0))
        target_min = int(target.get('Min_Stock', 1))
        target_max = int(target.get('Max_Stock', 10))
        target_status = self._get_stock_status(target_stock, target_min, target_max)
        target_rich_desc = self._build_rich_description(target)

        def safe_str(val):
            if val is None or (isinstance(val, float) and pd.isna(val)):
                return '-'
            return str(val)

        def safe_float(val):
            try:
                return float(val) if val is not None and not (isinstance(val, float) and pd.isna(val)) else 0.0
            except:
                return 0.0

        def brand_from_specs(item):
            raw = item.get('Technical_Specs')
            if not raw:
                return '-'
            parsed = self._parse_specs(raw)
            if not parsed:
                return '-'
            for k in ('brand', 'merek', 'Brand', 'Merek'):
                b = parsed.get(k)
                if b:
                    return safe_str(b)
            return '-'

        # Encode target description
        if target_rich_desc not in self._embedding_cache:
            self._embedding_cache[target_rich_desc] = self.nlp_model.encode([target_rich_desc])[0]

        target_emb = self._embedding_cache[target_rich_desc]

        # Bandingkan dengan semua item lain
        substitutes = []
        target_specs = self._parse_specs(target.get('Technical_Specs'))
        target_meas = self._extract_measurements(str(target.get('Description', '')).lower())

        for idx, row in df_sku.iterrows():
            if row['SKU_ID'] == sku_id:
                continue

            # Skip item yang juga kosong
            sub_stock = int(safe_float(row.get('Current_Stock')))
            sub_min = int(safe_float(row.get('Min_Stock', 1)))
            sub_max = int(safe_float(row.get('Max_Stock', 10)))

            rich_desc = self._build_rich_description(row)
            if rich_desc not in self._embedding_cache:
                self._embedding_cache[rich_desc] = self.nlp_model.encode([rich_desc])[0]
            sub_emb = self._embedding_cache[rich_desc]

            sim = cosine_similarity([target_emb], [sub_emb])[0][0] * 100
            if sim < threshold * 100:
                continue

            # Spec match
            sub_specs = self._parse_specs(row.get('Technical_Specs'))
            all_keys = set(list(target_specs.keys()) + list(sub_specs.keys()))
            match_count = sum(
                1 for k in all_keys
                if safe_str(target_specs.get(k)).lower() == safe_str(sub_specs.get(k)).lower()
                and safe_str(target_specs.get(k)) != '-'
            )
            total_count = sum(1 for k in all_keys if safe_str(target_specs.get(k)) != '-' or safe_str(sub_specs.get(k)) != '-')
            specs_match = match_count / total_count if total_count > 0 else 0.0

            # Measurement check
            sub_meas = self._extract_measurements(str(row.get('Description', '')).lower())
            meas_issue = False
            for unit in target_meas:
                if unit in sub_meas:
                    diff = abs(target_meas[unit] - sub_meas[unit])
                    tol = 5 if unit == 'mm' else (0.5 if unit == 'cm' else 1)
                    if diff > tol:
                        meas_issue = True
                        break

            final_score = sim
            if meas_issue:
                final_score -= 30.0

            if final_score < threshold * 100:
                continue

            # Price diff
            target_price = safe_float(target.get('Unit_Price'))
            sub_price = safe_float(row.get('Unit_Price'))
            price_diff = sub_price - target_price
            if abs(price_diff) < 1:
                price_diff_str = "±Rp 0"
            elif price_diff > 0:
                price_diff_str = f"+Rp {int(price_diff):,}"
            else:
                price_diff_str = f"-Rp {int(abs(price_diff)):,}"

            # Lead time comparison
            target_lt = int(safe_float(target.get('Lead_Time_Days')))
            sub_lt = int(safe_float(row.get('Lead_Time_Days')))
            lt_diff = sub_lt - target_lt
            if lt_diff == 0:
                lt_str = f"Sama ({sub_lt} hari)"
            elif lt_diff > 0:
                lt_str = f"+{lt_diff} hari (lebih lama)"
            else:
                lt_str = f"{lt_diff} hari (lebih cepat)"

            # Action
            sub_status = self._get_stock_status(sub_stock, sub_min, sub_max)
            if meas_issue:
                action = "NOT_RECOMMENDED"
                reason = "Perbedaan ukuran/spesifikasi kritis — tidak bisa用作 pengganti."
            elif sim >= 85 and specs_match >= 0.7:
                if sub_stock >= sub_min:
                    action = "STRONGLY_RECOMMENDED"
                    reason = f"Spesifikasi sangat mirip ({sim:.0f}%) dan stock tersedia ({sub_stock} unit)."
                else:
                    action = "WEAK_RECOMMENDATION"
                    reason = f"Spesifikasi mirip ({sim:.0f}%) tapi stock juga rendah ({sub_stock} unit)."
            elif sim >= 60:
                action = "CONSIDER"
                reason = f"Item serupa ({sim:.0f}%) — bisa jadi alternatif."
            else:
                action = "LAST_RESORT"
                reason = f"Hanya mirip {sim:.0f}% — pertimbangkan hanya jika tidak ada opsi lain."

            substitutes.append({
                'sku_id': row['SKU_ID'],
                'description': safe_str(row.get('Description')),
                'category': safe_str(row.get('Category')),
                'brand': brand_from_specs(row),
                'specs': ', '.join([f"{k}: {v}" for k, v in sub_specs.items()]) or '-',
                'similarity_score': round(final_score, 1),
                'specs_match_rate': round(specs_match * 100, 1),
                'current_stock': sub_stock,
                'stock_status': sub_status,
                'min_stock': sub_min,
                'max_stock': sub_max,
                'price': sub_price,
                'price_difference': price_diff_str,
                'lead_time_days': sub_lt,
                'lead_time_comparison': lt_str,
                'image_url': safe_str(row.get('Image_URL')),
                'action': action,
                'reason': reason
            })

        # Sort: STRONGLY_RECOMMENDED first, then by stock, then by similarity
        priority_order = {'STRONGLY_RECOMMENDED': 0, 'CONSIDER': 1, 'WEAK_RECOMMENDATION': 2, 'LAST_RESORT': 3, 'NOT_RECOMMENDED': 4}
        substitutes = sorted(substitutes, key=lambda x: (priority_order.get(x['action'], 5), -x['current_stock'], -x['similarity_score']))

        return {
            "sku_id": sku_id,
            "sku_name": safe_str(target.get('Description')),
            "category": safe_str(target.get('Category')),
            "brand": brand_from_specs(target),
            "current_stock": target_stock,
            "stock_status": target_status,
            "min_stock": target_min,
            "max_stock": target_max,
            "target_price": safe_float(target.get('Unit_Price')),
            "target_lead_time": int(safe_float(target.get('Lead_Time_Days'))),
            "specs": ', '.join([f"{k}: {v}" for k, v in target_specs.items()]) or '-',
            "image_url": safe_str(target.get('Image_URL')),
            "substitutes": substitutes,
            "total_candidates": len(substitutes),
            "recommended_count": sum(1 for s in substitutes if s['action'] == 'STRONGLY_RECOMMENDED'),
            "message": f"Ditemukan {len(substitutes)} kandidat pengganti untuk {sku_id}."
        }
