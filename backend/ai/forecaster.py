import pandas as pd
import numpy as np
from prophet import Prophet
import warnings

warnings.filterwarnings('ignore')

class StockForecaster:
    def forecast_stock(self, df_trx: pd.DataFrame, target_sku: str, days_ahead: int = 30) -> pd.DataFrame:
        """
        Memprediksi kebutuhan stok di masa depan menggunakan Prophet.
        """
        df_target = df_trx[df_trx['SKU_ID'] == target_sku].copy()
        if df_target.empty:
            return pd.DataFrame()

        # Prophet tidak mendukung zona waktu, dan kita ingin mengelompokkan berdasarkan hari (tanggal)
        df_target['Date'] = pd.to_datetime(df_target['Date']).dt.tz_localize(None).dt.normalize()
        
        df_daily = df_target.groupby('Date')['Quantity_Issued'].sum().reset_index()
        df_daily.columns = ['ds', 'y']
        df_daily['ds'] = pd.to_datetime(df_daily['ds'])

        # Prophet membutuhkan setidaknya 2 baris data (2 tanggal berbeda)
        if len(df_daily) < 2:
            return pd.DataFrame()

        # Zero-fill / Resample Harian
        # Agar hari tanpa transaksi dianggap 0, bukan diabaikan
        min_date = df_daily['ds'].min()
        max_date = df_daily['ds'].max()
        all_dates = pd.date_range(start=min_date, end=max_date, freq='D')
        df_daily = df_daily.set_index('ds').reindex(all_dates, fill_value=0).reset_index()
        df_daily.columns = ['ds', 'y']

        try:
            model = Prophet(daily_seasonality=True, yearly_seasonality=False, weekly_seasonality=True)
            model.fit(df_daily)

            future = model.make_future_dataframe(periods=days_ahead)
            forecast = model.predict(future)

            forecast['yhat'] = forecast['yhat'].clip(lower=0)
            forecast['yhat_lower'] = forecast['yhat_lower'].clip(lower=0)
            forecast['yhat_upper'] = forecast['yhat_upper'].clip(lower=0)

            forecast_merged = pd.merge(forecast, df_daily, on='ds', how='left')
            forecast_merged.rename(columns={'y': 'actual'}, inplace=True)
            
            forecast_merged['ds'] = forecast_merged['ds'].dt.strftime('%Y-%m-%d')
            forecast_merged = forecast_merged.replace({np.nan: None})

            # Potong untuk 30 hari ke belakang + hari ke depan
            final_df = forecast_merged.tail(days_ahead + 30).copy()

            # Mapping kolom ke format yang diharapkan frontend (StockForecastTab.tsx)
            final_df = final_df.rename(columns={
                'ds': 'Date',
                'yhat': 'Expected_Demand',
                'yhat_lower': 'Lower_Bound',
                'yhat_upper': 'Upper_Bound'
            })

            # Tambahkan status & insight sederhana (karena sebelumnya menggunakan mock data)
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
            print(f"[ERROR] Prophet forecast failed for {target_sku}: {e}")
            raise e

