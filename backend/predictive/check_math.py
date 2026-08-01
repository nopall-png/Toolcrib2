import pandas as pd
import numpy as np
from data_provider import get_transactions, get_item_by_code

try:
    target_sku = "BRG-CUT-047"
    print(f"\n=== MENGAMBIL DATA UNTUK {target_sku} ===")
    
    # Ambil data tool
    tool_data = get_item_by_code(target_sku)
    if not tool_data:
        print(f"Barang {target_sku} tidak ditemukan di tabel tools.")
        exit()
        
    lead_time = tool_data.get('lead_time_days') or 7
    criticality = str(tool_data.get('criticality_level', 'MEDIUM')).upper()
    if criticality == 'HIGH': safety_factor = 2.0
    elif criticality == 'LOW': safety_factor = 1.2
    else: safety_factor = 1.5

    print(f"Detail Barang:")
    print(f" - Nama: {tool_data.get('name')}")
    print(f" - Lead Time: {lead_time} hari")
    print(f" - Criticality: {criticality} (Safety Factor: {safety_factor})")

    # Ambil transaksi
    df = get_transactions()
    df = df[df['SKU_ID'] == target_sku]
    
    if df.empty:
        print(f"Belum ada transaksi pengeluaran (OUT) untuk {target_sku}.")
        exit()
        
    print("\n--- RIWAYAT TRANSAKSI (SQL Result) ---")
    df['Date'] = pd.to_datetime(df['Date'])
    total_qty = df['Quantity_Issued'].sum()
    
    for idx, row in df.iterrows():
        print(f"Tanggal: {row['Date'].strftime('%Y-%m-%d')} | Jumlah Keluar: {row['Quantity_Issued']}")

    # Math
    min_date = df['Date'].min()
    max_date = df['Date'].max()
    actual_days = (max_date - min_date).days + 1
    
    # Sesuai logika baru AI kita: clip ke 90 hari
    clipped_days = max(90, actual_days)
    
    daily_demand = total_qty / clipped_days
    
    dynamic_min = np.ceil(daily_demand * lead_time * safety_factor)
    dynamic_max = dynamic_min + np.ceil(daily_demand * 30)

    print("\n=== PEMBUKTIAN MATEMATIKA AI ===")
    print(f"1. Total Barang Keluar = {total_qty}")
    print(f"2. Rentang Hari Asli = {actual_days} hari ({min_date.strftime('%Y-%m-%d')} s/d {max_date.strftime('%Y-%m-%d')})")
    print(f"3. Rentang Hari AI (Dibatasi min 90) = {clipped_days} hari")
    print(f"4. Kecepatan Harian (Daily Demand) = {total_qty} / {clipped_days} = {daily_demand:.2f} barang/hari")
    print(f"5. AI Min (ROP) = {daily_demand:.2f} * {lead_time} (Lead Time) * {safety_factor} (Safety) = {dynamic_min}")
    print(f"6. AI Max = {dynamic_min} + ({daily_demand:.2f} * 30 hari) = {dynamic_max}")
    print("==========================================\n")

except Exception as e:
    import traceback
    traceback.print_exc()
