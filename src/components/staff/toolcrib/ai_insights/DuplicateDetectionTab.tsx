'use client';

import React, { useState, useEffect } from 'react';
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
  const [confirmAction, setConfirmAction] = useState<{idx: number, actionType: 'MERGE' | 'IGNORE'} | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDuplicates = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/ai/duplicates');
        if (!response.ok) throw new Error('Failed to fetch duplicates');
        const result = await response.json();
        
        if (isMounted && result.status === 'success') {
          // Transform API response to match UI state
          const formatted = result.data.map((item: any) => ({
            sku1: item.SKU_1,
            desc1: item.Desc_1,
            fullDesc1: item.Full_Desc_1 || '',
            cat1: item.Category_1 || '-',
            unit1: item.Unit_1 || '-',
            specs1: item.Specs_1 || '-',
            sku2: item.SKU_2,
            desc2: item.Desc_2,
            fullDesc2: item.Full_Desc_2 || '',
            cat2: item.Category_2 || '-',
            unit2: item.Unit_2 || '-',
            specs2: item.Specs_2 || '-',
            score: item.Similarity_Score,
            matchingTerms: item.Matching_Terms || [],
            attrComparison: item.Attr_Comparison || [],
            verdict: item.Verdict || '',
            status: 'PENDING'
          }));
          
          setDuplicates(formatted);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching duplicates:', error);
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDuplicates();

    return () => {
      isMounted = false;
    };
  }, []);

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
    setConfirmAction({ idx, actionType });
  };

  const executeAction = () => {
    if (!confirmAction) return;
    const { idx, actionType } = confirmAction;

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
    setConfirmAction(null);

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
                        {Number(item.score).toFixed(1)}%
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
                      <td colSpan={4} className="p-6 border-t border-indigo-100 whitespace-normal">
                        <div className="flex flex-col">
                          <div className="w-full space-y-3">
                            <h4 className="font-bold text-slate-800 flex items-center space-x-2">
                              <BrainCircuit className="w-4 h-4 text-indigo-600" />
                              <span>Analisis AI: Mengapa ini mirip?</span>
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-slate-600 text-xs leading-relaxed">
                              <li><strong>Kecocokan Semantik ({Number(item.score).toFixed(1)}%):</strong> AI membaca pola bahwa deskripsi kedua barang mengacu pada alat atau fungsi yang sama.</li>
                              
                              {/* Kesimpulan AI */}
                              {item.verdict && (
                                <li>
                                  <div className={`mt-1 p-2.5 rounded-lg border text-xs font-semibold ${
                                    item.score >= 80 ? 'bg-red-50 border-red-200 text-red-700' :
                                    item.score >= 50 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                    'bg-green-50 border-green-200 text-green-700'
                                  }`}>
                                    {item.score >= 80 ? '🔴' : item.score >= 50 ? '🟡' : '🟢'} {item.verdict}
                                  </div>
                                </li>
                              )}

                              {/* Tabel Perbandingan Atribut ✅/❌ */}
                              {item.attrComparison && item.attrComparison.length > 0 && (
                                <li>
                                  <strong>Perbandingan Atribut:</strong>
                                  <div className="mt-2 ml-4 border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-[11px] table-fixed">
                                      <thead className="bg-slate-100">
                                        <tr>
                                          <th className="p-2 text-left text-slate-600 font-bold">Atribut</th>
                                          <th className="p-2 text-left text-blue-600 font-bold">{item.sku1}</th>
                                          <th className="p-2 text-left text-amber-600 font-bold">{item.sku2}</th>
                                          <th className="p-2 text-center text-slate-600 font-bold">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {item.attrComparison.map((attr: any, ai: number) => (
                                          <tr key={ai} className={attr.match ? 'bg-emerald-50/40' : 'bg-red-50/40'}>
                                            <td className="p-2 font-semibold text-slate-700 w-1/4 break-words">{attr.field}</td>
                                            <td className="p-2 text-slate-600 break-words">{attr.val1}</td>
                                            <td className="p-2 text-slate-600 break-words">{attr.val2}</td>
                                            <td className="p-2 text-center text-base">{attr.match ? '✅' : '❌'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </li>
                              )}

                              {/* Perbandingan Deskripsi Side-by-Side */}
                              <li>
                                <strong>Perbandingan Deskripsi Lengkap:</strong>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 ml-4">
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1.5 min-w-0">
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider break-words">{item.sku1}</p>
                                    <p className="text-xs text-slate-700 font-semibold break-words">{item.desc1}</p>
                                    {item.fullDesc1 && <p className="text-[11px] text-slate-500 italic break-words">{item.fullDesc1}</p>}
                                  </div>
                                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1.5 min-w-0">
                                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider break-words">{item.sku2}</p>
                                    <p className="text-xs text-slate-700 font-semibold break-words">{item.desc2}</p>
                                    {item.fullDesc2 && <p className="text-[11px] text-slate-500 italic break-words">{item.fullDesc2}</p>}
                                  </div>
                                </div>
                              </li>

                              <li><strong>Saran Tindakan:</strong> Pastikan secara fisik di gudang. Jika terbukti sama, konfirmasi duplikat agar sistem dapat menyatukan stoknya.</li>
                            </ul>
                          </div>

                          {/* Action Toolbar di Bawah */}
                          <div className={`mt-6 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${
                            confirmAction && confirmAction.idx === idx ? 'bg-red-50/50 border-red-100 -mx-6 -mb-6 px-6 pb-6 pt-5' : 'border-indigo-100'
                          }`}>
                            {confirmAction && confirmAction.idx === idx ? (
                              <>
                                <p className="text-xs font-bold flex items-center gap-2 text-red-700">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span>
                                    Peringatan: Yakin ingin {confirmAction.actionType === 'MERGE' ? 'MENGGABUNGKAN' : 'MENGABAIKAN'} data ini?
                                  </span>
                                </p>
                                <div className="flex gap-3 w-full sm:w-auto">
                                  <button
                                    onClick={() => setConfirmAction(null)}
                                    className="flex-1 sm:flex-none px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold text-xs transition-colors shadow-sm"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    onClick={executeAction}
                                    className="flex-1 sm:flex-none px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-xl font-bold text-xs transition-colors shadow-sm"
                                  >
                                    Ya, Lanjutkan
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-slate-500 font-medium">
                                  Tindakan apa yang ingin Anda ambil untuk kedua barang ini?
                                </p>
                                <div className="flex gap-3 w-full sm:w-auto">
                                  <button
                                    onClick={() => handleAction(idx, 'IGNORE')}
                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold text-xs transition-colors shadow-sm"
                                  >
                                    Abaikan (Bukan Duplikat)
                                  </button>
                                  <button
                                    onClick={() => handleAction(idx, 'MERGE')}
                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-xs transition-colors shadow-sm"
                                  >
                                    Ya, Ini Duplikat
                                  </button>
                                </div>
                              </>
                            )}
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
