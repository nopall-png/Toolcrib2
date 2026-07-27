'use client';

import React from 'react';
import { ToolItem } from '@/src/lib/mock';
import { Plus } from 'lucide-react';

interface CartItem {
  toolId: string;
  toolCode: string;
  toolName: string;
  unit: string;
  quantity: number;
}

interface UserToolListTableProps {
  tools: ToolItem[];
  cart: CartItem[];
  onRequestTool: (tool: ToolItem) => void;
}

export const UserToolListTable: React.FC<UserToolListTableProps> = ({ tools, cart, onRequestTool }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">Kode & Tool Name</th>
              <th className="p-4">Kategori</th>
              <th className="p-4 text-center">Stok</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {tools.map((tool) => {
              const inCartItem = cart.find((item) => item.toolId === tool.id);
              const isOutOfStock = tool.stock === 0;

              return (
                <tr key={tool.id} className="hover:bg-slate-50/80 transition-colors">
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
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{tool.description}</p>
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

                  <td className="p-4 text-center">
                    {isOutOfStock ? (
                      <button
                        disabled
                        className="px-3 py-1.5 bg-slate-100 text-slate-400 text-[11px] font-bold rounded-lg cursor-not-allowed"
                      >
                        Habis
                      </button>
                    ) : (
                      <button
                        onClick={() => onRequestTool(tool)}
                        className="px-3 py-1.5 red-gradient-btn text-white rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1 shadow-sm mx-auto"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{inCartItem ? `Tambah (ada di Cart)` : 'Request'}</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
