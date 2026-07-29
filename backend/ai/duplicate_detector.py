import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import hashlib
import json

class DuplicateDetector:
    def __init__(self):
        print("[INFO] Memuat Model NLP Semantik untuk Deteksi Duplikat...")
        self.nlp_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        print("[INFO] Model NLP Semantik berhasil dimuat.")
        self._cache = {}

    def _get_cache_key(self, df_sku: pd.DataFrame, threshold: float) -> str:
        # Create a simple hash based on sku ids, descriptions, and threshold
        data = df_sku[['SKU_ID', 'Description']].sort_values('SKU_ID').to_dict(orient='records')
        key_str = json.dumps({'data': data, 'threshold': threshold})
        return hashlib.md5(key_str.encode('utf-8')).hexdigest()

    def _build_rich_description(self, row) -> str:
        """
        Builds a rich text representation of an item for semantic comparison.
        Combines: name, category, full description, and technical_specs (excluding brand).
        """
        parts = []
        
        # 1. Base name (e.g. "Insulation Tester")
        base_desc = str(row.get('Description', ''))
        parts.append(base_desc)
        
        # 2. Category as context
        category = row.get('category', '')
        if category and not pd.isna(category):
            parts.append(f"Category: {category}")
        
        # 3. Full description field (the long one from Supabase 'description' column)
        full_desc = row.get('description', '')
        if full_desc and not pd.isna(full_desc):
            parts.append(str(full_desc))
        
        # 4. Technical specs (excluding brand per user request)
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
        """
        Mencari indikasi barang duplikat menggunakan Semantic Word Embeddings.
        Dilengkapi dengan in-memory caching untuk optimasi kecepatan.
        """
        if df_sku.empty:
            return pd.DataFrame()
            
        cache_key = self._get_cache_key(df_sku, threshold)
        if cache_key in self._cache:
            print("[INFO] Menggunakan hasil deteksi duplikat dari cache.")
            return self._cache[cache_key]

        print("[INFO] Menghitung kesamaan semantik (tanpa cache)...")
        # Build rich descriptions for each row
        rich_descriptions = df_sku.apply(self._build_rich_description, axis=1).tolist()
        sku_ids = df_sku['SKU_ID'].tolist()
        # Still keep the original description for the output table
        original_descriptions = df_sku['Description'].tolist()

        embeddings = self.nlp_model.encode(rich_descriptions)
        similarity_matrix = cosine_similarity(embeddings)

        duplicate_pairs = []
        for i in range(len(sku_ids)):
            for j in range(i + 1, len(sku_ids)):
                if similarity_matrix[i][j] >= threshold:
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

