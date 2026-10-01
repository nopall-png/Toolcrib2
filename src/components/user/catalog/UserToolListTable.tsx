'use client';

import React from 'react';
import { ToolItem } from '@/src/lib/mock';
import { Plus } from 'lucide-react';

import type { UserRequestItem } from '@/src/types';

interface UserToolListTableProps {
  tools: ToolItem[];
  cart: UserRequestItem[];
  onRequestTool: (tool: ToolItem) => void;
}

export const UserToolListTable: React.FC<UserToolListTableProps> = ({ tools, cart, onRequestTool }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-base">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-5">Kode & Tool Name</th>
              <th className="p-5">Kategori</th>
              <th className="p-5 text-center">Stok</th>
              <th className="p-5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {tools.map((tool) => {
              const inCartItem = cart.find((item) => item.toolId === tool.id);
              const isOutOfStock = tool.stock === 0;

              return (
                <tr key={tool.id} className="hover:bg-slate-50/80 transition-colors">
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
                        <p className="text-base text-slate-500 line-clamp-1 mt-1.5">{tool.description}</p>
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

                  <td className="p-5 text-center">
                    {isOutOfStock ? (
                      <button
                        disabled
                        className="px-5 py-3 bg-slate-100 text-slate-400 text-base font-bold rounded-xl cursor-not-allowed"
                      >
                        Habis
                      </button>
                    ) : (
                      <button
                        onClick={() => onRequestTool(tool)}
                        className="px-5 py-3 red-gradient-btn text-white rounded-xl text-base font-bold flex items-center justify-center space-x-2 shadow-sm mx-auto"
                      >
                        <Plus className="w-6 h-6" />
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
