import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def get_mock_data():
    """
    Menghasilkan data dummy untuk keperluan simulasi API AI.
    Data ini meniru skema database PostgreSQL Toolcrib.
    """
    # 1. Data Master SKU
    sku_data = [
        {'SKU_ID': 'SKU001', 'Description': 'Palu Besi 5kg', 'Unit_Price': 50000, 'Lead_Time_Days': 3, 'Current_Stock': 50, 'Criticality_Level': 'LOW'},
        {'SKU_ID': 'SKU002', 'Description': 'Palu Besi Berat 5 kg', 'Unit_Price': 51000, 'Lead_Time_Days': 3, 'Current_Stock': 10, 'Criticality_Level': 'LOW'}, # Duplikat SKU001
        {'SKU_ID': 'SKU003', 'Description': 'Motor Servo Yaskawa 2kW', 'Unit_Price': 15000000, 'Lead_Time_Days': 45, 'Current_Stock': 1, 'Criticality_Level': 'HIGH'},
        {'SKU_ID': 'SKU004', 'Description': 'Baut M10x50mm', 'Unit_Price': 1000, 'Lead_Time_Days': 7, 'Current_Stock': 2000, 'Criticality_Level': 'MEDIUM'},
        {'SKU_ID': 'SKU005', 'Description': 'Obeng Plus Phillips', 'Unit_Price': 15000, 'Lead_Time_Days': 2, 'Current_Stock': 150, 'Criticality_Level': 'LOW'},
    ]
    df_sku = pd.DataFrame(sku_data)
    
    # 2. Data Mesin
    machine_data = [
        {'Machine_ID': 'MAC-INJ-01', 'Required_Parts': 'SKU003', 'Downtime_Impact': 'HIGH'},
        {'Machine_ID': 'MAC-ASM-01', 'Required_Parts': 'SKU001, SKU004, SKU005', 'Downtime_Impact': 'LOW'},
    ]
    df_machines = pd.DataFrame(machine_data)
    
    # 3. Data Transaksi Harian (1 Tahun Terakhir)
    np.random.seed(42)
    dates = pd.date_range(end=datetime.today(), periods=365).tolist()
    
    trx_list = []
    for d in dates:
        # SKU001: Dipakai rutin (1-2 per minggu)
        if np.random.rand() > 0.8:
            trx_list.append({'SKU_ID': 'SKU001', 'Date': d, 'Quantity_Issued': np.random.randint(1, 3)})
            
        # SKU003: Jarang dipakai
        if np.random.rand() > 0.98:
            trx_list.append({'SKU_ID': 'SKU003', 'Date': d, 'Quantity_Issued': 1})
            
        # SKU004: Fast moving, stabil
        if np.random.rand() > 0.3:
            trx_list.append({'SKU_ID': 'SKU004', 'Date': d, 'Quantity_Issued': np.random.randint(5, 50)})
            
        # SKU005: Sangat sering
        if np.random.rand() > 0.5:
            trx_list.append({'SKU_ID': 'SKU005', 'Date': d, 'Quantity_Issued': np.random.randint(2, 10)})
            
    df_trx = pd.DataFrame(trx_list)
    df_trx['Date'] = pd.to_datetime(df_trx['Date'])
    
    return df_sku, df_machines, df_trx
