'use client';

import React from 'react';
import { RefreshCcw } from 'lucide-react';
import { INITIAL_TOOLS } from '@/src/lib/mock';

export const DynamicMinMaxTab = () => {
  const minmaxData = [
    { sku: INITIAL_TOOLS[6].code, desc: INITIAL_TOOLS[6].name, current: INITIAL_TOOLS[6].stock, min: Math.floor(INITIAL_TOOLS[6].minStock * 1.2), max: Math.floor(INITIAL_TOOLS[6].maxStock * 0.85) },
    { sku: INITIAL_TOOLS[1].code, desc: INITIAL_TOOLS[1].name, current: INITIAL_TOOLS[1].stock, min: Math.floor(INITIAL_TOOLS[1].minStock * 1.2), max: Math.floor(INITIAL_TOOLS[1].maxStock * 0.85) },
    { sku: INITIAL_TOOLS[7].code, desc: INITIAL_TOOLS[7].name, current: INITIAL_TOOLS[7].stock, min: Math.floor(INITIAL_TOOLS[7].minStock * 1.2), max: Math.floor(INITIAL_TOOLS[7].maxStock * 0.85) },
  ];

  const getStatus = (current: number, min: number, max: number) => {
    if (current < min) return <span className="bg-red-50 text-red-700 px-2 py-1 rounded-md text-xs font-bold">UNDERSTOCK</span>;
    if (current > max) return <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">OVERSTOCK</span>;
    return <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">OPTIMAL</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Dynamic Min-Max Engine</h3>
          <p className="text-xs text-slate-500 mt-1">Rekomendasi batas Min (Reorder Point) dan Max yang menyesuaikan pola pergerakan barang.</p>
        </div>
        <button className="flex items-center space-x-2 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold transition-all">
          <RefreshCcw className="w-4 h-4" />
          <span>Hitung Ulang AI</span>
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200">
            <tr>
              <th className="p-4">SKU</th>
              <th className="p-4">Deskripsi</th>
              <th className="p-4 text-right">Current Stock</th>
              <th className="p-4 text-right">AI Min (ROP)</th>
              <th className="p-4 text-right">AI Max</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {minmaxData.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-700">{item.sku}</td>
                <td className="p-4 text-slate-600">{item.desc}</td>
                <td className="p-4 text-right font-bold text-slate-700">{item.current}</td>
                <td className="p-4 text-right font-bold text-red-600">{item.min}</td>
                <td className="p-4 text-right font-bold text-emerald-600">{item.max}</td>
                <td className="p-4 text-center">{getStatus(item.current, item.min, item.max)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
