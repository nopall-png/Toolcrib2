'use client';

import React, { useState } from 'react';
import { LineChart as LineChartIcon, Search } from 'lucide-react';
import { INITIAL_TOOLS } from '@/src/lib/mock';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const StockForecastTab = () => {
  const [filterSku, setFilterSku] = useState(INITIAL_TOOLS[0].code);

  const forecast = [
    { date: '2026-08-01', yhat: 12.5, lower: 10.1, upper: 15.2 },
    { date: '2026-08-02', yhat: 13.1, lower: 11.0, upper: 15.5 },
    { date: '2026-08-03', yhat: 14.8, lower: 12.5, upper: 17.2 },
    { date: '2026-08-04', yhat: 9.5, lower: 7.1, upper: 11.8 },
    { date: '2026-08-05', yhat: 15.2, lower: 13.0, upper: 18.1 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h3 className="font-bold text-slate-800 text-2xl">Prediksi Permintaan Masa Depan (Prophet)</h3>
          <p className="text-base text-slate-500 mt-2">Menganalisis tren masa lalu untuk memprediksi kebutuhan stok 30 hari ke depan.</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl">
          <Search className="w-6 h-6 text-slate-400" />
          <select 
            value={filterSku} 
            onChange={(e) => setFilterSku(e.target.value)}
            className="bg-transparent text-lg font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            {INITIAL_TOOLS.map((tool) => (
              <option key={tool.id} value={tool.code}>{tool.code} ({tool.name})</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="p-6 border border-indigo-100 bg-white shadow-xs rounded-xl mt-6 mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <LineChartIcon className="w-8 h-8 text-indigo-600" />
          <span className="font-bold text-slate-800 text-xl">Grafik Prediksi 5 Hari Ke Depan: {filterSku}</span>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorYhat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{fontSize: 14, fill: '#64748b'}} tickLine={false} axisLine={false} />
              <YAxis tick={{fontSize: 14, fill: '#64748b'}} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', fontSize: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="upper" stroke="none" fill="#e2e8f0" fillOpacity={0.5} name="Batas Atas" />
              <Area type="monotone" dataKey="lower" stroke="none" fill="#ffffff" fillOpacity={1} name="Batas Bawah" />
              <Area type="monotone" dataKey="yhat" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorYhat)" name="Prediksi (yhat)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xl whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-lg border-b border-slate-200">
            <tr>
              <th className="p-6">Tanggal (Future)</th>
              <th className="p-6">Prediksi Permintaan (yhat)</th>
              <th className="p-6">Batas Bawah (yhat_lower)</th>
              <th className="p-6">Batas Atas (yhat_upper)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {forecast.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-6 font-bold text-slate-700">{item.date}</td>
                <td className="p-6 text-indigo-700 font-bold">{item.yhat.toFixed(1)} unit</td>
                <td className="p-6 text-slate-500">{item.lower.toFixed(1)}</td>
                <td className="p-6 text-slate-500">{item.upper.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
