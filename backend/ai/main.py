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

app = FastAPI(title="ToolCrib Predictive AI API", description="API untuk model Machine Learning Toolcrib PTMI")

# Konfigurasi CORS agar Next.js di localhost:3000 bisa memanggil API
@app.on_event("startup")
async def startup_event():
    import asyncio
    async def periodic_sync():
        while True:
            # Tunggu 24 jam (86400 detik)
            await asyncio.sleep(86400)
            try:
                print("Mulai Auto-Sync AI Cache (Cron Job Backup)...")
                # Menggunakan requests untuk memanggil endpoint sync-cache ke diri sendiri
                import requests
                requests.post('http://127.0.0.1:8000/api/ai/sync-cache', timeout=60)
                print("Auto-Sync Selesai.")
            except Exception as e:
                print(f"Gagal Auto-Sync: {e}")
                
    asyncio.create_task(periodic_sync())

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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

@app.get("/api/ai/debug")
def debug_data():
    try:
        df_sku, df_machines, df_trx = get_data()
        df_result = minmax_engine.calculate_abc_xyz_and_minmax(df_sku, df_trx)
        
        # Join Current_Stock for frontend
        df_result = pd.merge(df_result, df_sku[['SKU_ID', 'Current_Stock']], on='SKU_ID', how='left')
        df_result['Current_Stock'] = df_result['Current_Stock'].fillna(0)

        def determine_status(row):
            if row['Current_Stock'] > row['Dynamic_Max']: return 'OVERSTOCK'
            if row['Current_Stock'] <= row['Dynamic_Min_ROP']: return 'UNDERSTOCK'
            return 'OPTIMAL'
            
        df_result['Status'] = df_result.apply(determine_status, axis=1)

        return {"status": "success", "data": df_result.to_dict(orient="records")}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

@app.get("/api/ai/schema")
def schema_data():
    from data_provider import supabase
    res = supabase.table('tools').select('*').limit(1).execute()
    return {"data": res.data}

@app.get("/api/ai/tools")
def get_tools_list():
    from data_provider import supabase
    res = supabase.table('tools').select('code, name').order('code').execute()
    return {"status": "success", "data": res.data}

@app.get("/api/ai/debug-enum")
def debug_enum():
    try:
        from data_provider import supabase
        from collections import Counter
        res = supabase.table('user_requests').select('status').execute()
        
        statuses = [r.get('status') for r in res.data] if res.data else []
        distribution = dict(Counter(statuses))
        
        return {"distribution": distribution, "total_rows": len(statuses)}
    except Exception as e:
        import traceback
        return {"error": str(e), "trace": traceback.format_exc()}

@app.get("/api/ai/pdf")
def pdf_data():
    try:
        import fitz
        import os
        doc = fitz.open(os.path.join(os.path.dirname(__file__), '..', '..', 'PT_Mattel_ToolCrib_Dataset.pdf'))
        text = doc[1].get_text()
        return {"text": " ".join(text.split())}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

@app.get("/api/ai/dashboard-summary")
def get_dashboard_summary():
    # Force uvicorn reload
    try:
        df_sku, df_machine, df_trx = get_data()
        if df_sku.empty:
            return {"health_score": 0, "class_a_count": 0, "critical_sku_count": 0, "optimization_value": 0}

        # Use the optimization engine to get accurate AI-driven metrics
        df_opt = inv_opt_engine.generate_optimization_opportunities(df_sku, df_trx)
        
        # 1. Critical SKU Count (Understock based on Dynamic ROP)
        critical_skus = df_opt[df_opt['Action'] == 'UNDERSTOCK']
        critical_sku_count = len(critical_skus)

        # 2. Inventory Health
        total_skus = len(df_opt)
        healthy_skus = total_skus - critical_sku_count
        health_score = int((healthy_skus / total_skus) * 100) if total_skus > 0 else 0

        # 3. Class A Count (Using ABC logic from the engine)
        class_a_count = len(df_opt[df_opt['ABC_Class'] == 'A'])

        # 4. Optimization Opportunity (Dead Stock Value)
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
    """Mengembalikan rekomendasi Dynamic Min-Max beserta ABC/XYZ Class"""
    df_sku, df_machines, df_trx = get_data()
    df_result = minmax_engine.calculate_abc_xyz_and_minmax(df_sku, df_trx)
    
    # Join Current_Stock for frontend
    df_result = pd.merge(df_result, df_sku[['SKU_ID', 'Current_Stock']], on='SKU_ID', how='left')
    df_result['Current_Stock'] = df_result['Current_Stock'].fillna(0)

    def determine_status(row):
        if row['Current_Stock'] > row['Dynamic_Max']: return 'OVERSTOCK'
        if row['Current_Stock'] <= row['Dynamic_Min_ROP']: return 'UNDERSTOCK'
        if row['ABC_Class'] == 'C' and row.get('XYZ_Class') == 'Z': return 'SLOW_MOVING'
        return 'OPTIMAL'
        
    df_result['Status'] = df_result.apply(determine_status, axis=1)

    return {"status": "success", "data": df_result.to_dict(orient="records")}

