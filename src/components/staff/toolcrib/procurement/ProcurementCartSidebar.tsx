'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/src/lib/store';
import { ShoppingCart, Plus, Minus, Send, X } from 'lucide-react';

export const ProcurementCartSidebar: React.FC = () => {
  const { procurementCart, procurementCartQtys, updateProcurementCartQty, clearProcurementCart, createProcurementRequest, session } = useAppStore();

  const calculatedCartCost = procurementCart.reduce((total, tool) => {
    return total + ((tool.unitPrice || 50000) * (procurementCartQtys[tool.id] || 1));
  }, 0);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (procurementCart.length > 0 && session?.userName) {
      import('@/src/lib/pdfGenerator').then(({ generateProcurementRequisitionPDFBlob }) => {
        const url = generateProcurementRequisitionPDFBlob(procurementCart, procurementCartQtys, session.userName!);
        setPdfUrl(url);
      });
    }
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [procurementCart, procurementCartQtys, session?.userName]);

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
      <div className="p-6 border-b border-slate-200 flex items-center space-x-4 bg-slate-50/50">
        <div className="p-3 bg-red-100 text-red-600 rounded-lg">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="font-bold text-slate-900 text-2xl">Request Tools ({procurementCart.length})</h2>
      </div>

      <form onSubmit={handleCartSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
          {procurementCart.map((tool) => (
            <div key={tool.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm transition-all hover:shadow-md gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-lg text-slate-900 leading-snug">{tool.name}</h4>
                  <p className="text-sm text-slate-400 font-mono mt-1">{tool.code}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateProcurementCartQty(tool.id, 0)}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors -mt-1 -mr-1"
                  title="Hapus barang"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded">Stok: {tool.stock} {tool.unit}</span>
                <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => updateProcurementCartQty(tool.id, (procurementCartQtys[tool.id] || 1) - 1)}
                    className="w-10 h-10 flex items-center justify-center bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg shadow-sm transition-all border border-slate-100"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-10 text-center font-bold text-lg text-slate-900 font-mono">
                    {procurementCartQtys[tool.id] || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateProcurementCartQty(tool.id, (procurementCartQtys[tool.id] || 1) + 1)}
                    className="w-10 h-10 flex items-center justify-center bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-lg shadow-sm transition-all border border-slate-100"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* PDF Preview area */}
          {pdfUrl && (
            <div className="mt-4 border-t border-slate-200 pt-4 flex flex-col min-h-[350px]">
              <h4 className="font-semibold text-slate-700 mb-2 text-sm">Procurement Requisition (PDF Preview)</h4>
              <iframe src={pdfUrl} className="w-full flex-1 border border-slate-300 rounded-xl bg-slate-100 min-h-[300px]" title="PDF Preview" />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-white shrink-0">
          <div className="mb-6">
            <label className="block text-base font-semibold text-slate-500 mb-2">Estimasi Biaya</label>
            <div className="w-full text-slate-900 font-black text-2xl">
              Rp {calculatedCartCost.toLocaleString('id-ID')}
            </div>
          </div>
          <button
            type="submit"
            disabled={procurementCart.length === 0}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-5 rounded-xl text-xl flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            <Send className="w-6 h-6" />
            <span>Kirim Requisition</span>
          </button>
        </div>
      </form>
    </div>
  );
};
