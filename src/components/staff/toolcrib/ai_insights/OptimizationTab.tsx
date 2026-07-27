'use client';

import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { INITIAL_TOOLS } from '@/src/lib/mock';

export const OptimizationTab = () => {
  const [filterAction, setFilterAction] = useState('ALL');

  const optimizations = [
    { sku: INITIAL_TOOLS[4].code, desc: INITIAL_TOOLS[4].name, action: 'OVERSTOCK', excessQty: 15, excessVal: 15 * (INITIAL_TOOLS[4].unitPrice || 50000), shortageQty: 0, shortageVal: 0 },
    { sku: INITIAL_TOOLS[2].code, desc: INITIAL_TOOLS[2].name, action: 'UNDERSTOCK', excessQty: 0, excessVal: 0, shortageQty: 5, shortageVal: 5 * (INITIAL_TOOLS[2].unitPrice || 750000) },
    { sku: INITIAL_TOOLS[6].code, desc: INITIAL_TOOLS[6].name, action: 'SLOW_MOVING', excessQty: 2, excessVal: 2 * (INITIAL_TOOLS[6].unitPrice || 45000), shortageQty: 0, shortageVal: 0 },
  ];

  const filteredOpts = optimizations.filter((item) => {
    if (filterAction === 'ALL') return true;
    return item.action === filterAction;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h3 className="font-bold text-slate-800 text-2xl">Peluang Optimasi Inventaris</h3>
          <p className="text-base text-slate-500 mt-2">Rekomendasi tindakan untuk barang Overstock, Understock, dan Slow-Moving (C-Z class).</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl">
          <Filter className="w-6 h-6 text-slate-400" />
          <select 
            value={filterAction} 
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-transparent text-lg font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Action</option>
            <option value="OVERSTOCK">OVERSTOCK</option>
            <option value="UNDERSTOCK">UNDERSTOCK</option>
            <option value="SLOW_MOVING">SLOW MOVING</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto border border-slate-200 rounded-xl mt-6">
        <table className="w-full text-left text-xl whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-lg border-b border-slate-200">
            <tr>
              <th className="p-6">SKU</th>
              <th className="p-6">Deskripsi</th>
              <th className="p-6">Action</th>
              <th className="p-6 text-right">Excess Qty</th>
              <th className="p-6 text-right">Nilai Kelebihan (Rp)</th>
              <th className="p-6 text-right">Shortage Qty</th>
              <th className="p-6 text-right">Nilai Kekurangan (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOpts.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-6 font-bold text-slate-700">{item.sku}</td>
                <td className="p-6 text-slate-600">{item.desc}</td>
                <td className="p-6">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                    item.action === 'OVERSTOCK' ? 'bg-amber-100 text-amber-700' :
                    item.action === 'UNDERSTOCK' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {item.action}
                  </span>
                </td>
                <td className="p-6 text-right text-amber-600 font-bold">{item.excessQty > 0 ? item.excessQty : '-'}</td>
                <td className="p-6 text-right text-amber-600">
                  {item.excessVal > 0 ? item.excessVal.toLocaleString('id-ID') : '-'}
                </td>
                <td className="p-6 text-right text-red-600 font-bold">{item.shortageQty > 0 ? item.shortageQty : '-'}</td>
                <td className="p-6 text-right text-red-600">
                  {item.shortageVal > 0 ? item.shortageVal.toLocaleString('id-ID') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
