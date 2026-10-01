import pandas as pd

class CriticalityClassifier:
    def classify_critical_spares(self, df_sku: pd.DataFrame, df_trx: pd.DataFrame, df_machines: pd.DataFrame) -> pd.DataFrame:
        usage_df = df_trx.groupby('SKU_ID')['Quantity_Issued'].sum().reset_index()
        usage_df.columns = ['SKU_ID', 'Total_Usage']
        max_usage = usage_df['Total_Usage'].max() if not usage_df.empty else 1
        if max_usage == 0: max_usage = 1
        usage_df['Usage_Score'] = (usage_df['Total_Usage'] / max_usage * 100).round(1)

        df_result = pd.merge(df_sku[['SKU_ID', 'Description', 'Image_URL', 'Unit_Price', 'Lead_Time_Days', 'Machine_Score']], usage_df, on='SKU_ID', how='left')
        df_result['Total_Usage'] = df_result['Total_Usage'].fillna(0)
        df_result['Usage_Score'] = df_result['Usage_Score'].fillna(0)
        df_result['Machine_Score'] = df_result['Machine_Score'].fillna(50)

        max_lt = df_result['Lead_Time_Days'].max() if not df_result['Lead_Time_Days'].empty and df_result['Lead_Time_Days'].max() > 0 else 1
        df_result['Lead_Time_Score'] = (df_result['Lead_Time_Days'] / max_lt * 100).round(1)

        df_result['Composite_Score'] = (
            df_result['Usage_Score'] * 0.35 +
            df_result['Lead_Time_Score'] * 0.25 +
            df_result['Machine_Score'] * 0.40
        ).round(1)

        df_result['Criticality_Class'] = df_result['Composite_Score'].apply(
            lambda s: 'CRITICAL' if s >= 70 else ('IMPORTANT' if s >= 40 else 'STANDARD')
        )

        df_result = df_result.sort_values('Composite_Score', ascending=False).reset_index(drop=True)

        return df_result[['SKU_ID', 'Description', 'Image_URL', 'Unit_Price', 'Lead_Time_Days', 'Total_Usage',
                          'Usage_Score', 'Lead_Time_Score', 'Machine_Score', 'Composite_Score', 'Criticality_Class']]
