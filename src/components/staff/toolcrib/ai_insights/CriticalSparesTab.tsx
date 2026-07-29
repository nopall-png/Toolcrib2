'use client';

import React, { useState } from 'react';
import { Filter, AlertOctagon, TrendingDown, CheckCircle2, ShoppingCart, BrainCircuit, Activity, Replace } from 'lucide-react';
import { INITIAL_TOOLS } from '@/src/lib/mock';

const INITIAL_SPARES = [
  {
    sku: INITIAL_TOOLS[7].code, desc: INITIAL_TOOLS[7].name, img: INITIAL_TOOLS[7].imageUrl,
    currentStock: 2, minStock: 5,
    riskFactor: 'Dampak Mesin Sangat Tinggi & Lead Time Lama (45 Hari)',
    class: 'CRITICAL', status: 'DANGER', isOrdered: false,
    aiScores: { usage: 80, lt: 45, machine: 100, total: 85.5 },
    alternativeItem: { sku: 'TL-DIE-08-ALT', desc: 'Precision Mold Pin (Brand B)', stock: 45, match: 94 }
  },
  {
    sku: INITIAL_TOOLS[5].code, desc: INITIAL_TOOLS[5].name, img: INITIAL_TOOLS[5].imageUrl,
    currentStock: 15, minStock: 10,
    riskFactor: 'Dampak Mesin Menengah',
    class: 'IMPORTANT', status: 'SAFE', isOrdered: false,
    aiScores: { usage: 95, lt: 14, machine: 50, total: 68.2 },
    alternativeItem: null
  },
  {
    sku: INITIAL_TOOLS[3].code, desc: INITIAL_TOOLS[3].name, img: INITIAL_TOOLS[3].imageUrl,
    currentStock: 50, minStock: 20,
    riskFactor: 'Barang Kebutuhan Umum (Mudah Didapat)',
    class: 'STANDARD', status: 'SAFE', isOrdered: false,
    aiScores: { usage: 100, lt: 3, machine: 20, total: 35.1 },
    alternativeItem: null
  },
];

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

    // Ubah status menjadi sudah diorder
    item.isOrdered = true;
    setSpares(newSpares);

    // Tampilkan notifikasi
    setToastMsg(`Purchase Order (PO) Darurat untuk ${item.sku} telah otomatis dikirim ke departemen Purchasing.`);

    // Hilangkan notifikasi setelah 4 detik
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

      {/* Notifikasi Sukses Pemesanan */}
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

        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl">
          <Filter className="w-6 h-6 text-slate-400" />
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-transparent text-lg font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Tingkat Kritis</option>
            <option value="CRITICAL">🔥 CRITICAL (Kritis)</option>
            <option value="IMPORTANT">⚠️ IMPORTANT (Penting)</option>
            <option value="STANDARD">✅ STANDARD (Biasa)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl mt-6">
        <table className="w-full text-left text-xl whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-lg border-b border-slate-200">
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
                    <div className="flex items-center space-x-2">
                      {item.status === 'DANGER' ? (
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
                      ) : null}
                      
                      <button 
                        onClick={() => setExpandedItem(expandedItem === idx ? null : idx)}
                        className={`text-xs font-bold hover:underline px-3 py-1.5 rounded-lg transition-colors ${
                          item.status === 'DANGER' 
                            ? 'text-slate-600 bg-slate-100 hover:bg-slate-200' 
                            : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                        }`}
                      >
                        {expandedItem === idx ? 'Tutup Detail' : 'Lihat Detail'}
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded Row Details */}
                {expandedItem === idx && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={5} className="p-6 border-t border-slate-100">
                      <div className="max-w-3xl whitespace-normal">
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

                        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                          * <strong>Insight:</strong> Skor total AI untuk barang ini adalah {item.aiScores.total}. 
                          {item.status === 'DANGER' ? (
                            <span> Karena sisa stok ({item.currentStock} unit) sudah berada di bawah batas minimum keamanan ({item.minStock} unit), status barang ini dinyatakan <strong className="text-red-600">KRITIS (DANGER)</strong>. Pemesanan darurat sangat diperlukan untuk menghindari mesin produksi mati.</span>
                          ) : (
                            <span> Karena sisa stok ({item.currentStock} unit) masih di atas batas minimum keamanan ({item.minStock} unit), status barang ini dinyatakan <strong className="text-emerald-600">Aman (SAFE)</strong>. Tidak diperlukan tindakan pemesanan darurat saat ini.</span>
                          )}
                        </p>
                        
                        {item.alternativeItem && (
                          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in slide-in-from-bottom-2">
                            <h5 className="font-bold text-emerald-800 flex items-center space-x-2 mb-2 text-sm">
                              <BrainCircuit className="w-4 h-4 text-emerald-600" />
                              <span>💡 Saran Substitusi AI (Pencegah PO Darurat)</span>
                            </h5>
                            <p className="text-xs text-emerald-700 mb-3">AI mendeteksi adanya barang kembar (Duplikat Semantik) dengan stok berlimpah di gudang yang bisa digunakan sementara untuk mencegah mesin mati tanpa harus membuat PO Darurat.</p>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 rounded-lg border border-emerald-100 shadow-sm gap-4">
                              <div>
                                <span className="font-bold text-slate-800 block">{item.alternativeItem.sku}</span>
                                <span className="text-slate-500 text-xs">{item.alternativeItem.desc}</span>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-center">
                                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Kecocokan AI</span>
                                  <span className="font-bold text-indigo-600 text-sm">{item.alternativeItem.match}%</span>
                                </div>
                                <div className="text-center">
                                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Stok Tersedia</span>
                                  <span className="font-bold text-emerald-600 text-sm">{item.alternativeItem.stock} Unit</span>
                                </div>
                                <button className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                                  Gunakan Alternatif
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
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
