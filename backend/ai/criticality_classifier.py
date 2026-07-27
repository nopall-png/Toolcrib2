import pandas as pd

class CriticalityClassifier:
    def classify_critical_spares(self, df_sku: pd.DataFrame, df_trx: pd.DataFrame, df_machines: pd.DataFrame) -> pd.DataFrame:
        """
        Mengklasifikasikan suku cadang berdasarkan kekritisan:
        - Usage Score: Seberapa sering barang dipakai
        - Lead Time Score: Semakin lama lead time, semakin kritikal
        - Machine Score: Apakah barang dipakai oleh mesin kritikal (downtime_impact HIGH)
        """
        # 1. Usage Score (0-100)
        usage_df = df_trx.groupby('SKU_ID')['Quantity_Issued'].sum().reset_index()
        usage_df.columns = ['SKU_ID', 'Total_Usage']
        max_usage = usage_df['Total_Usage'].max() if not usage_df.empty else 1
        usage_df['Usage_Score'] = (usage_df['Total_Usage'] / max_usage * 100).round(1)

        # 2. Merge with SKU master data
        df_result = pd.merge(df_sku[['SKU_ID', 'Description', 'Unit_Price', 'Lead_Time_Days']], usage_df, on='SKU_ID', how='left')
        df_result['Total_Usage'] = df_result['Total_Usage'].fillna(0)
        df_result['Usage_Score'] = df_result['Usage_Score'].fillna(0)

        # 3. Lead Time Score (0-100)
        max_lt = df_result['Lead_Time_Days'].max() if df_result['Lead_Time_Days'].max() > 0 else 1
        df_result['Lead_Time_Score'] = (df_result['Lead_Time_Days'] / max_lt * 100).round(1)

        # 4. Machine Score (0-100)
        sku_machine_scores = {}
        impact_map = {'HIGH': 100, 'MEDIUM': 50, 'LOW': 20}
        
        for _, machine in df_machines.iterrows():
            parts_list = machine.get('Required_Parts', [])
            if isinstance(parts_list, str):
                parts_list = [p.strip() for p in parts_list.split(',')]
            impact = machine.get('Downtime_Impact', 'MEDIUM')
            score = impact_map.get(str(impact).upper(), 50)
            
            if isinstance(parts_list, list):
                for sku in parts_list:
                    sku_clean = str(sku).strip()
                    if sku_clean and sku_clean != 'None':
                        if sku_clean not in sku_machine_scores or score > sku_machine_scores[sku_clean]:
                            sku_machine_scores[sku_clean] = score

        df_result['Machine_Score'] = df_result['SKU_ID'].map(sku_machine_scores).fillna(0).astype(float)

        # 5. Composite Score
        df_result['Composite_Score'] = (
            df_result['Usage_Score'] * 0.35 +
            df_result['Lead_Time_Score'] * 0.25 +
            df_result['Machine_Score'] * 0.40
        ).round(1)

        # 6. Classification
        df_result['Criticality_Class'] = df_result['Composite_Score'].apply(
            lambda s: 'CRITICAL' if s >= 70 else ('IMPORTANT' if s >= 40 else 'STANDARD')
        )

        df_result = df_result.sort_values('Composite_Score', ascending=False).reset_index(drop=True)

        return df_result[['SKU_ID', 'Description', 'Unit_Price', 'Lead_Time_Days', 'Total_Usage',
                          'Usage_Score', 'Lead_Time_Score', 'Machine_Score', 'Composite_Score', 'Criticality_Class']]
