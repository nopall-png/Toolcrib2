'use client';

import React from 'react';
import { ToolItem } from '@/src/lib/mock';
import { MapPin, Eye } from 'lucide-react';

interface ToolListTableProps {
  tools: ToolItem[];
  onSelectTool: (tool: ToolItem) => void;
}

export const ToolListTable: React.FC<ToolListTableProps> = ({ tools, onSelectTool }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-base">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-5 w-16 text-center">No.</th>
              <th className="p-5">Kode & Tool Name</th>
              <th className="p-5">Kategori</th>
              <th className="p-5 text-center">Stok Asli</th>
              <th className="p-5 text-center text-indigo-700 bg-indigo-50/50">Min (ROP)</th>
              <th className="p-5 text-center text-indigo-700 bg-indigo-50/50">Max</th>
              <th className="p-5 text-center">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {tools.map((tool, index) => (
              <tr
                key={tool.id}
                onClick={() => onSelectTool(tool)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <td className="p-5 text-center text-slate-500 font-bold text-xl">
                  {index + 1}
                </td>
                <td className="p-5">
                  <div className="flex items-center space-x-5">
                    <img
                      src={tool.imageUrl}
                      alt={tool.name}
                      className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <span className="font-mono text-base font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded">
                        {tool.code}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xl mt-3">{tool.name}</h4>
                    </div>
                  </div>
                </td>

                <td className="p-5">
                  <span className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-base font-bold">
                    {tool.category}
                  </span>
                </td>

                <td className="p-5 text-center font-black text-slate-900 text-3xl">
                  {tool.stock} <span className="text-slate-400 text-base font-normal ml-1">{tool.unit}</span>
                </td>

                <td className="p-5 text-center font-bold text-red-600 text-2xl bg-indigo-50/20">
                  {tool.minStock} <span className="text-slate-400 text-base font-normal ml-1">{tool.unit}</span>
                </td>

                <td className="p-5 text-center font-bold text-emerald-600 text-2xl bg-indigo-50/20">
                  {tool.maxStock} <span className="text-slate-400 text-base font-normal ml-1">{tool.unit}</span>
                </td>

                <td className="p-5 text-center">
                  <button className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-base font-bold transition-all inline-flex items-center space-x-2">
                    <Eye className="w-6 h-6 text-red-600" />
                    <span>Detail</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
