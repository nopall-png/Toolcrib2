import pandas as pd
import os
from dotenv import load_dotenv
from supabase import create_client

# Memuat variabel lingkungan dari root proyek
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env.local'))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "Variabel NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY "
        "harus diset di file .env.local pada root proyek."
    )

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_all_rows(table_name, select_query="*"):
    """Helper untuk mengambil data lebih dari 1000 rows (mengatasi limit Supabase)."""
    all_data = []
    limit = 1000
    offset = 0
    while True:
        res = supabase.table(table_name).select(select_query).range(offset, offset + limit - 1).execute()
        data = res.data
        if not data:
            break
        all_data.extend(data)
        if len(data) < limit:
            break
        offset += limit
    return all_data


def get_all_items() -> pd.DataFrame:
    """
    Mengambil seluruh master data dari tools beserta machine_impact_score base-nya.
    Kolom di-rename sesuai mapping AI Engine: code -> SKU_ID, name -> Description, dll.
    """
    tools_data = fetch_all_rows("tools", "id, code, name, description, unit_price, lead_time_days, stock, min_stock, max_stock, unit, category, machine_impact_score, criticality_level, technical_specs, image_url")
    df_sku = pd.DataFrame(tools_data)
    
    if df_sku.empty:
        return pd.DataFrame()

    df_sku = df_sku.rename(columns={
        'code': 'SKU_ID',
        'name': 'Description',
        'unit_price': 'Unit_Price',
        'lead_time_days': 'Lead_Time_Days',
        'stock': 'Current_Stock',
        'min_stock': 'Min_Stock',
        'max_stock': 'Max_Stock',
        'machine_impact_score': 'Base_Machine_Impact_Score',
        'criticality_level': 'Criticality_Level',
        'technical_specs': 'Technical_Specs',
        'image_url': 'Image_URL'
    })
    
    df_sku['Unit_Price'] = pd.to_numeric(df_sku['Unit_Price'], errors='coerce').fillna(0)
    df_sku['Lead_Time_Days'] = pd.to_numeric(df_sku['Lead_Time_Days'], errors='coerce').fillna(7).astype(int)
    df_sku['Current_Stock'] = pd.to_numeric(df_sku['Current_Stock'], errors='coerce').fillna(0).astype(int)
    df_sku['Base_Machine_Impact_Score'] = pd.to_numeric(df_sku['Base_Machine_Impact_Score'], errors='coerce').fillna(50).astype(int)

    return df_sku


def get_item_by_code(code: str) -> dict:
    """Mengambil satu item spesifik berdasarkan sku_id (tools.code)."""
    res = supabase.table("tools").select("*").eq("code", code).limit(1).execute()
    return res.data[0] if res.data else None


def get_transactions(tool_code=None, start_date=None, end_date=None) -> pd.DataFrame:
    """
    Mengambil data riwayat pemakaian barang murni dari stock_transactions.
    Bisa difilter per tool_code maupun rentang tanggal tertentu.
    Menggunakan pagination untuk menghindari limit 1000 baris dari Supabase.
    """
    all_data = []
    limit = 1000
    offset = 0
    
    tool_id = None
    if tool_code:
        tool = get_item_by_code(tool_code)
        if tool:
            tool_id = tool['id']
        else:
            return pd.DataFrame(columns=['SKU_ID', 'Date', 'Quantity_Issued'])

    while True:
        query = supabase.table("stock_transactions").select(
            "id, transaction_type, quantity, transaction_date, tools!inner(code), user_requests!inner(status)"
        ).eq("transaction_type", "OUT").in_("user_requests.status", ["Approved", "Issued"])
        
        if tool_id:
            query = query.eq("tool_id", tool_id)
        if start_date:
            query = query.gte("transaction_date", start_date)
        if end_date:
            query = query.lte("transaction_date", end_date)
            
        res = query.range(offset, offset + limit - 1).execute()
        if not res.data:
            break
        all_data.extend(res.data)
        if len(res.data) < limit:
            break
        offset += limit
        
    data = all_data
    
    if not data:
        return pd.DataFrame(columns=['SKU_ID', 'Date', 'Quantity_Issued'])

    rows = []
    for row in data:
        code_val = row.get("tools", {}).get("code")
        if code_val:
            rows.append({
                'SKU_ID': code_val,
                'Date': row.get("transaction_date"),
                'Quantity_Issued': row.get("quantity", 0)
            })

    df_trx = pd.DataFrame(rows)
    if not df_trx.empty:
        df_trx['Date'] = pd.to_datetime(df_trx['Date'], errors='coerce')
        df_trx = df_trx.dropna(subset=['Date'])
        
    return df_trx


def get_machine_impact(tool_code: str) -> int:
    tool = get_item_by_code(tool_code)
    if not tool:
        return 0
        
    base_score = int(tool.get('machine_impact_score') or 50)
    
    res = supabase.table("machine_tools").select("impact_weight").eq("tool_id", tool['id']).execute()
    if res.data:
        max_rel_weight = max((r.get("impact_weight") or 0) for r in res.data)
        return max(base_score, max_rel_weight)
    
    return base_score


def get_daily_usage(tool_code: str) -> float:
    df_trx = get_transactions(tool_code=tool_code)
    if df_trx.empty:
        return 0.0
        
    total_qty = df_trx['Quantity_Issued'].sum()
    date_min = df_trx['Date'].min()
    date_max = df_trx['Date'].max()
    
    if pd.isna(date_min) or pd.isna(date_max) or date_min == date_max:
        return float(total_qty)
        
    days_diff = (date_max - date_min).days + 1
    adu = total_qty / days_diff
    return float(adu)


def update_ai_cache(payload: list) -> bool:
    try:
        for item in payload:
            supabase.table("tools").update({
                "ai_min_stock": item.get("ai_min_stock"),
                "ai_max_stock": item.get("ai_max_stock"),
                "abc_class": item.get("abc_class"),
                "xyz_class": item.get("xyz_class")
            }).eq("id", item.get("id")).execute()
        return True
    except Exception as e:
        print("Failed to update AI cache in Supabase:", e)
        return False


def get_data():
    df_sku = get_all_items()
    df_trx = get_transactions()
    
    if not df_sku.empty:
        tools_dict = {row['SKU_ID']: row['id'] for _, row in df_sku.iterrows() if 'id' in df_sku.columns}
        if 'id' not in df_sku.columns:
            tools_data = fetch_all_rows('tools', 'id, code')
            tools_dict = {t['code']: t['id'] for t in tools_data}
            
        mt_data = fetch_all_rows('machine_tools', 'tool_id, impact_weight')
        mt_scores = {}
        for r in mt_data:
            tid = r['tool_id']
            weight = r.get('impact_weight') or 50
            if tid not in mt_scores or weight > mt_scores[tid]:
                mt_scores[tid] = weight
                
        scores = []
        for _, row in df_sku.iterrows():
            code = row['SKU_ID']
            base_score = row.get('Base_Machine_Impact_Score', 50)
            tid = tools_dict.get(code)
            rel_score = mt_scores.get(tid, 0) if tid else 0
            final_score = max(base_score, rel_score)
            scores.append(final_score)
            
        df_sku['Machine_Score'] = scores

    df_machines = pd.DataFrame(columns=['Machine_ID', 'Machine_Name', 'Location', 'Downtime_Impact', 'Required_Parts'])
    
    return df_sku, df_machines, df_trx
