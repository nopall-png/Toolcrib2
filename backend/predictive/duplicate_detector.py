import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import hashlib
import json
import numpy as np
import re

class DuplicateDetector:
    def __init__(self):
        print("[INFO] Memuat Model NLP Semantik untuk Deteksi Duplikat...")
        self.nlp_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        print("[INFO] Model NLP Semantik berhasil dimuat.")
        self._cache = {}
        self._embedding_cache = {} # Cache embeddings per description to speed up incremental updates

    def _get_cache_key(self, df_sku: pd.DataFrame, threshold: float) -> str:
        data = df_sku[['SKU_ID', 'Description']].sort_values('SKU_ID').to_dict(orient='records')
        key_str = json.dumps({'data': data, 'threshold': threshold})
        return hashlib.md5(key_str.encode('utf-8')).hexdigest()

    def _build_rich_description(self, row) -> str:
        parts = []
        base_desc = str(row.get('Description', ''))
        parts.append(base_desc)
        
        category = row.get('category', '')
        if category and not pd.isna(category):
            parts.append(f"Category: {category}")
        
        full_desc = row.get('description', '')
        if full_desc and not pd.isna(full_desc):
            parts.append(str(full_desc))
        
        specs = row.get('Technical_Specs')
        if specs and not pd.isna(specs):
            if isinstance(specs, str):
                try:
                    specs = json.loads(specs)
                except:
                    specs = None
            if isinstance(specs, dict):
                filtered_specs = {k: v for k, v in specs.items() if str(k).lower() != 'brand'}
                if filtered_specs:
                    spec_str = ", ".join([f"{k}: {v}" for k, v in filtered_specs.items()])
                    parts.append(f"Specs: {spec_str}")
        
        return ". ".join(parts)

    def detect_duplicate_sku(self, df_sku: pd.DataFrame, threshold: float = 0.40) -> pd.DataFrame:
        if df_sku.empty:
            return pd.DataFrame()
            
        cache_key = self._get_cache_key(df_sku, threshold)
        if cache_key in self._cache:
            print("[INFO] Menggunakan hasil deteksi duplikat dari cache.")
            return self._cache[cache_key]

        print("[INFO] Menghitung kesamaan semantik (dengan incremental embedding cache)...")
        rich_descriptions = df_sku.apply(self._build_rich_description, axis=1).tolist()
        sku_ids = df_sku['SKU_ID'].tolist()
        original_descriptions = df_sku['Description'].tolist()

        # Incremental Encoding: Only encode descriptions we haven't seen before
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
            return str(val) if val is not None and not (isinstance(val, float) and pd.isna(val)) else '-'
        
        def format_specs(specs_raw):
            if specs_raw is None or (isinstance(specs_raw, float) and pd.isna(specs_raw)):
                return '-'
            if isinstance(specs_raw, str):
                try: specs_raw = json.loads(specs_raw)
                except: return specs_raw
            if isinstance(specs_raw, dict):
                return ', '.join([f"{k}: {v}" for k, v in specs_raw.items()])
            return str(specs_raw)

        for i, j in zip(i_indices, j_indices):
            item1 = df_sku.iloc[i]
            item2 = df_sku.iloc[j]
            matches = []
            mismatch_critical = False

            # 1. Kategori
            cat1 = str(item1.get('category', '')).strip()
            cat2 = str(item2.get('category', '')).strip()
            if cat1 and cat2 and cat1.lower() == cat2.lower() and cat1.lower() != 'nan':
                matches.append(f"Kategori sama ({cat1})")

            # 2. Spesifikasi Teknis (JSON)
            try:
                specs1 = item1.get('Technical_Specs')
                specs2 = item2.get('Technical_Specs')
                if isinstance(specs1, str): specs1 = json.loads(specs1)
                if isinstance(specs2, str): specs2 = json.loads(specs2)
                
                if isinstance(specs1, dict) and isinstance(specs2, dict):
                    for k, v1 in specs1.items():
                        v2 = specs2.get(k)
                        if v2 is not None:
                            if str(v1).lower() == str(v2).lower():
                                matches.append(f"{str(k).title()} identik ({v1})")
                            else:
                                key_lower = str(k).lower()
                                critical_keys = ['size', 'ukuran', 'dimension', 'dimensi', 'weight', 'berat', 'diameter', 'panjang', 'lebar', 'volume', 'capacity', 'kapasitas']
                                if key_lower in critical_keys:
                                    mismatch_critical = True
            except:
                pass

            # 2b. Ekstraksi Ukuran Fisik dari Teks Deskripsi (Anti-Blunder 10mm vs 100mm)
            desc1_str = str(item1.get('Description', '')).lower()
            desc2_str = str(item2.get('Description', '')).lower()
            
            # Cari pola angka + satuan (contoh: 10mm, 5.5 kg, 100 v)
            pattern = r'(\d+(?:\.\d+)?)\s*(mm|cm|m|kg|g|mg|ml|l|v|w|inch|in|ft|pcs)\b'
            meas1 = re.findall(pattern, desc1_str)
            meas2 = re.findall(pattern, desc2_str)
            
            if meas1 and meas2:
                # Toleransi absolut per satuan (beda kecil = masih bisa dianggap mirip)
                tolerances = {'mm': 5, 'cm': 0.5, 'kg': 0.5, 'g': 50, 'ml': 50, 'l': 0.05, 'v': 5, 'w': 10, 'inch': 0.2, 'in': 0.2}
                dict_meas1 = {unit: float(val) for val, unit in meas1}
                dict_meas2 = {unit: float(val) for val, unit in meas2}
                for unit in dict_meas1:
                    if unit in dict_meas2:
                        diff = abs(dict_meas1[unit] - dict_meas2[unit])
                        tol = tolerances.get(unit, abs(dict_meas1[unit]) * 0.2)  # Default: toleransi 20%
                        if diff > tol:
                            mismatch_critical = True
                            break

            # 3. Kata Kunci Spesifik di Deskripsi
            desc1_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', str(item1.get('Description', '')).lower()))
            desc2_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', str(item2.get('Description', '')).lower()))
            stop_words = {'dan', 'atau', 'dengan', 'untuk', 'yang', 'dari', 'pada'}
            common = list(desc1_words.intersection(desc2_words) - stop_words)
            if common:
                matches.append(f"Istilah deskripsi identik ({', '.join(common[:3])})")

            # Hitung skor akhir dengan penalti
            raw_score = float(similarity_matrix[i][j]) * 100
            final_score = round(raw_score, 1)
            if mismatch_critical:
                final_score -= 40.0  # Penalti ekstrim jika ukuran beda
                
            # Hanya masukkan jika setelah penalti skornya masih di atas batas
            if final_score >= threshold * 100:
                # Ambil deskripsi lengkap untuk ditampilkan di UI
                full_desc1 = str(item1.get('description', '')) if not pd.isna(item1.get('description', '')) else ''
                full_desc2 = str(item2.get('description', '')) if not pd.isna(item2.get('description', '')) else ''

                # Perbandingan atribut per-field (✅/❌)
                attr_comparison = []
                
                c1 = safe_str(item1.get('category'))
                c2 = safe_str(item2.get('category'))
                attr_comparison.append({'field': 'Kategori', 'val1': c1, 'val2': c2, 'match': c1.lower() == c2.lower() and c1 != '-'})
                
                u1 = safe_str(item1.get('unit'))
                u2 = safe_str(item2.get('unit'))
                attr_comparison.append({'field': 'Satuan', 'val1': u1, 'val2': u2, 'match': u1.lower() == u2.lower() and u1 != '-'})
                
                # Bandingkan tiap key spesifikasi teknis
                try:
                    s1 = item1.get('Technical_Specs')
                    s2 = item2.get('Technical_Specs')
                    if isinstance(s1, str): s1 = json.loads(s1)
                    if isinstance(s2, str): s2 = json.loads(s2)
                    if isinstance(s1, dict) and isinstance(s2, dict):
                        all_keys = set(list(s1.keys()) + list(s2.keys()))
                        for k in sorted(all_keys):
                            sv1 = safe_str(s1.get(k))
                            sv2 = safe_str(s2.get(k))
                            attr_comparison.append({'field': str(k).title(), 'val1': sv1, 'val2': sv2, 'match': sv1.lower() == sv2.lower() and sv1 != '-'})
                except:
                    pass

                # Hitung jumlah match/mismatch untuk kesimpulan
                total_match = sum(1 for a in attr_comparison if a['match'])
                total_attrs = len(attr_comparison)
                match_fields = [a['field'] for a in attr_comparison if a['match']]
                mismatch_fields = [a['field'] for a in attr_comparison if not a['match']]
                
                # Generate kesimpulan AI otomatis
                if final_score >= 80:
                    verdict = f"AI menyimpulkan: Kedua barang ini KEMUNGKINAN BESAR DUPLIKAT karena {total_match}/{total_attrs} atribut identik"
                    if match_fields:
                        verdict += f" ({', '.join(match_fields[:3])})"
                    verdict += "."
                elif final_score >= 50:
                    verdict = f"AI menyimpulkan: Kedua barang ini SERUPA TAPI BELUM PASTI DUPLIKAT ({total_match}/{total_attrs} atribut cocok)."
                    if mismatch_fields:
                        verdict += f" Perbedaan ditemukan pada: {', '.join(mismatch_fields[:3])}."
                else:
                    verdict = f"AI menyimpulkan: Kedua barang ini KEMUNGKINAN BUKAN DUPLIKAT (hanya {total_match}/{total_attrs} atribut cocok)."
                    if mismatch_fields:
                        verdict += f" Berbeda di: {', '.join(mismatch_fields[:3])}."

                duplicate_pairs.append({
                    'SKU_1': sku_ids[i],
                    'Desc_1': original_descriptions[i],
                    'Full_Desc_1': full_desc1,
                    'Category_1': c1,
                    'Unit_1': u1,
                    'Specs_1': format_specs(item1.get('Technical_Specs')),
                    'SKU_2': sku_ids[j],
                    'Desc_2': original_descriptions[j],
                    'Full_Desc_2': full_desc2,
                    'Category_2': c2,
                    'Unit_2': u2,
                    'Specs_2': format_specs(item2.get('Technical_Specs')),
                    'Similarity_Score': final_score,
                    'Matching_Terms': matches,
                    'Attr_Comparison': attr_comparison,
                    'Verdict': verdict
                })

        result_df = pd.DataFrame(duplicate_pairs)
        self._cache[cache_key] = result_df
        return result_df
