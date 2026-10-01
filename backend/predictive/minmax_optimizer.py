import pandas as pd
import numpy as np

class MinMaxOptimizer:
    def calculate_abc_xyz_and_minmax(self, df_sku: pd.DataFrame, df_trx: pd.DataFrame) -> pd.DataFrame:
        """
        Mengkategorikan barang (ABC/XYZ) dan menghitung Dynamic Min-Max.
        """
        # 1. Klasifikasi ABC
        usage_df = df_trx.groupby('SKU_ID')['Quantity_Issued'].sum().reset_index()
        usage_df.columns = ['SKU_ID', 'Total_Qty_Yearly']

        df_analysis = pd.merge(df_sku[['SKU_ID', 'Description', 'Unit_Price', 'Lead_Time_Days']], usage_df, on='SKU_ID', how='left')
        df_analysis['Total_Qty_Yearly'] = df_analysis['Total_Qty_Yearly'].fillna(0)
        df_analysis['Total_Value'] = df_analysis['Total_Qty_Yearly'] * df_analysis['Unit_Price']
        df_analysis = df_analysis.sort_values(by='Total_Value', ascending=False).reset_index(drop=True)

        df_analysis['Cum_Percent'] = df_analysis['Total_Value'].cumsum() / df_analysis['Total_Value'].sum()
        df_analysis['ABC_Class'] = df_analysis['Cum_Percent'].apply(
            lambda pct: 'A' if pct <= 0.80 else ('B' if pct <= 0.95 else 'C')
        )

        # 2. Klasifikasi XYZ
        df_trx['Date'] = pd.to_datetime(df_trx['Date'])
        monthly_demand = df_trx.groupby(['SKU_ID', df_trx['Date'].dt.to_period('M')])['Quantity_Issued'].sum().reset_index()

        stats_df = monthly_demand.groupby('SKU_ID')['Quantity_Issued'].agg(['mean', 'std', 'count']).reset_index().fillna(0)
        stats_df['CV'] = stats_df['std'] / stats_df['mean']
        
        def classify_xyz(row):
            if row['count'] < 3:
                return 'N/A'
            if row['CV'] <= 0.5: return 'X'
            if row['CV'] <= 1.0: return 'Y'
            return 'Z'
            
        stats_df['XYZ_Class'] = stats_df.apply(classify_xyz, axis=1)

        # 3. Dynamic Min-Max
        df_final = pd.merge(df_analysis, stats_df[['SKU_ID', 'XYZ_Class']], on='SKU_ID', how='left')
        df_final['XYZ_Class'] = df_final['XYZ_Class'].fillna('N/A')
        
        if 'Criticality_Level' in df_sku.columns:
            df_final = pd.merge(df_final, df_sku[['SKU_ID', 'Criticality_Level']], on='SKU_ID', how='left')
        else:
            df_final['Criticality_Level'] = 'MEDIUM'
            
        def get_safety_factor(crit):
            if pd.isna(crit): return 1.5
            crit_str = str(crit).upper()
            if crit_str == 'HIGH': return 2.0
            if crit_str == 'LOW': return 1.2
            return 1.5
            
        df_final['Safety_Factor'] = df_final['Criticality_Level'].apply(get_safety_factor)
        
        date_range = df_trx.groupby('SKU_ID')['Date'].agg(lambda x: (x.max() - x.min()).days + 1)
        date_range = date_range.rename('Actual_Days').reset_index()
        df_final = pd.merge(df_final, date_range, on='SKU_ID', how='left')
        df_final['Actual_Days'] = df_final['Actual_Days'].fillna(90)
        df_final['Daily_Demand'] = df_final['Total_Qty_Yearly'] / df_final['Actual_Days'].clip(lower=90)
        df_final['Dynamic_Min_ROP'] = np.ceil((df_final['Daily_Demand'] * df_final['Lead_Time_Days']) * df_final['Safety_Factor']).clip(lower=1)
        df_final['Dynamic_Max'] = (df_final['Dynamic_Min_ROP'] + np.ceil(df_final['Daily_Demand'] * 30)).clip(lower=2)

        return df_final[['SKU_ID', 'Description', 'ABC_Class', 'XYZ_Class', 'Dynamic_Min_ROP', 'Dynamic_Max', 'Unit_Price', 'Total_Qty_Yearly', 'Lead_Time_Days', 'Criticality_Level', 'Safety_Factor']]
