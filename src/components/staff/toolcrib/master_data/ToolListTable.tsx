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
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4 w-12 text-center">No.</th>
              <th className="p-4">Kode & Tool Name</th>
              <th className="p-4">Kategori</th>
              <th className="p-4 text-center">Stok Asli</th>
              <th className="p-4 text-center text-indigo-700 bg-indigo-50/50">Min (ROP)</th>
              <th className="p-4 text-center text-indigo-700 bg-indigo-50/50">Max</th>
              <th className="p-4 text-center">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {tools.map((tool, index) => (
              <tr
                key={tool.id}
                onClick={() => onSelectTool(tool)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <td className="p-4 text-center text-slate-500 font-bold text-xs">
                  {index + 1}
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={tool.imageUrl}
                      alt={tool.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <span className="font-mono text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                        {tool.code}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs mt-0.5">{tool.name}</h4>
                    </div>
                  </div>
                </td>

                <td className="p-4">
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold">
                    {tool.category}
                  </span>
                </td>

                <td className="p-4 text-center font-black text-slate-900 text-sm">
                  {tool.stock} <span className="text-slate-400 text-xs font-normal">{tool.unit}</span>
                </td>

                <td className="p-4 text-center font-bold text-red-600 text-xs bg-indigo-50/20">
                  {Math.max(1, Math.floor(tool.minStock * 1.2))} <span className="text-slate-400 text-[10px] font-normal">{tool.unit}</span>
                </td>

                <td className="p-4 text-center font-bold text-emerald-600 text-xs bg-indigo-50/20">
                  {Math.max(5, Math.floor(tool.maxStock * 0.85))} <span className="text-slate-400 text-[10px] font-normal">{tool.unit}</span>
                </td>

                <td className="p-4 text-center">
                  <button className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all inline-flex items-center space-x-1">
                    <Eye className="w-3.5 h-3.5 text-red-600" />
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
