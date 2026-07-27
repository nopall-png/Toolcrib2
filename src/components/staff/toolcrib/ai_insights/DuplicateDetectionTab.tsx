'use client';

import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { INITIAL_TOOLS } from '@/src/lib/mock';

export const DuplicateDetectionTab = () => {
  const [filterThreshold, setFilterThreshold] = useState(80);

  const duplicates = [
    { sku1: INITIAL_TOOLS[0].code, desc1: INITIAL_TOOLS[0].name, img1: INITIAL_TOOLS[0].imageUrl, sku2: INITIAL_TOOLS[1].code, desc2: INITIAL_TOOLS[1].name, img2: INITIAL_TOOLS[1].imageUrl, score: 92.5 },
    { sku1: INITIAL_TOOLS[5].code, desc1: INITIAL_TOOLS[5].name, img1: INITIAL_TOOLS[5].imageUrl, sku2: INITIAL_TOOLS[6].code, desc2: INITIAL_TOOLS[6].name, img2: INITIAL_TOOLS[6].imageUrl, score: 88.1 },
    { sku1: INITIAL_TOOLS[3].code, desc1: INITIAL_TOOLS[3].name, img1: INITIAL_TOOLS[3].imageUrl, sku2: INITIAL_TOOLS[4].code, desc2: INITIAL_TOOLS[4].name, img2: INITIAL_TOOLS[4].imageUrl, score: 95.3 },
  ];

  const filteredDuplicates = duplicates.filter((item) => item.score >= filterThreshold);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Indikasi Duplikasi Barang (Semantic NLP)</h3>
          <p className="text-xs text-slate-500 mt-1">Mendeteksi kemiripan deskripsi barang menggunakan model SentenceTransformer.</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={filterThreshold} 
            onChange={(e) => setFilterThreshold(Number(e.target.value))}
            className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value={0}>Semua Kecocokan (&gt;0%)</option>
            <option value={80}>Sangat Mirip (&gt;80%)</option>
            <option value={90}>Identik (&gt;90%)</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200">
            <tr>
              <th className="p-4">Item 1 (Terindikasi)</th>
              <th className="p-4">Item 2 (Mirip/Duplikat)</th>
              <th className="p-4">Kemiripan</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDuplicates.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <img src={item.img1} alt={item.desc1} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-700 block">{item.sku1}</span>
                      <span className="text-slate-500 text-xs">{item.desc1}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <img src={item.img2} alt={item.desc2} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-700 block">{item.sku2}</span>
                      <span className="text-slate-500 text-xs">{item.desc2}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                    {item.score}%
                  </span>
                </td>
                <td className="p-4">
                  <button className="text-xs text-indigo-600 font-bold hover:underline">Merge SKU</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
