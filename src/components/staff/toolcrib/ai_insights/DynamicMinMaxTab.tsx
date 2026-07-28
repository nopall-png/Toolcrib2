'use client';

import React, { useState } from 'react';
import { RefreshCcw, BrainCircuit } from 'lucide-react';
import { INITIAL_TOOLS } from '@/src/lib/mock';

export const DynamicMinMaxTab = () => {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const minmaxData = [
    { sku: INITIAL_TOOLS[7].code, desc: INITIAL_TOOLS[7].name, current: 2, min: 10, max: 25, alternativeItem: { sku: 'TL-DIE-08-ALT', desc: 'Precision Mold Pin (Brand B)', stock: 50 } },
    { sku: INITIAL_TOOLS[1].code, desc: INITIAL_TOOLS[1].name, current: INITIAL_TOOLS[1].stock, min: Math.floor(INITIAL_TOOLS[1].minStock * 1.2), max: Math.floor(INITIAL_TOOLS[1].maxStock * 0.85) },
    { sku: INITIAL_TOOLS[6].code, desc: INITIAL_TOOLS[6].name, current: INITIAL_TOOLS[6].stock, min: Math.floor(INITIAL_TOOLS[6].minStock * 1.2), max: Math.floor(INITIAL_TOOLS[6].maxStock * 0.85) },
  ];

  const getStatus = (current: number, min: number, max: number, idx: number, hasAlternative?: boolean) => {
    if (current < min) {
      if (hasAlternative) {
        return (
          <button 
            onClick={() => setExpandedItem(expandedItem === idx ? null : idx)}
            className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors shadow-sm animate-pulse flex items-center space-x-1 mx-auto"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>UNDERSTOCK (Cek AI)</span>
          </button>
        );
      }
      return <span className="bg-red-50 text-red-700 px-2 py-1 rounded-md text-xs font-bold">UNDERSTOCK</span>;
    }
    if (current > max) return <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">OVERSTOCK</span>;
    return <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">OPTIMAL</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
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
              <React.Fragment key={idx}>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-700">{item.sku}</td>
                  <td className="p-4 text-slate-600">{item.desc}</td>
                  <td className="p-4 text-right font-bold text-slate-700">{item.current}</td>
                  <td className="p-4 text-right font-bold text-red-600">{item.min}</td>
                  <td className="p-4 text-right font-bold text-emerald-600">{item.max}</td>
                  <td className="p-4 text-center">{getStatus(item.current, item.min, item.max, idx, !!item.alternativeItem)}</td>
                </tr>

                {/* Expanded Row for AI Rebalancing Suggestion */}
                {expandedItem === idx && item.alternativeItem && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={6} className="p-6 border-t border-slate-100">
                      <div className="max-w-3xl whitespace-normal">
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in slide-in-from-bottom-2">
                          <h5 className="font-bold text-emerald-800 flex items-center space-x-2 mb-2 text-sm">
                            <BrainCircuit className="w-4 h-4 text-emerald-600" />
                            <span>💡 Saran AI: Inventory Rebalancing</span>
                          </h5>
                          <p className="text-xs text-emerald-700 mb-3">
                            Barang ini berstatus <strong className="text-red-600">UNDERSTOCK</strong>. Namun, daripada memesan barang baru, AI mendeteksi kamu punya <strong>barang kembarannya</strong> (Duplikat Semantik) yang sedang berstatus <strong className="text-amber-600">OVERSTOCK</strong> di gudang. Kamu bisa memindahkan/menggunakan stok tersebut untuk menghemat anggaran!
                          </p>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 rounded-lg border border-emerald-100 shadow-sm gap-4">
                            <div>
                              <span className="font-bold text-slate-800 block">{item.alternativeItem.sku}</span>
                              <span className="text-slate-500 text-xs">{item.alternativeItem.desc}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <span className="block text-[10px] text-slate-400 uppercase font-bold">Status Alternatif</span>
                                <span className="font-bold text-amber-600 text-sm">OVERSTOCK</span>
                              </div>
                              <div className="text-center">
                                <span className="block text-[10px] text-slate-400 uppercase font-bold">Stok Tersedia</span>
                                <span className="font-bold text-emerald-600 text-sm">{item.alternativeItem.stock} Unit</span>
                              </div>
                              <button className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                                Rebalance Stok
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
