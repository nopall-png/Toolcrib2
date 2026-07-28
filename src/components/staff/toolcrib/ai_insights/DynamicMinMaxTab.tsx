'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCcw, Loader2 } from 'lucide-react';
import { fetchMinMax } from '@/src/lib/api-ai';

interface MinMaxItem {
  SKU_ID: string;
  Description: string;
  ABC_Class: string;
  XYZ_Class: string;
  Current_Stock: number;
  Optimal_Max: number;
  Optimal_Min: number;
  Status: string;
}

export const DynamicMinMaxTab = () => {
  const [minmaxData, setMinmaxData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setErrorMsg(null);
      setIsLoading(true);
      const res = await fetchMinMax();
      if (res.status === 'success') {
        const mappedData = res.data.map((item: any) => ({
          sku: item.SKU_ID,
          desc: item.Description,
          current: item.Current_Stock,
          min: item.Dynamic_Min_ROP,
          max: item.Dynamic_Max,
          status: item.Status
        }));
        setMinmaxData(mappedData);
      }
    } catch (error) {
      console.error("Gagal memuat data MinMax", error);
      setErrorMsg("Gagal terhubung ke AI Engine. Pastikan server backend berjalan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === 'UNDERSTOCK') return <span className="bg-red-50 text-red-700 px-2 py-1 rounded-md text-xs font-bold">UNDERSTOCK</span>;
    if (status === 'OVERSTOCK') return <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">OVERSTOCK</span>;
    return <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">OPTIMAL</span>;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
        <p className="font-semibold text-slate-600">AI sedang memproses batas Minimum & Maximum stok...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Dynamic Min-Max Engine</h3>
          <p className="text-xs text-slate-500 mt-1">Rekomendasi batas Min (Reorder Point) dan Max yang menyesuaikan pola pergerakan barang.</p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center space-x-2 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold transition-all"
        >
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
            {errorMsg ? (
              <tr><td colSpan={6} className="p-8 text-center text-red-500 font-semibold">{errorMsg}</td></tr>
            ) : minmaxData.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">Tidak ada data</td></tr>
            ) : minmaxData.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-700">{item.sku}</td>
                <td className="p-4 text-slate-600">{item.desc}</td>
                <td className="p-4 text-right font-bold text-slate-700">{item.current}</td>
                <td className="p-4 text-right font-bold text-red-600">{item.min}</td>
                <td className="p-4 text-right font-bold text-emerald-600">{item.max}</td>
                <td className="p-4 text-center">{getStatusBadge(item.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
