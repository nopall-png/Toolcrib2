'use client';

import React, { useState, useEffect } from 'react';
import { LineChart as LineChartIcon, Search, Calendar, Info, Loader2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { fetchForecast, fetchTools } from '@/src/lib/api-ai';

interface ForecastItem {
  Date: string;
  Expected_Demand: number;
  Lower_Bound: number;
  Upper_Bound: number;
  Trend_Status: string;
  Insight: string;
}

export const StockForecastTab = () => {
  const [filterSku, setFilterSku] = useState('');
  const [tools, setTools] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load tools list from backend (FastAPI) for dropdown
  useEffect(() => {
    const loadTools = async () => {
      const res = await fetchTools();
      if (res.status === 'success' && res.data && res.data.length > 0) {
        setTools(res.data);
        setFilterSku(res.data[0].code);
      }
    };
    loadTools();
  }, []);

  // Load forecast when filterSku changes
  useEffect(() => {
    if (!filterSku) return;

    const loadForecast = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);
        const res = await fetchForecast(filterSku, 30); // Prediksi 30 hari sesuai spek
        if (res.status === 'success') {
          const mappedData = res.data.map((item: ForecastItem) => ({
            date: item.Date,
            expected: item.Expected_Demand,
            minRange: item.Lower_Bound,
            maxRange: item.Upper_Bound,
            status: item.Trend_Status,
            insight: item.Insight
          }));
          setForecast(mappedData);
        } else {
          setErrorMsg(res.message || "Gagal memuat data prediksi.");
        }
      } catch (error) {
        console.error("Gagal memuat data prediksi", error);
        setErrorMsg("Gagal terhubung ke AI Engine. Pastikan server backend berjalan.");
      } finally {
        setIsLoading(false);
      }
    };
    loadForecast();
  }, [filterSku]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm text-xs">
          <p className="font-bold text-slate-700 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-slate-600">{entry.name}:</span>
              <span className="font-bold text-slate-800">{(entry.value ?? 0).toFixed(1)} unit</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-lg">Prediksi Kebutuhan Stok (AI Prophet)</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">AI menganalisis pola historis pemakaian barang untuk memprediksi kebutuhan masa depan.</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <Search className="w-4 h-4 text-slate-400" />
          <select 
            value={filterSku} 
            onChange={(e) => setFilterSku(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer max-w-[250px] truncate"
            disabled={tools.length === 0}
          >
            {tools.map((tool) => (
              <option key={tool.code} value={tool.code}>{tool.code} ({tool.name})</option>
            ))}
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 border border-indigo-100 bg-white shadow-xs rounded-xl mb-4">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
          <p className="font-semibold text-slate-600">AI sedang memproses model *Time-Series* (Prophet)...</p>
        </div>
      ) : (
        <>
          <div className="p-4 border border-indigo-100 bg-white shadow-xs rounded-xl mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <LineChartIcon className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-slate-800 text-sm">Grafik Prediksi Pemakaian: {filterSku}</span>
              </div>
              <div className="flex items-center space-x-4 text-[10px] font-bold text-slate-500">
                <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-indigo-600 rounded-sm"></div><span>Angka Prediksi</span></div>
                <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-slate-200 rounded-sm"></div><span>Batas Atas/Bawah (Toleransi AI)</span></div>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="maxRange" stroke="none" fill="#e2e8f0" fillOpacity={0.5} name="Batas Lonjakan Maksimal" />
                  <Area type="monotone" dataKey="minRange" stroke="none" fill="#ffffff" fillOpacity={1} name="Batas Kebutuhan Minimal" />
                  <Area type="monotone" dataKey="expected" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorExpected)" name="Prediksi Kebutuhan" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="p-4">Tanggal (Estimasi)</th>
                  <th className="p-4">
                    <div className="flex items-center space-x-1" title="Angka tengah prediksi AI">
                      <span>Kebutuhan Terprediksi</span>
                      <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                    </div>
                  </th>
                  <th className="p-4 text-slate-500">Rentang Kemungkinan</th>
                  <th className="p-4">Analisis & Saran AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {errorMsg ? (
                  <tr><td colSpan={4} className="p-8 text-center text-red-500 font-bold">{errorMsg}</td></tr>
                ) : forecast.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500">Data prediksi tidak tersedia</td></tr>
                ) : forecast.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-700">{item.date}</td>
                    <td className="p-4">
                      <span className="text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-lg">
                        {(item.expected ?? 0).toFixed(1)} unit
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-medium">
                      {(item.minRange ?? 0).toFixed(1)} - {(item.maxRange ?? 0).toFixed(1)} unit
                    </td>
                    <td className="p-4 whitespace-normal min-w-[300px]">
                      <div className="flex items-start space-x-2">
                        <span className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                          item.status === 'WARNING' ? 'bg-amber-500' : 
                          item.status === 'LOW' ? 'bg-slate-300' : 'bg-emerald-500'
                        }`} />
                        <span className="text-xs text-slate-600 leading-relaxed">{item.insight}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
