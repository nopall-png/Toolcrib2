'use client';

import React, { useState } from 'react';
import { Info, Filter } from 'lucide-react';
import { INITIAL_TOOLS } from '@/src/lib/mock';

export const AbcXyzClassificationTab = () => {
  const [filterClass, setFilterClass] = useState('ALL');

  const abcXyzData = [
    { sku: INITIAL_TOOLS[6].code, desc: INITIAL_TOOLS[6].name, unitPrice: 'Rp 250,000', yearlyUsage: 1200, abc: 'A', xyz: 'X' },
    { sku: INITIAL_TOOLS[1].code, desc: INITIAL_TOOLS[1].name, unitPrice: 'Rp 3,500,000', yearlyUsage: 45, abc: 'A', xyz: 'Y' },
    { sku: INITIAL_TOOLS[7].code, desc: INITIAL_TOOLS[7].name, unitPrice: 'Rp 15,000', yearlyUsage: 5, abc: 'C', xyz: 'Z' },
  ];

  const filteredData = abcXyzData.filter((item) => {
    if (filterClass === 'ALL') return true;
    if (filterClass.startsWith('ABC-')) return item.abc === filterClass.replace('ABC-', '');
    if (filterClass.startsWith('XYZ-')) return item.xyz === filterClass.replace('XYZ-', '');
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">ABC/XYZ Classification</h3>
          <p className="text-xs text-slate-500 mt-1">Mengurutkan barang berdasarkan nilai (ABC) dan pola permintaan (XYZ).</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={filterClass} 
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Kelas</option>
            <optgroup label="ABC (Berdasarkan Nilai)">
              <option value="ABC-A">Kelas A (Nilai Tertinggi)</option>
              <option value="ABC-B">Kelas B (Nilai Menengah)</option>
              <option value="ABC-C">Kelas C (Nilai Terendah)</option>
            </optgroup>
            <optgroup label="XYZ (Berdasarkan Permintaan)">
              <option value="XYZ-X">Kelas X (Stabil)</option>
              <option value="XYZ-Y">Kelas Y (Berfluktuasi)</option>
              <option value="XYZ-Z">Kelas Z (Sangat Acak)</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-blue-900 space-y-2">
          <p><strong>Apa itu Kelas ABC & XYZ?</strong></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-bold text-blue-800 border-b border-blue-200 pb-1 mb-1">ABC (Berdasarkan Nilai Pengeluaran/Modal)</p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>A:</strong> Mewakili 80% total nilai/modal (Kontrol super ketat).</li>
                <li><strong>B:</strong> Mewakili 15% nilai/modal (Kontrol menengah).</li>
                <li><strong>C:</strong> Mewakili 5% nilai/modal (Kontrol paling longgar).</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-blue-800 border-b border-blue-200 pb-1 mb-1">XYZ (Berdasarkan Pola Permintaan)</p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>X:</strong> Sangat Stabil. Prediksi mudah, safety stock minim.</li>
                <li><strong>Y:</strong> Fluktuatif/Musiman. Prediksi sedang, butuh safety stock ekstra.</li>
                <li><strong>Z:</strong> Sangat Acak. Paling sulit diprediksi, butuh pengawasan ekstra.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200">
            <tr>
              <th className="p-4">SKU</th>
              <th className="p-4">Deskripsi</th>
              <th className="p-4 text-right">Harga Satuan</th>
              <th className="p-4 text-right">Permintaan Tahunan</th>
              <th className="p-4 text-center">Class ABC</th>
              <th className="p-4 text-center">Class XYZ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-700">{item.sku}</td>
                <td className="p-4 text-slate-600">{item.desc}</td>
                <td className="p-4 text-right text-slate-600">{item.unitPrice}</td>
                <td className="p-4 text-right font-bold text-slate-700">{item.yearlyUsage}</td>
                <td className="p-4 text-center font-bold text-indigo-600">{item.abc}</td>
                <td className="p-4 text-center font-bold text-indigo-600">{item.xyz}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
