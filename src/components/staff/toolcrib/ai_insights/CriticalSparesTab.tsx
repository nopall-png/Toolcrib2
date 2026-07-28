'use client';

import React, { useState, useEffect } from 'react';
import { Filter, AlertOctagon, TrendingDown, CheckCircle2, ShoppingCart, BrainCircuit, Activity, Loader2 } from 'lucide-react';
import { fetchCriticalSpares } from '@/src/lib/api-ai';

// Interface sesuai dengan response dari backend FastAPI
interface CriticalSpareItem {
  SKU_ID: string;
  Description: string;
  Unit_Price: number;
  Lead_Time_Days: number;
  Total_Usage: number;
  Usage_Score: number;
  Lead_Time_Score: number;
  Machine_Score: number;
  Composite_Score: number;
  Criticality_Class: string;
  Current_Stock: number;
  Dynamic_Min_ROP: number;
}

export const CriticalSparesTab = () => {
  const [filterClass, setFilterClass] = useState('ALL');
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [spares, setSpares] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const res = await fetchCriticalSpares();
        if (res.status === 'success') {
          // Map backend data ke format yang dibutuhkan UI
          const mappedData = res.data.map((item: CriticalSpareItem) => {
            let riskFactor = '';
            if (item.Machine_Score >= 100) riskFactor += 'Dampak Mesin Sangat Tinggi. ';
            else if (item.Machine_Score >= 50) riskFactor += 'Dampak Mesin Menengah. ';

            if (item.Lead_Time_Score >= 80) riskFactor += `Lead Time Lama (${item.Lead_Time_Days} Hari). `;
            if (item.Usage_Score >= 80) riskFactor += 'Pemakaian Sangat Tinggi. ';

            if (!riskFactor) riskFactor = 'Barang Kebutuhan Umum (Mudah Didapat)';

            return {
              sku: item.SKU_ID,
              desc: item.Description,
              img: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=150&q=80', // Default image
              currentStock: item.Current_Stock || 0,
              minStock: item.Dynamic_Min_ROP || 0,
              riskFactor: riskFactor.trim(),
              class: item.Criticality_Class,
              status: item.Criticality_Class === 'CRITICAL' ? 'DANGER' : 'SAFE',
              isOrdered: false,
              aiScores: {
                usage: item.Usage_Score,
                lt: item.Lead_Time_Score,
                machine: item.Machine_Score,
                total: item.Composite_Score
              }
            };
          });
          setSpares(mappedData);
        }
      } catch (error) {
        console.error("Gagal memuat data", error);
        setErrorMsg("Gagal terhubung ke AI Engine. Pastikan server backend berjalan.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredSpares = spares.filter((item) => {
    if (filterClass === 'ALL') return true;
    return item.class === filterClass;
  });

  const handleEmergencyOrder = (idx: number) => {
    const newSpares = [...spares];
    const item = newSpares[idx];

    item.isOrdered = true;
    setSpares(newSpares);

    setToastMsg(`Purchase Order (PO) Darurat untuk ${item.sku} telah otomatis dikirim ke departemen Purchasing.`);
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
        <p className="font-semibold text-slate-600">AI sedang menganalisis risiko *downtime*...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center space-x-2 text-sm font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-slate-800 text-lg">Pemantauan Suku Cadang Kritis</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">AI memprioritaskan barang yang berisiko menghentikan produksi pabrik (*downtime*) jika kehabisan stok.</p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Tingkat Kritis</option>
            <option value="CRITICAL">🔥 CRITICAL (Kritis)</option>
            <option value="IMPORTANT">⚠️ IMPORTANT (Penting)</option>
            <option value="STANDARD">✅ STANDARD (Biasa)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200">
            <tr>
              <th className="p-4">Barang (SKU)</th>
              <th className="p-4">Tingkat Kekritisan</th>
              <th className="p-4">Alasan AI (Faktor Risiko)</th>
              <th className="p-4">Status Stok</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {errorMsg ? (
              <tr><td colSpan={5} className="p-8 text-center text-red-500 font-semibold">{errorMsg}</td></tr>
            ) : filteredSpares.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Tidak ada data ditemukan</td></tr>
            ) : filteredSpares.map((item, idx) => (
              <React.Fragment key={idx}>
                <tr className={`transition-colors ${item.isOrdered ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div>
                        <span className="font-bold text-slate-700 block">{item.sku}</span>
                        <span className="text-slate-500 text-xs truncate max-w-[200px] block">{item.desc}</span>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.class === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' :
                        item.class === 'IMPORTANT' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                      {item.class}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="text-xs text-slate-600">{item.riskFactor}</span>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold flex items-center space-x-1 ${item.currentStock <= item.minStock ? 'text-red-600' : 'text-emerald-600'}`}>
                        {item.currentStock <= item.minStock ? <TrendingDown className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>{item.currentStock} Unit</span>
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Min: {item.minStock}</span>
                    </div>
                  </td>

                  <td className="p-4">
                    {item.currentStock <= item.minStock ? (
                      item.isOrdered ? (
                        <span className="flex items-center space-x-1 text-slate-500 font-bold text-xs bg-slate-100 px-3 py-1.5 rounded-lg w-max border border-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PO Diproses</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEmergencyOrder(idx)}
                          className="flex items-center space-x-1 text-xs text-white font-bold px-3 py-1.5 bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm animate-pulse"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Order Darurat</span>
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => setExpandedItem(expandedItem === idx ? null : idx)}
                        className="text-xs text-indigo-600 font-bold hover:underline px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        {expandedItem === idx ? 'Tutup Detail' : 'Lihat Detail'}
                      </button>
                    )}
                  </td>
                </tr>

                {/* Expanded Row Details */}
                {expandedItem === idx && item.currentStock > item.minStock && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={5} className="p-6 border-t border-slate-100">
                      <div className="max-w-3xl">
                        <h4 className="font-bold text-slate-800 flex items-center space-x-2 mb-4">
                          <BrainCircuit className="w-4 h-4 text-indigo-600" />
                          <span>Rincian Kalkulasi Skor AI (Mesin Suku Cadang Kritis)</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Skor Penggunaan</p>
                            <div className="flex items-end space-x-2">
                              <span className="text-xl font-black text-slate-700">{item.aiScores.usage}</span>
                              <span className="text-xs text-slate-400 mb-1">/ 100</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Bobot: 35%</p>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Skor Lead Time</p>
                            <div className="flex items-end space-x-2">
                              <span className="text-xl font-black text-slate-700">{item.aiScores.lt}</span>
                              <span className="text-xs text-slate-400 mb-1">/ 100</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Bobot: 25%</p>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Skor Dampak Mesin</p>
                            <div className="flex items-end space-x-2">
                              <span className="text-xl font-black text-slate-700">{item.aiScores.machine}</span>
                              <span className="text-xs text-slate-400 mb-1">/ 100</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Bobot: 40%</p>
                          </div>

                          <div className={`p-3 rounded-xl border ${item.class === 'IMPORTANT' ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-200'}`}>
                            <div className="flex items-center space-x-1 mb-1">
                              <Activity className={`w-3.5 h-3.5 ${item.class === 'IMPORTANT' ? 'text-amber-600' : 'text-indigo-600'}`} />
                              <p className={`text-[10px] font-bold uppercase tracking-wider ${item.class === 'IMPORTANT' ? 'text-amber-700' : 'text-indigo-700'}`}>Total Skor AI</p>
                            </div>
                            <div className="flex items-end space-x-2">
                              <span className={`text-xl font-black ${item.class === 'IMPORTANT' ? 'text-amber-800' : 'text-indigo-800'}`}>{item.aiScores.total}</span>
                            </div>
                            <p className={`text-[10px] mt-1 font-bold ${item.class === 'IMPORTANT' ? 'text-amber-600' : 'text-indigo-600'}`}>=&gt; Kelas: {item.class}</p>
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
