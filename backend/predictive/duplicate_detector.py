import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import hashlib
import json
import numpy as np

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

    def detect_duplicate_sku(self, df_sku: pd.DataFrame, threshold: float = 0.60) -> pd.DataFrame:
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
        for i, j in zip(i_indices, j_indices):
            duplicate_pairs.append({
                'SKU_1': sku_ids[i],
                'Desc_1': original_descriptions[i],
                'SKU_2': sku_ids[j],
                'Desc_2': original_descriptions[j],
                'Similarity_Score': round(similarity_matrix[i][j] * 100, 1)
            })

        result_df = pd.DataFrame(duplicate_pairs)
        self._cache[cache_key] = result_df
        return result_df
