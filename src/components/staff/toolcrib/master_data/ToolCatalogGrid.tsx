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
      {tools.map((tool, index) => (
        <div
          key={tool.id}
          onClick={() => onSelectTool(tool)}
          className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all space-y-4 cursor-pointer group"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-100 text-slate-500 font-bold text-sm shrink-0">
                  {index + 1}
                </span>
                <img
                  src={tool.imageUrl}
                  alt={tool.name}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex flex-col items-end">
                <span className="font-mono text-sm font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                  {tool.code}
                </span>
                <span className="text-sm text-slate-400 font-medium mt-1.5 flex items-center space-x-1">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>Klik Detail</span>
                </span>
              </div>
            </div>

            <h3 className="font-bold text-slate-900 text-xl leading-snug group-hover:text-red-600 transition-colors">
              {tool.name}
            </h3>

            <div className="flex items-center space-x-2 mt-3">
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-sm font-semibold">
                {tool.category}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-2">
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
              <div>
                <span className="text-sm text-slate-400 uppercase font-semibold block">Stok Asli</span>
                <span className="text-2xl font-black text-slate-900">{tool.stock}</span>
                <span className="text-sm text-slate-500 block">{tool.unit}</span>
              </div>

              <div>
                <span className="text-sm text-indigo-500 uppercase font-bold block">Min (ROP)</span>
                <span className="text-2xl font-bold text-red-600">{tool.minStock}</span>
                <span className="text-sm text-slate-500 block">{tool.unit}</span>
              </div>

              <div>
                <span className="text-sm text-indigo-500 uppercase font-bold block">Max</span>
                <span className="text-2xl font-bold text-emerald-600">{tool.maxStock}</span>
                <span className="text-sm text-slate-500 block">{tool.unit}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
