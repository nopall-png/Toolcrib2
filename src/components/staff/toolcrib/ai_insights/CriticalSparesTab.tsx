'use client';

import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { INITIAL_TOOLS } from '@/src/lib/mock';

export const CriticalSparesTab = () => {
  const [filterClass, setFilterClass] = useState('ALL');

  const criticalSpares = [
    { sku: INITIAL_TOOLS[7].code, desc: INITIAL_TOOLS[7].name, price: INITIAL_TOOLS[7].unitPrice || 15000000, lt: INITIAL_TOOLS[7].leadTimeDays || 45, usage: 80, machine: 100, score: 85.5, class: 'CRITICAL' },
    { sku: INITIAL_TOOLS[5].code, desc: INITIAL_TOOLS[5].name, price: INITIAL_TOOLS[5].unitPrice || 2500000, lt: INITIAL_TOOLS[5].leadTimeDays || 14, usage: 95, machine: 50, score: 68.2, class: 'IMPORTANT' },
    { sku: INITIAL_TOOLS[3].code, desc: INITIAL_TOOLS[3].name, price: INITIAL_TOOLS[3].unitPrice || 150000, lt: INITIAL_TOOLS[3].leadTimeDays || 3, usage: 100, machine: 20, score: 35.1, class: 'STANDARD' },
  ];

  const filteredSpares = criticalSpares.filter((item) => {
    if (filterClass === 'ALL') return true;
    return item.class === filterClass;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Klasifikasi Kekritisan Suku Cadang</h3>
          <p className="text-xs text-slate-500 mt-1">Menghitung skor kekritisan (Usage 35%, Lead Time 25%, Machine Impact 40%).</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={filterClass} 
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Class</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="IMPORTANT">IMPORTANT</option>
            <option value="STANDARD">STANDARD</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200">
            <tr>
              <th className="p-4">SKU</th>
              <th className="p-4">Deskripsi</th>
              <th className="p-4 text-center">Usage Score</th>
              <th className="p-4 text-center">LT Score</th>
              <th className="p-4 text-center">Machine Score</th>
              <th className="p-4 text-center">Total Score</th>
              <th className="p-4">Class</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSpares.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-700">{item.sku}</td>
                <td className="p-4 text-slate-600">{item.desc}</td>
                <td className="p-4 text-center text-slate-600">{item.usage}</td>
                <td className="p-4 text-center text-slate-600">{item.lt}</td>
                <td className="p-4 text-center text-slate-600">{item.machine}</td>
                <td className="p-4 text-center font-bold">{item.score}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                    item.class === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    item.class === 'IMPORTANT' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {item.class}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
