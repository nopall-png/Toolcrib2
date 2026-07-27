'use client';

import React, { useState } from 'react';
import { LineChart as LineChartIcon, Search, Calendar, Info } from 'lucide-react';
import { INITIAL_TOOLS } from '@/src/lib/mock';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const StockForecastTab = () => {
  const [filterSku, setFilterSku] = useState(INITIAL_TOOLS[0].code);

  const forecast = [
    { date: '2026-08-01', expected: 12.5, minRange: 10.1, maxRange: 15.2, status: 'NORMAL', insight: 'Permintaan stabil sesuai rata-rata.' },
    { date: '2026-08-02', expected: 13.1, minRange: 11.0, maxRange: 15.5, status: 'NORMAL', insight: 'Sedikit kenaikan, stok saat ini masih memadai.' },
    { date: '2026-08-03', expected: 14.8, minRange: 12.5, maxRange: 17.2, status: 'WARNING', insight: 'Diprediksi ada jadwal servis mesin, siapkan stok ekstra.' },
    { date: '2026-08-04', expected: 9.5, minRange: 7.1, maxRange: 11.8, status: 'LOW', insight: 'Permintaan menurun (akhir minggu/shift sepi).' },
    { date: '2026-08-05', expected: 15.2, minRange: 13.0, maxRange: 18.1, status: 'WARNING', insight: 'Lonjakan permintaan diprediksi terjadi. Pastikan stok > 18 unit.' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-lg">Prediksi Kebutuhan Stok (AI Prophet)</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">AI menganalisis pola historis pemakaian barang untuk memprediksi kebutuhan 5 hari ke depan.</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <Search className="w-4 h-4 text-slate-400" />
          <select 
            value={filterSku} 
            onChange={(e) => setFilterSku(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            {INITIAL_TOOLS.map((tool) => (
              <option key={tool.id} value={tool.code}>{tool.code} ({tool.name})</option>
            ))}
          </select>
        </div>
      </div>
      
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
              <Tooltip 
                contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
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
            {forecast.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-700">{item.date}</td>
                <td className="p-4">
                  <span className="text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-lg">
                    {item.expected.toFixed(1)} unit
                  </span>
                </td>
                <td className="p-4 text-xs text-slate-500 font-medium">
                  {item.minRange.toFixed(1)} - {item.maxRange.toFixed(1)} unit
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
    </div>
  );
};
