"""
PTMI ToolCrib - Predictive & Analytical AI Engine
File: predictive_ai.py
Purpose: Handles all statistical, machine learning, time-series forecasting (Prophet),
         inventory optimization, ABC/XYZ classification, and NLP similarity tasks.
Port: 8000
"""

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np

try:
    from criticality_classifier import CriticalityClassifier
except ImportError:
    CriticalityClassifier = None

try:
    from duplicate_detector import DuplicateDetector
except ImportError:
    DuplicateDetector = None

try:
    from forecaster import StockForecaster
except ImportError:
    StockForecaster = None

try:
    from minmax_optimizer import MinMaxOptimizer
except ImportError:
    MinMaxOptimizer = None

try:
    from inventory_optimizer import InventoryOptimizer
except ImportError:
    InventoryOptimizer = None

from data_provider import get_data, get_tools_list

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
                if detector is not None:
                    df_sku, _, _ = get_data()
                    await asyncio.to_thread(detector.detect_duplicate_sku, df_sku, 0.40)
                
                print("[PREDICTIVE AI] Auto-Sync Complete.")
            except Exception as e:
                import traceback
                print(f"[PREDICTIVE AI] Auto-Sync Failed: {e}\n{traceback.format_exc()}")
            # Setelah sync pertama sukses, baru tunggu 24 jam untuk sync berikutnya
            await asyncio.sleep(86400)
                
    asyncio.create_task(periodic_sync())

detector = DuplicateDetector() if DuplicateDetector else None
forecaster = StockForecaster() if StockForecaster else None
minmax_engine = MinMaxOptimizer() if MinMaxOptimizer else None
inv_opt_engine = InventoryOptimizer() if InventoryOptimizer else None
crit_classifier = CriticalityClassifier() if CriticalityClassifier else None


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
        if inv_opt_engine is None:
            return {"error": "InventoryOptimizer tidak tersedia. Pastikan semua dependency terinstall."}
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
        if minmax_engine is None:
            return {"error": "MinMaxOptimizer tidak tersedia. Pastikan semua dependency terinstall."}
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

        df_result = df_result.replace({np.nan: None})
        return {"status": "success", "data": df_result.to_dict(orient="records")}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}


@app.get("/api/ai/inventory-optimization")
def get_inventory_optimization():
    try:
        if inv_opt_engine is None:
            return {"error": "InventoryOptimizer tidak tersedia. Pastikan semua dependency terinstall."}
        df_sku, _, df_trx = get_data()
        df_result = inv_opt_engine.generate_optimization_opportunities(df_sku, df_trx)
        df_result = df_result.replace({np.nan: None})
        return {"status": "success", "data": df_result.to_dict(orient="records")}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}


@app.get("/api/ai/critical-spares")
def get_critical_spares():
    try:
        if crit_classifier is None or minmax_engine is None:
            return {"error": "CriticalityClassifier atau MinMaxOptimizer tidak tersedia. Pastikan semua dependency terinstall."}
        df_sku, df_machines, df_trx = get_data()
        df_result = crit_classifier.classify_critical_spares(df_sku, df_trx, df_machines)
        
        df_minmax = minmax_engine.calculate_abc_xyz_and_minmax(df_sku, df_trx)
        df_result = pd.merge(df_result, df_sku[['SKU_ID', 'Current_Stock']], on='SKU_ID', how='left')
        df_result = pd.merge(df_result, df_minmax[['SKU_ID', 'Dynamic_Min_ROP']], on='SKU_ID', how='left')
        
        df_result['Current_Stock'] = df_result['Current_Stock'].fillna(0)
        df_result['Dynamic_Min_ROP'] = df_result['Dynamic_Min_ROP'].fillna(1)
        
        df_result = df_result.replace({np.nan: None})
        
        return {"status": "success", "data": df_result.to_dict(orient="records")}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

