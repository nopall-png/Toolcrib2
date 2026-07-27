import pandas as pd
import numpy as np
from minmax_optimizer import MinMaxOptimizer

class InventoryOptimizer:
    def __init__(self):
        self.minmax_engine = MinMaxOptimizer()

    def generate_optimization_opportunities(self, df_sku: pd.DataFrame, df_trx: pd.DataFrame) -> pd.DataFrame:
        """
        Mengidentifikasi peluang pengurangan inventaris dan optimasi pembelian:
        - OVERSTOCK: Stok saat ini > Dynamic Max → Harus dikurangi
        - UNDERSTOCK: Stok saat ini < Dynamic Min ROP → Harus segera dipesan
        - SLOW-MOVING: Kelas C + Z → Pertimbangkan dihapus
        """
        abc_result = self.minmax_engine.calculate_abc_xyz_and_minmax(df_sku, df_trx)

        df_opt = pd.merge(
            abc_result,
            df_sku[['SKU_ID', 'Current_Stock']],
            on='SKU_ID',
            how='left'
        )
        df_opt['Current_Stock'] = df_opt['Current_Stock'].fillna(0)

        def determine_action(row):
            if row['Current_Stock'] > row['Dynamic_Max']:
                return 'OVERSTOCK'
            elif row['Current_Stock'] <= row['Dynamic_Min_ROP']:
                return 'UNDERSTOCK'
            elif row['ABC_Class'] == 'C' and row['XYZ_Class'] == 'Z':
                return 'SLOW_MOVING'
            else:
                return 'OPTIMAL'
            
        df_opt['Action'] = df_opt.apply(determine_action, axis=1)

        df_opt['Excess_Qty'] = np.maximum(0, df_opt['Current_Stock'] - df_opt['Dynamic_Max'])
        df_opt['Excess_Value'] = df_opt['Excess_Qty'] * df_opt['Unit_Price']
        df_opt['Shortage_Qty'] = np.maximum(0, df_opt['Dynamic_Min_ROP'] - df_opt['Current_Stock'])
        df_opt['Shortage_Value'] = df_opt['Shortage_Qty'] * df_opt['Unit_Price']

        df_opt = df_opt.sort_values('Excess_Value', ascending=False).reset_index(drop=True)

        return df_opt[['SKU_ID', 'Description', 'ABC_Class', 'XYZ_Class', 'Current_Stock',
                        'Dynamic_Min_ROP', 'Dynamic_Max', 'Unit_Price', 'Action',
                        'Excess_Qty', 'Excess_Value', 'Shortage_Qty', 'Shortage_Value']]
