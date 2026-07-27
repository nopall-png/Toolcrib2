import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

class DuplicateDetector:
    def __init__(self):
        print("[INFO] Memuat Model NLP Semantik untuk Deteksi Duplikat...")
        self.nlp_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        print("[INFO] Model NLP Semantik berhasil dimuat.")

    def detect_duplicate_sku(self, df_sku: pd.DataFrame, threshold: float = 0.60) -> pd.DataFrame:
        """
        Mencari indikasi barang duplikat menggunakan Semantic Word Embeddings.
        """
        descriptions = df_sku['Description'].tolist()
        sku_ids = df_sku['SKU_ID'].tolist()

        embeddings = self.nlp_model.encode(descriptions)
        similarity_matrix = cosine_similarity(embeddings)

        duplicate_pairs = []
        for i in range(len(sku_ids)):
            for j in range(i + 1, len(sku_ids)):
                if similarity_matrix[i][j] >= threshold:
                    duplicate_pairs.append({
                        'SKU_1': sku_ids[i],
                        'Desc_1': descriptions[i],
                        'SKU_2': sku_ids[j],
                        'Desc_2': descriptions[j],
                        'Similarity_Score': round(similarity_matrix[i][j] * 100, 1)
                    })

        return pd.DataFrame(duplicate_pairs)