@app.post("/api/ai/sync-cache")
def sync_ai_cache():
    """Menghitung ulang metriks AI dan menyimpannya ke kolom caching di Supabase tabel tools"""
    try:
        from data_provider import update_ai_cache, get_item_by_code
        df_sku, _, df_trx = get_data()
        
        # Calculate AI Insights
        df_result = minmax_engine.calculate_abc_xyz_and_minmax(df_sku, df_trx)
        
        # Format payload for bulk upsert
        payload = []
        # df_result index is SKU_ID (code), but upsert needs the UUID 'id' of tools table.
        # However, df_sku contains 'id' because data_provider fetched it and renamed code to SKU_ID.
        # Wait, get_data renames id? Let's check df_sku.
        # If we merged df_result with df_sku on SKU_ID, we can get 'id'.
        df_merged = pd.merge(df_result, df_sku[['SKU_ID', 'id']], on='SKU_ID', how='inner')
        
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
            return {"status": "success", "message": f"Successfully updated cache for {len(payload)} tools."}
        else:
            return {"status": "error", "message": "Failed to update Supabase."}
            
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}


@app.get("/api/ai/inventory-optimization")
def get_inventory_optimization():
    """Mengembalikan daftar barang Overstock/Understock"""
    df_sku, _, df_trx = get_data()
    df_result = inv_opt_engine.generate_optimization_opportunities(df_sku, df_trx)
    result = df_result.to_dict(orient="records")
    return {"status": "success", "data": result}

@app.get("/api/ai/critical-spares")
def get_critical_spares():
    """Mengklasifikasikan barang (CRITICAL, IMPORTANT, STANDARD)"""
    try:
        df_sku, df_machines, df_trx = get_data()
        df_result = crit_classifier.classify_critical_spares(df_sku, df_trx, df_machines)
        
        # Tambahkan informasi Stok dan Min_ROP untuk UI
        df_minmax = minmax_engine.calculate_abc_xyz_and_minmax(df_sku, df_trx)
        df_result = pd.merge(df_result, df_sku[['SKU_ID', 'Current_Stock']], on='SKU_ID', how='left')
        df_result = pd.merge(df_result, df_minmax[['SKU_ID', 'Dynamic_Min_ROP']], on='SKU_ID', how='left')
        
        # Tangani NaN agar tidak membuat FastAPI crash saat serialisasi JSON
        df_result['Current_Stock'] = df_result['Current_Stock'].fillna(0)
        df_result['Dynamic_Min_ROP'] = df_result['Dynamic_Min_ROP'].fillna(1)
        
        result = df_result.to_dict(orient="records")
        return {"status": "success", "data": result}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

@app.get("/api/ai/duplicates")
def get_duplicate_skus(threshold: float = 0.60):
    """Mendeteksi kemungkinan data SKU ganda menggunakan NLP"""
    try:
        df_sku, _, _ = get_data()
        df_result = detector.detect_duplicate_sku(df_sku, threshold)
        result = df_result.to_dict(orient="records")
        return {"status": "success", "data": result}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

@app.get("/api/ai/forecast/{sku_id}")
def get_stock_forecast(sku_id: str, days: int = 7):
    """Memprediksi stok masa depan menggunakan Prophet"""
    try:
        _, _, df_trx = get_data()
        df_result = forecaster.forecast_stock(df_trx, sku_id, days_ahead=days)
        if df_result.empty:
            raise HTTPException(status_code=404, detail="SKU tidak ditemukan atau tidak ada histori transaksi")
        result = df_result.to_dict(orient="records")
        return {"status": "success", "data": result}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

