'use client';

import React from 'react';
import { ToolItem } from '@/src/lib/mock';
import { MapPin, Eye } from 'lucide-react';

interface ToolCatalogGridProps {
  tools: ToolItem[];
  onSelectTool: (tool: ToolItem) => void;
}

export const ToolCatalogGrid: React.FC<ToolCatalogGridProps> = ({ tools, onSelectTool }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {tools.map((tool) => (
        <div
          key={tool.id}
          onClick={() => onSelectTool(tool)}
          className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all space-y-4 cursor-pointer group"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <img
                src={tool.imageUrl}
                alt={tool.name}
                className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col items-end">
                <span className="font-mono text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                  {tool.code}
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-1 flex items-center space-x-1">
                  <Eye className="w-3 h-3 text-slate-400" />
                  <span>Klik Detail</span>
                </span>
              </div>
            </div>

            <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-red-600 transition-colors">
              {tool.name}
            </h3>
            
            <div className="flex items-center space-x-2 mt-2">
              <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md text-[11px] font-semibold">
                {tool.category}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Stok Asli</span>
                <span className="text-sm font-black text-slate-900">{tool.stock}</span>
                <span className="text-[10px] text-slate-500 block">{tool.unit}</span>
              </div>

              <div>
                <span className="text-[10px] text-indigo-500 uppercase font-bold block">✨ AI Min</span>
                <span className="text-sm font-bold text-red-600">{Math.max(1, Math.floor(tool.minStock * 1.2))}</span>
                <span className="text-[10px] text-slate-500 block">{tool.unit}</span>
              </div>

              <div>
                <span className="text-[10px] text-indigo-500 uppercase font-bold block">✨ AI Max</span>
                <span className="text-sm font-bold text-emerald-600">{Math.max(5, Math.floor(tool.maxStock * 0.85))}</span>
                <span className="text-[10px] text-slate-500 block">{tool.unit}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
