'use client';

import React, { useState } from 'react';
import { Filter, Info, AlertTriangle, BrainCircuit, CheckCircle2, CheckCircle, Search, Loader2 } from 'lucide-react';


type DuplicateStatus = 'PENDING' | 'MERGED';

interface DuplicateItemResponse {
  Item1_SKU: string;
  Item1_Desc: string;
  Item2_SKU: string;
  Item2_Desc: string;
  Similarity_Score: number;
}

export const DuplicateDetectionTab = () => {
  const [filterThreshold, setFilterThreshold] = useState(80);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const filteredDuplicates = duplicates.filter((item) => {
    const matchesScore = item.score >= filterThreshold;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = item.sku1.toLowerCase().includes(searchLower) || 
                          item.sku2.toLowerCase().includes(searchLower) ||
                          item.desc1.toLowerCase().includes(searchLower) ||
                          item.desc2.toLowerCase().includes(searchLower);
    return matchesScore && matchesSearch;
  });

  const handleAction = (idx: number, actionType: 'MERGE' | 'IGNORE') => {
    const newDuplicates = [...duplicates];
    const targetItem = newDuplicates[idx];

    if (actionType === 'MERGE') {
      targetItem.status = 'MERGED';
      setToastMsg(`Berhasil! Data ${targetItem.sku2} dikonfirmasi sebagai duplikat dari ${targetItem.sku1}.`);
    } else {
      newDuplicates.splice(idx, 1);
      setToastMsg(`Diabaikan. ${targetItem.sku1} dan ${targetItem.sku2} ditandai sebagai barang berbeda (Bukan Duplikat).`);
    }

    setDuplicates(newDuplicates);
    setExpandedItem(null);

    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
        <p className="font-semibold text-slate-600">AI sedang mencari kesamaan barang di seluruh gudang...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Notifikasi Sukses Simulasi */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center space-x-2 text-sm font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800 text-lg">Peringatan: Potensi Barang Ganda</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">AI menganalisis kemiripan nama, merek, dan spesifikasi barang untuk menemukan item yang mungkin dicatat dua kali di dalam sistem.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search Input */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl w-full sm:w-auto focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari SKU atau nama..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none w-full sm:w-48 placeholder:font-normal"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={filterThreshold} 
              onChange={(e) => setFilterThreshold(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value={0}>Semua Kecocokan (&gt;0%)</option>
              <option value={80}>Sangat Mirip (&gt;80%)</option>
              <option value={90}>Identik (&gt;90%)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl mt-6">
        <table className="w-full text-left text-xl whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-lg border-b border-slate-200">
            <tr>
              <th className="p-4">Item 1 (Terindikasi)</th>
              <th className="p-4">Item 2 (Mirip/Duplikat)</th>
              <th className="p-4">
                <div className="flex items-center space-x-1" title="Skor di atas 80% menandakan kedua barang ini kemungkinan besar adalah barang fisik yang sama.">
                  <span>Kemiripan</span>
                  <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                </div>
              </th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDuplicates.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">Tidak ada potensi barang ganda saat ini.</td>
              </tr>
            ) : (
              filteredDuplicates.map((item, idx) => (
                <React.Fragment key={idx}>
                  <tr className={`transition-colors ${item.status === 'MERGED' ? 'bg-emerald-50/30' : 'hover:bg-slate-50'}`}>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <span className="font-bold text-slate-700 block">{item.sku1}</span>
                          <span className="text-slate-500 text-xs truncate max-w-[200px] block">{item.desc1}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <span className="font-bold text-slate-700 block">{item.sku2}</span>
                          <span className="text-slate-500 text-xs truncate max-w-[200px] block">{item.desc2}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 ${Number(item.score) >= 90 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} rounded-full text-xs font-bold`} title="Skor di atas 80% menandakan kemungkinan barang ini adalah duplikat">
                        {item.score}%
                      </span>
                    </td>
                    <td className="p-4">
                      {item.status === 'MERGED' ? (
                        <span className="flex items-center space-x-1 text-emerald-600 font-bold text-xs bg-emerald-100 px-3 py-1.5 rounded-lg w-max">
                          <CheckCircle className="w-4 h-4" />
                          <span>Terkonfirmasi</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => setExpandedItem(expandedItem === idx ? null : idx)}
                          className="text-xs text-indigo-600 font-bold hover:underline px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          {expandedItem === idx ? "Tutup Detail" : "Tinjau & Gabungkan"}
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Details Row */}
                  {expandedItem === idx && item.status !== 'MERGED' && (
                    <tr className="bg-indigo-50/30">
                      <td colSpan={4} className="p-6 border-t border-indigo-100">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1 space-y-3">
                            <h4 className="font-bold text-slate-800 flex items-center space-x-2">
                              <BrainCircuit className="w-4 h-4 text-indigo-600" />
                              <span>Analisis AI: Mengapa ini mirip?</span>
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-slate-600 text-xs leading-relaxed">
                              <li><strong>Kecocokan Semantik ({item.score}%):</strong> AI membaca pola bahwa deskripsi kedua barang mengacu pada alat atau fungsi yang sama.</li>
                              <li><strong>Identifikasi Risiko:</strong> Barang ini berpotensi didaftarkan dua kali oleh staf yang berbeda (salah ketik saat input awal).</li>
                              <li><strong>Saran Tindakan:</strong> Pastikan secara fisik di gudang. Jika terbukti sama, konfirmasi duplikat agar sistem dapat menyatukan stoknya.</li>
                            </ul>
                          </div>

                          <div className="flex-1 flex flex-col justify-end space-y-3 border-t md:border-t-0 md:border-l border-indigo-100 pt-4 md:pt-0 md:pl-6">
                            <p className="text-xs text-slate-500">Pilih tindakan untuk data ganda ini:</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAction(idx, 'MERGE')}
                                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-xs transition-colors shadow-sm"
                              >
                                Ya, Ini Duplikat
                              </button>
                              <button
                                onClick={() => handleAction(idx, 'IGNORE')}
                                className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold text-xs transition-colors"
                              >
                                Abaikan (Bukan Duplikat)
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
