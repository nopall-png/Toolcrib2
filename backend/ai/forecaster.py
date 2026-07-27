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

        df_daily = df_target.groupby('Date')['Quantity_Issued'].sum().reset_index()
        df_daily.columns = ['ds', 'y']
        df_daily['ds'] = pd.to_datetime(df_daily['ds'])

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

        return forecast_merged[['ds', 'yhat', 'yhat_lower', 'yhat_upper', 'actual']].tail(days_ahead + 30)