@app.get("/api/ai/debug-sku/{sku_code}")
def debug_sku(sku_code: str):
    from data_provider import get_data
    from forecaster import StockForecaster
    try:
        _, _, df_trx = get_data()
        df_target = df_trx[df_trx['SKU_ID'] == sku_code].copy()
        
        target_len = len(df_target)
        if target_len > 0:
            df_target['Date'] = pd.to_datetime(df_target['Date']).dt.tz_localize(None).dt.normalize()
            df_daily = df_target.groupby('Date')['Quantity_Issued'].sum().reset_index()
            daily_len = len(df_daily)
        else:
            daily_len = 0
            
        return {
            "sku": sku_code,
            "total_trx_count": len(df_trx),
            "target_trx_count": target_len,
            "target_daily_count": daily_len
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/ai/debug-run-sql")
def debug_run_sql():
    from backfill_machine_tools import run_backfill
    import sys
    import io
    
    # Capture print output
    old_stdout = sys.stdout
    sys.stdout = mystdout = io.StringIO()
    
    try:
        run_backfill()
        sys.stdout = old_stdout
        return {"status": "success", "log": mystdout.getvalue()}
    except Exception as e:
        sys.stdout = old_stdout
        import traceback
        return {"status": "error", "message": str(e), "trace": traceback.format_exc()}

@app.get("/api/ai/debug-dups")
def debug_dups():
    from data_provider import get_data
    df_sku, _, _ = get_data()
    
    sku1 = df_sku[df_sku['SKU_ID'] == 'BRG-ELC-010'].to_dict(orient='records')[0] if len(df_sku[df_sku['SKU_ID'] == 'BRG-ELC-010']) > 0 else {}
    sku2 = df_sku[df_sku['SKU_ID'] == 'BRG-ELC-026'].to_dict(orient='records')[0] if len(df_sku[df_sku['SKU_ID'] == 'BRG-ELC-026']) > 0 else {}
    
    # Cross category
    cat1 = df_sku[df_sku['category'] == 'PNE'].to_dict(orient='records')[0] if len(df_sku[df_sku['category'] == 'PNE']) > 0 else {}
    cat2 = df_sku[df_sku['category'] == 'ELC'].to_dict(orient='records')[0] if len(df_sku[df_sku['category'] == 'ELC']) > 0 else {}
    
    import json
    def parse_specs(specs):
        if isinstance(specs, str):
            try: return json.loads(specs)
            except: return specs
        return specs
        
    return {
        "010_specs": parse_specs(sku1.get('Technical_Specs', {})),
        "026_specs": parse_specs(sku2.get('Technical_Specs', {})),
        "010_desc": sku1.get('description'),
        "026_desc": sku2.get('description'),
        "cross_category_1": f"{cat1.get('SKU_ID')} - {cat1.get('Description')}",
        "cross_category_2": f"{cat2.get('SKU_ID')} - {cat2.get('Description')}"
    }

@app.get("/api/ai/debug-schema")
def debug_schema():
    from data_provider import supabase
    
    # 1. Count stock_transactions
    res_st = supabase.table("stock_transactions").select("id", count="exact").execute()
    st_count = res_st.count
    
    # 2. Count machine_tools
    res_mt = supabase.table("machine_tools").select("id", count="exact").execute()
    mt_count = res_mt.count
    
    # 3. Min/Max transaction_date (we can fetch all dates and calculate min/max, limit to 1 since we just need agg, wait supabase JS doesn't support min/max, let's just sort)
    res_min = supabase.table("stock_transactions").select("transaction_date").order("transaction_date", desc=False).limit(1).execute()
    res_max = supabase.table("stock_transactions").select("transaction_date").order("transaction_date", desc=True).limit(1).execute()
    
    min_date = res_min.data[0]['transaction_date'] if res_min.data else None
    max_date = res_max.data[0]['transaction_date'] if res_max.data else None
    
    return {
        "stock_transactions_count": st_count,
        "machine_tools_count": mt_count,
        "transaction_date_min": min_date,
        "transaction_date_max": max_date
    }

@app.get("/api/ai/debug-insert-dummy")
def debug_insert_dummy():
    import os
    from supabase import create_client
    
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    admin_supabase = create_client(url, key)
    
    import uuid
    dummy_id = str(uuid.uuid4())
    dummy_tool = {
        "id": dummy_id,
        "code": "BRG-TEST-999",
        "name": "Barang Uji Coba Tanpa Histori",
        "category": "TEST",
        "description": "Barang uji coba",
        "unit": "Pcs",
        "unit_price": 500000,
        "lead_time_days": 14,
        "stock": 0,
        "min_stock": 5,
        "max_stock": 10,
        "machine_impact_score": 80,
        "criticality_level": "HIGH"
    }
    admin_supabase.table("tools").insert(dummy_tool).execute()
    return {"status": "success", "inserted": "BRG-TEST-999"}

@app.get("/api/ai/debug-columns")
def debug_columns():
    from data_provider import supabase
    res = supabase.table("tools").select("*").limit(1).execute()
    if res.data:
        return {"columns": list(res.data[0].keys())}
    return {"columns": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
