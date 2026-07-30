import pandas as pd
import numpy as np
from prophet import Prophet
import warnings

warnings.filterwarnings('ignore')

class StockForecaster:
    def forecast_demand(self, df_trx: pd.DataFrame, forecast_days: int = 30) -> pd.DataFrame:
        """
        Memprediksi kebutuhan stok di masa depan menggunakan Prophet.
        """
        if df_trx.empty:
            return pd.DataFrame()

        df_target = df_trx.copy()
        df_target['Date'] = pd.to_datetime(df_target['Date']).dt.tz_localize(None).dt.normalize()
        
        df_daily = df_target.groupby('Date')['Quantity_Issued'].sum().reset_index()
        df_daily.columns = ['ds', 'y']
        df_daily['ds'] = pd.to_datetime(df_daily['ds'])

        if len(df_daily) < 2:
            return pd.DataFrame()

        min_date = df_daily['ds'].min()
        max_date = df_daily['ds'].max()
        all_dates = pd.date_range(start=min_date, end=max_date, freq='D')
        df_daily = df_daily.set_index('ds').reindex(all_dates, fill_value=0).reset_index()
        df_daily.columns = ['ds', 'y']

        try:
            model = Prophet(daily_seasonality=True, yearly_seasonality=False, weekly_seasonality=True)
            model.fit(df_daily)

            future = model.make_future_dataframe(periods=forecast_days)
            forecast = model.predict(future)

            forecast['yhat'] = forecast['yhat'].clip(lower=0).round(1)
            forecast['yhat_lower'] = forecast['yhat_lower'].clip(lower=0).round(1)
            forecast['yhat_upper'] = forecast['yhat_upper'].clip(lower=0).round(1)

            forecast_merged = pd.merge(forecast, df_daily, on='ds', how='left')
            forecast_merged.rename(columns={'y': 'actual'}, inplace=True)
            
            forecast_merged['ds'] = forecast_merged['ds'].dt.strftime('%Y-%m-%d')
            forecast_merged = forecast_merged.replace({np.nan: None})

            final_df = forecast_merged.tail(forecast_days + 30).copy()

            final_df = final_df.rename(columns={
                'ds': 'Date',
                'yhat': 'Expected_Demand',
                'yhat_lower': 'Lower_Bound',
                'yhat_upper': 'Upper_Bound'
            })

            def generate_insight(row):
                if row['Expected_Demand'] > 5:
                    return pd.Series(['WARNING', 'Potensi lonjakan permintaan. Siapkan stok ekstra agar operasional tidak terganggu.'])
                elif row['Expected_Demand'] < 1:
                    return pd.Series(['LOW', 'Permintaan diprediksi sangat rendah. Tahan pembelian baru.'])
                else:
                    return pd.Series(['NORMAL', 'Tingkat permintaan diprediksi stabil. Pertahankan stok saat ini.'])

            final_df[['Trend_Status', 'Insight']] = final_df.apply(generate_insight, axis=1)

            return final_df[['Date', 'Expected_Demand', 'Lower_Bound', 'Upper_Bound', 'Trend_Status', 'Insight']]
        except Exception as e:
            print(f"[ERROR] Prophet forecast failed: {e}")
            raise e

    def forecast_stock(self, df_trx: pd.DataFrame, target_sku: str, days_ahead: int = 30) -> pd.DataFrame:
        df_target = df_trx[df_trx['SKU_ID'] == target_sku].copy()
        return self.forecast_demand(df_target, forecast_days=days_ahead)
