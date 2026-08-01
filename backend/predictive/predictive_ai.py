"""
PTMI ToolCrib - Predictive & Analytical AI Engine
File: predictive_ai.py
Purpose: Handles all statistical, machine learning, time-series forecasting (Prophet),
         inventory optimization, ABC/XYZ classification, and NLP similarity tasks.
Port: 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import pandas as pd

from data_provider import get_data
from criticality_classifier import CriticalityClassifier
from duplicate_detector import DuplicateDetector
from forecaster import StockForecaster
from minmax_optimizer import MinMaxOptimizer
from inventory_optimizer import InventoryOptimizer

app = FastAPI(
    title="PTMI ToolCrib Predictive AI API",
    description="API Engine untuk Predictive Analytics & Machine Learning Toolcrib PTMI",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    import asyncio
    async def periodic_sync():
        # Berikan jeda 5 detik agar server FastAPI selesai booting sepenuhnya
        await asyncio.sleep(5)
        while True:
            try:
                print("[PREDICTIVE AI] Background Auto-Syncing AI Cache & NLP...")
                # Jalankan fungsi secara asinkron di thread terpisah agar tidak memblokir event loop (mencegah deadlock)
                await asyncio.to_thread(sync_ai_cache)
                
                # Pre-warm model Duplicate Detector NLP
                df_sku, _, _ = get_data()
                await asyncio.to_thread(detector.detect_duplicate_sku, df_sku, 0.60)
                
                print("[PREDICTIVE AI] Auto-Sync Complete.")
            except Exception as e:
                import traceback
                print(f"[PREDICTIVE AI] Auto-Sync Failed: {e}\n{traceback.format_exc()}")
            # Setelah sync pertama sukses, baru tunggu 24 jam untuk sync berikutnya
            await asyncio.sleep(86400)
                
    asyncio.create_task(periodic_sync())

detector = DuplicateDetector()
forecaster = StockForecaster()
minmax_engine = MinMaxOptimizer()
inv_opt_engine = InventoryOptimizer()
crit_classifier = CriticalityClassifier()


@app.get("/")
def read_root():
    return {
        "service": "PTMI ToolCrib Predictive AI Engine",
        "status": "online",
        "port": 8000,
        "docs": "/docs"
    }


@app.get("/api/ai/dashboard-summary")
def get_dashboard_summary():
    try:
        df_sku, df_machine, df_trx = get_data()
        if df_sku.empty:
            return {"health_score": 0, "class_a_count": 0, "critical_sku_count": 0, "optimization_value": 0}

        df_opt = inv_opt_engine.generate_optimization_opportunities(df_sku, df_trx)
        critical_skus = df_opt[df_opt['Action'] == 'UNDERSTOCK']
        critical_sku_count = len(critical_skus)

        total_skus = len(df_opt)
        healthy_skus = total_skus - critical_sku_count
        health_score = int((healthy_skus / total_skus) * 100) if total_skus > 0 else 0
        class_a_count = len(df_opt[df_opt['ABC_Class'] == 'A'])
        excess_value = df_opt['Excess_Value'].sum()

        return {
            "health_score": health_score,
            "class_a_count": class_a_count,
            "critical_sku_count": critical_sku_count,
            "optimization_value": int(excess_value)
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}


@app.get("/api/ai/minmax")
def get_dynamic_minmax():
    try:
        df_sku, df_machines, df_trx = get_data()
        df_result = minmax_engine.calculate_abc_xyz_and_minmax(df_sku, df_trx)
        
        df_result = pd.merge(df_result, df_sku[['SKU_ID', 'Current_Stock']], on='SKU_ID', how='left')
        df_result['Current_Stock'] = df_result['Current_Stock'].fillna(0)

        def determine_status(row):
            if row['Current_Stock'] > row['Dynamic_Max']: return 'OVERSTOCK'
            if row['Current_Stock'] <= row['Dynamic_Min_ROP']: return 'UNDERSTOCK'
            if row['ABC_Class'] == 'C' and row.get('XYZ_Class') == 'Z': return 'SLOW_MOVING'
            return 'OPTIMAL'
            
        df_result['Status'] = df_result.apply(determine_status, axis=1)

        return {"status": "success", "data": df_result.to_dict(orient="records")}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}


@app.get("/api/ai/inventory-optimization")
def get_inventory_optimization():
    try:
        df_sku, _, df_trx = get_data()
        df_result = inv_opt_engine.generate_optimization_opportunities(df_sku, df_trx)
        return {"status": "success", "data": df_result.to_dict(orient="records")}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}


@app.get("/api/ai/critical-spares")
def get_critical_spares():
    try:
        df_sku, df_machines, df_trx = get_data()
        df_result = crit_classifier.classify_critical_spares(df_sku, df_trx, df_machines)
        
        df_minmax = minmax_engine.calculate_abc_xyz_and_minmax(df_sku, df_trx)
        df_result = pd.merge(df_result, df_sku[['SKU_ID', 'Current_Stock']], on='SKU_ID', how='left')
        df_result = pd.merge(df_result, df_minmax[['SKU_ID', 'Dynamic_Min_ROP']], on='SKU_ID', how='left')
        
        df_result['Current_Stock'] = df_result['Current_Stock'].fillna(0)
        df_result['Dynamic_Min_ROP'] = df_result['Dynamic_Min_ROP'].fillna(1)
        
        return {"status": "success", "data": df_result.to_dict(orient="records")}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}


@app.get("/api/ai/duplicates")
def get_duplicate_skus(threshold: float = 0.60):
    try:
        df_sku, _, _ = get_data()
        df_result = detector.detect_duplicate_sku(df_sku, threshold)
        return {"status": "success", "data": df_result.to_dict(orient="records")}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}


@app.get("/api/ai/forecast/{sku_id}")
def get_forecast(sku_id: str, days: int = 30):
    try:
        df_sku, _, df_trx = get_data()
        df_sku_item = df_sku[df_sku['SKU_ID'] == sku_id]
        if df_sku_item.empty:
            raise HTTPException(status_code=404, detail=f"SKU {sku_id} tidak ditemukan.")
            
        df_trx_sku = df_trx[df_trx['SKU_ID'] == sku_id]
        forecast_df = forecaster.forecast_demand(df_trx_sku, forecast_days=days)
        return {"status": "success", "sku_id": sku_id, "data": forecast_df.to_dict(orient="records")}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}


@app.get("/api/ai/tools")
def get_tools_list():
    from data_provider import supabase
    res = supabase.table('tools').select('code, name').order('code').execute()
    return {"status": "success", "data": res.data}


@app.post("/api/ai/sync-cache")
def sync_ai_cache():
    try:
        from data_provider import update_ai_cache
        df_sku, _, df_trx = get_data()
        df_result = minmax_engine.calculate_abc_xyz_and_minmax(df_sku, df_trx)
        df_merged = pd.merge(df_result, df_sku[['SKU_ID', 'id']], on='SKU_ID', how='inner')
        
        payload = []
        for _, row in df_merged.iterrows():
            payload.append({
                'id': row['id'],
                'ai_min_stock': int(row.get('Dynamic_Min_ROP', 1)),
                'ai_max_stock': int(row.get('Dynamic_Max', 2)),
                'abc_class': str(row.get('ABC_Class', 'C')),
                'xyz_class': str(row.get('XYZ_Class', 'Z'))
            })
            
        success = update_ai_cache(payload)
        if success:
            return {"status": "success", "message": f"Successfully cached {len(payload)} tools."}
        else:
            return {"status": "error", "message": "Failed to update Supabase cache."}
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("predictive_ai:app", host="0.0.0.0", port=8000, reload=True)
