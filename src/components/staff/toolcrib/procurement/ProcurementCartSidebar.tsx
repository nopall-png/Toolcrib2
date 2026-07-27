'use client';

import React from 'react';
import { useAppStore } from '@/src/lib/store';
import { ShoppingCart, Plus, Minus, Send, X } from 'lucide-react';

export const ProcurementCartSidebar: React.FC = () => {
  const { procurementCart, procurementCartQtys, updateProcurementCartQty, clearProcurementCart, createProcurementRequest } = useAppStore();

  const calculatedCartCost = procurementCart.reduce((total, tool) => {
    return total + ((tool.unitPrice || 50000) * (procurementCartQtys[tool.id] || 1));
  }, 0);

  const handleCartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    procurementCart.forEach(tool => {
      createProcurementRequest({
        toolId: tool.id,
        toolName: tool.name,
        quantity: procurementCartQtys[tool.id] || 1,
        unit: tool.unit,
        reason: 'Restock / Kebutuhan Operasional',
        estimatedCost: (tool.unitPrice || 50000) * (procurementCartQtys[tool.id] || 1),
      });
    });
    clearProcurementCart();
    alert('Purchase Request kolektif berhasil dikirim ke Procurement!');
  };

  if (procurementCart.length === 0) return null;

  return (
    <div className="w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col shadow-xl shrink-0 sticky top-0 h-screen z-40 animate-in slide-in-from-right-8 duration-300">
      <div className="p-5 border-b border-slate-200 flex items-center space-x-3 bg-slate-50/50">
        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
          <ShoppingCart className="w-5 h-5" />
        </div>
        <h2 className="font-bold text-slate-900 text-lg">Request Tools ({procurementCart.length})</h2>
      </div>

      <form onSubmit={handleCartSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
          {procurementCart.map((tool) => (
            <div key={tool.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm transition-all hover:shadow-md gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">{tool.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{tool.code}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateProcurementCartQty(tool.id, 0)}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors -mt-1 -mr-1"
                  title="Hapus barang"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-1">
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">Stok: {tool.stock} {tool.unit}</span>
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => updateProcurementCartQty(tool.id, (procurementCartQtys[tool.id] || 1) - 1)}
                    className="w-7 h-7 flex items-center justify-center bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg shadow-sm transition-all border border-slate-100"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-bold text-xs text-slate-900 font-mono">
                    {procurementCartQtys[tool.id] || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateProcurementCartQty(tool.id, (procurementCartQtys[tool.id] || 1) + 1)}
                    className="w-7 h-7 flex items-center justify-center bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-lg shadow-sm transition-all border border-slate-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-slate-200 bg-white shrink-0">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Estimasi Biaya</label>
            <div className="w-full text-slate-900 font-black text-lg">
              Rp {calculatedCartCost.toLocaleString('id-ID')}
            </div>
          </div>
          <button
            type="submit"
            disabled={procurementCart.length === 0}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Requisition</span>
          </button>
        </div>
      </form>
    </div>
  );
};
