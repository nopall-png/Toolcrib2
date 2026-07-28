'use client';

import React, { useState } from 'react';
import { Filter, TrendingUp, AlertTriangle, ArrowDownCircle, CheckCircle2, Zap } from 'lucide-react';
import { INITIAL_TOOLS } from '@/src/lib/mock';

export const OptimizationTab = () => {
  const [filterAction, setFilterAction] = useState('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [optimizations, setOptimizations] = useState([
    {
      sku: INITIAL_TOOLS[4].code, desc: INITIAL_TOOLS[4].name, img: INITIAL_TOOLS[4].imageUrl,
      action: 'OVERSTOCK', impactVal: 15 * (INITIAL_TOOLS[4].unitPrice || 50000),
      recommendation: 'Kembalikan 15 unit ke Supplier atau gunakan untuk proyek internal lain.',
      isExecuted: false
    },
    {
      sku: INITIAL_TOOLS[2].code, desc: INITIAL_TOOLS[2].name, img: INITIAL_TOOLS[2].imageUrl,
      action: 'UNDERSTOCK', impactVal: 5 * (INITIAL_TOOLS[2].unitPrice || 750000),
      recommendation: 'Segera pesan 5 unit untuk mencegah potensi berhentinya proyek.',
      isExecuted: false
    },
    {
      sku: INITIAL_TOOLS[6].code, desc: INITIAL_TOOLS[6].name, img: INITIAL_TOOLS[6].imageUrl,
      action: 'SLOW_MOVING', impactVal: 2 * (INITIAL_TOOLS[6].unitPrice || 45000),
      recommendation: 'Barang tidak bergerak selama > 6 bulan. Lakukan audit fisik dan pertimbangkan penghapusan katalog.',
      isExecuted: false
    },
  ]);

  const filteredOpts = optimizations.filter((item) => {
    if (filterAction === 'ALL') return true;
    return item.action === filterAction;
  });

  const handleExecute = (idx: number) => {
    const newOpts = [...optimizations];
    newOpts[idx].isExecuted = true;
    setOptimizations(newOpts);

    setToastMsg(`Tindakan optimasi untuk ${newOpts[idx].sku} sedang diproses oleh sistem.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Notifikasi */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center space-x-2 text-sm font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-lg">Peluang Optimasi Inventaris</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">Rekomendasi tindakan otomatis dari AI untuk menghemat anggaran dan mencegah kerugian.</p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl">
          <Filter className="w-6 h-6 text-slate-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-transparent text-lg font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Peluang</option>
            <option value="OVERSTOCK">📦 Kelebihan (OVERSTOCK)</option>
            <option value="UNDERSTOCK">📉 Kekurangan (UNDERSTOCK)</option>
            <option value="SLOW_MOVING">🐢 Lambat (SLOW MOVING)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl mt-6">
        <table className="w-full text-left text-xl whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-lg border-b border-slate-200">
            <tr>
              <th className="p-4">Barang (SKU)</th>
              <th className="p-4">Status & Dampak Finansial</th>
              <th className="p-4">Saran Tindakan AI</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOpts.map((item, idx) => (
              <tr key={idx} className={`transition-colors ${item.isExecuted ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'}`}>
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <img src={item.img} alt={item.desc} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-700 block">{item.sku}</span>
                      <span className="text-slate-500 text-xs">{item.desc}</span>
                    </div>
                  </div>
                </td>

                <td className="p-4">
                  <div className="flex flex-col space-y-1">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold w-max border ${item.action === 'OVERSTOCK' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        item.action === 'UNDERSTOCK' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                      {item.action === 'OVERSTOCK' && '📦 OVERSTOCK (Uang Tertahan)'}
                      {item.action === 'UNDERSTOCK' && '📉 UNDERSTOCK (Potensi Kerugian)'}
                      {item.action === 'SLOW_MOVING' && '🐢 SLOW MOVING (Barang Mati)'}
                    </span>
                    <span className="text-sm font-bold text-slate-700 flex items-center space-x-1 mt-1">
                      <span className="text-xs text-slate-500 font-normal">Nilai:</span>
                      <span>Rp {item.impactVal.toLocaleString('id-ID')}</span>
                    </span>
                  </div>
                </td>

                <td className="p-4 whitespace-normal min-w-[250px]">
                  <p className="text-xs text-slate-600 leading-relaxed bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                    <strong className="text-indigo-700">Rekomendasi:</strong> {item.recommendation}
                  </p>
                </td>

                <td className="p-4 text-center">
                  {item.isExecuted ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold text-xs bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Diproses</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleExecute(idx)}
                      className="inline-flex items-center space-x-1 text-xs text-white font-bold px-3 py-1.5 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Eksekusi</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
