from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json

from data_provider import get_mock_data
from criticality_classifier import CriticalityClassifier
from duplicate_detector import DuplicateDetector
from forecaster import StockForecaster
from minmax_optimizer import MinMaxOptimizer
from inventory_optimizer import InventoryOptimizer

app = FastAPI(title="ToolCrib Predictive AI API", description="API untuk model Machine Learning Toolcrib PTMI")

# Konfigurasi CORS agar Next.js di localhost:3000 bisa memanggil API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inisialisasi Model (NLP model akan dimuat saat server start)
detector = DuplicateDetector()
forecaster = StockForecaster()
minmax_engine = MinMaxOptimizer()
inv_opt_engine = InventoryOptimizer()
crit_classifier = CriticalityClassifier()

@app.get("/")
def read_root():
    return {"message": "ToolCrib AI Backend is running. Access /docs for Swagger UI."}

@app.get("/api/ai/minmax")
def get_dynamic_minmax():
    """Mengembalikan rekomendasi Dynamic Min-Max beserta ABC/XYZ Class"""
    df_sku, _, df_trx = get_mock_data()
    df_result = minmax_engine.calculate_abc_xyz_and_minmax(df_sku, df_trx)
    # Konversi DataFrame ke List of Dict
    result = df_result.to_dict(orient="records")
    return {"status": "success", "data": result}

@app.get("/api/ai/inventory-optimization")
def get_inventory_optimization():
    """Mengembalikan daftar barang Overstock/Understock"""
    df_sku, _, df_trx = get_mock_data()
    df_result = inv_opt_engine.generate_optimization_opportunities(df_sku, df_trx)
    result = df_result.to_dict(orient="records")
    return {"status": "success", "data": result}

@app.get("/api/ai/critical-spares")
def get_critical_spares():
    """Mengklasifikasikan barang (CRITICAL, IMPORTANT, STANDARD)"""
    df_sku, df_machines, df_trx = get_mock_data()
    df_result = crit_classifier.classify_critical_spares(df_sku, df_trx, df_machines)
    result = df_result.to_dict(orient="records")
    return {"status": "success", "data": result}

@app.get("/api/ai/duplicates")
def get_duplicate_skus(threshold: float = 0.60):
    """Mendeteksi kemungkinan data SKU ganda menggunakan NLP"""
    df_sku, _, _ = get_mock_data()
    df_result = detector.detect_duplicate_sku(df_sku, threshold)
    result = df_result.to_dict(orient="records")
    return {"status": "success", "data": result}

@app.get("/api/ai/forecast/{sku_id}")
def get_stock_forecast(sku_id: str, days: int = 7):
    """Memprediksi stok masa depan menggunakan Prophet"""
    _, _, df_trx = get_mock_data()
    df_result = forecaster.forecast_stock(df_trx, sku_id, days_ahead=days)
    if df_result.empty:
        raise HTTPException(status_code=404, detail="SKU tidak ditemukan atau tidak ada histori transaksi")
    result = df_result.to_dict(orient="records")
    return {"status": "success", "data": result}