@app.get("/api/ai/duplicates")
def get_duplicate_skus(threshold: float = 0.40):
    try:
        if detector is None:
            return {"error": "DuplicateDetector tidak tersedia. Pastikan sentence_transformers terinstall."}
        if threshold < 0 or threshold > 1:
            raise HTTPException(status_code=400, detail="threshold harus antara 0 dan 1.")
        df_sku, _, _ = get_data()
        df_result = detector.detect_duplicate_sku(df_sku, threshold)

        # Summary stats per action
        if not df_result.empty:
            action_counts = df_result['Action'].value_counts().to_dict()
            substitute_pairs = df_result[df_result['Action'] == 'SUBSTITUTE']
            merge_pairs = df_result[df_result['Action'] == 'MERGE']
            review_pairs = df_result[df_result['Action'] == 'REVIEW']
            keep_pairs = df_result[df_result['Action'] == 'KEEP_SEPARATE']

            out_of_stock_pairs = df_result[
                (df_result['Stock_Status_1'] == 'OUT_OF_STOCK') |
                (df_result['Stock_Status_2'] == 'OUT_OF_STOCK')
            ]

            summary = {
                "total_pairs": len(df_result),
                "action_breakdown": action_counts,
                "urgent_substitute_needed": len(out_of_stock_pairs),
                "merge_candidates": len(merge_pairs),
                "review_required": len(review_pairs),
                "keep_separate": len(keep_pairs),
                "avg_similarity": round(df_result['Similarity_Score'].mean(), 1)
            }
        else:
            summary = {
                "total_pairs": 0,
                "action_breakdown": {},
                "urgent_substitute_needed": 0,
                "merge_candidates": 0,
                "review_required": 0,
                "keep_separate": 0,
                "avg_similarity": 0
            }

        # Create lightweight version for list
        if not df_result.empty:
            heavy_cols = ['Attr_Comparison', 'Mismatch_Fields', 'Full_Desc_1', 'Full_Desc_2', 'Specs_1', 'Specs_2']
            df_light = df_result.drop(columns=[c for c in heavy_cols if c in df_result.columns])
            df_light = df_light.replace({np.nan: None})
            list_data = df_light.to_dict(orient="records")
        else:
            list_data = []

        return {
            "status": "success",
            "summary": summary,
            "threshold_used": threshold,
            "data": list_data
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

@app.get("/api/ai/duplicates/detail/{sku1}/{sku2}")
def get_duplicate_pair_detail(sku1: str, sku2: str, threshold: float = 0.40):
    try:
        if detector is None:
            return {"error": "DuplicateDetector tidak tersedia."}
        df_sku, _, _ = get_data()
        df_result = detector.detect_duplicate_sku(df_sku, threshold)
        
        if df_result.empty:
            raise HTTPException(status_code=404, detail="Pair not found")
            
        pair = df_result[(df_result['SKU_1'] == sku1) & (df_result['SKU_2'] == sku2)]
        if pair.empty:
            pair = df_result[(df_result['SKU_1'] == sku2) & (df_result['SKU_2'] == sku1)]
            
        if pair.empty:
            raise HTTPException(status_code=404, detail="Pair not found")
            
        pair_dict = pair.iloc[0].to_dict()
        pair_dict = {k: (None if pd.isna(v) else v) for k, v in pair_dict.items()}
        
        return {
            "status": "success",
            "data": pair_dict
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}


@app.get("/api/ai/substitutes/{sku_id}")
def get_substitutes(sku_id: str, threshold: float = 0.40):
    """
    Cari pengganti untuk 1 SKU spesifik.
    Dipakai ketika staff ingin tahu 'apa yang bisa dipakai sebagai pengganti
    item X yang kosong?'
    """
    try:
        if detector is None:
            return {"error": "DuplicateDetector tidak tersedia. Pastikan sentence_transformers terinstall."}
        if not sku_id or not sku_id.strip():
            raise HTTPException(status_code=400, detail="sku_id tidak boleh kosong.")
        if threshold < 0 or threshold > 1:
            raise HTTPException(status_code=400, detail="threshold harus antara 0 dan 1.")

        df_sku, _, _ = get_data()
        result = detector.find_substitutes(df_sku, sku_id, threshold)
        
        def sanitize_dict(d):
            if isinstance(d, dict):
                return {k: sanitize_dict(v) for k, v in d.items()}
            elif isinstance(d, list):
                return [sanitize_dict(v) for v in d]
            elif pd.isna(d):
                return None
            return d
            
        result = sanitize_dict(result)
        return {"status": "success", **result}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}


@app.get("/api/ai/forecast/{sku_id}")
def get_forecast(sku_id: str, days: int = Query(default=30, ge=7, le=365)):
    try:
        if forecaster is None:
            return {"error": "StockForecaster tidak tersedia. Pastikan prophet terinstall."}
        if not sku_id or not sku_id.strip():
            raise HTTPException(status_code=400, detail="sku_id tidak boleh kosong.")
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
def get_tools_list_endpoint():
    try:
        data = get_tools_list()
        return {"status": "success", "data": data}
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}


@app.post("/api/ai/sync-cache")
def sync_ai_cache():
    try:
        if minmax_engine is None:
            return {"status": "error", "message": "MinMaxOptimizer tidak tersedia. Pastikan semua dependency terinstall."}
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


# ============================================================
# MODELS
# ============================================================

class DuplicateDecisionRequest(BaseModel):
    sku1: str
    sku2: str
    action: str  # MERGE | IGNORE | SUBSTITUTE
    similarity_score: float = 0.0
    notes: str = ""


# ============================================================
# DUPLICATE DECISIONS ENDPOINT
# ============================================================

@app.post("/api/ai/duplicate-decisions")
def record_duplicate_decision(body: DuplicateDecisionRequest):
    """
    Menyimpan keputusan staff toolcrib terhadap sepasang SKU duplikat.
    Staff bisa pilih: MERGE (gabungkan), IGNORE (simpan terpisah),
    atau SUBSTITUTE (pakai satu sebagai pengganti yang lain).
    """
    try:
        from data_provider import supabase

        valid_actions = {'MERGE', 'IGNORE', 'SUBSTITUTE'}
        if body.action not in valid_actions:
            raise HTTPException(
                status_code=400,
                detail=f"action harus salah satu dari: {valid_actions}"
            )

        payload = {
            'sku_pair': {'sku1': body.sku1, 'sku2': body.sku2},
            'action': body.action,
            'similarity_score': float(body.similarity_score),
            'notes': body.notes if body.notes else None,
        }

        result = supabase.table('duplicate_decisions').insert(payload).execute()

        if result.data:
            return {
                "status": "success",
                "message": f"Keputusan '{body.action}' untuk {body.sku1} vs {body.sku2} berhasil disimpan.",
                "id": result.data[0].get('id')
            }
        else:
            return {"status": "error", "message": "Gagal menyimpan keputusan."}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}


@app.get("/api/ai/duplicate-decisions")
def get_duplicate_decisions(action: str = None, limit: int = 50):
    """
    Mengambil riwayat keputusan staff untuk audit log.
    Opsional filter: action (MERGE, IGNORE, SUBSTITUTE)
    """
    try:
        from data_provider import supabase
        
        query = supabase.table('duplicate_decisions').select('*')
        
        if action:
            query = query.eq('action', action)
            
        result = query.order('created_at', desc=True).limit(limit).execute()
        
        return {
            "status": "success",
            "count": len(result.data),
            "data": result.data
        }
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("predictive_ai:app", host="0.0.0.0", port=8000, reload=True)
