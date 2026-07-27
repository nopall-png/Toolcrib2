'use client';

import React from 'react';
import { ShoppingCart, Send, Minus, Plus, X } from 'lucide-react';
import { ToolItem } from '@/src/lib/mock';
import { useAppStore } from '@/src/lib/store';

interface RequisitionCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: ToolItem[];
  cartQtys: Record<string, number>;
  setCartQtys: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setCart: React.Dispatch<React.SetStateAction<ToolItem[]>>;
  handleCartSubmit: (e: React.FormEvent) => void;
  calculatedCartCost: number;
}

export const RequisitionCartModal: React.FC<RequisitionCartModalProps> = ({
  isOpen,
  onClose,
  cart,
  cartQtys,
  setCartQtys,
  setCart,
  handleCartSubmit,
  calculatedCartCost,
}) => {
  if (!isOpen) return null;

  const updateCartQuantity = (toolId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== toolId));
      setCartQtys((prev) => {
        const newQtys = { ...prev };
        delete newQtys[toolId];
        return newQtys;
      });
      return;
    }
    setCartQtys((prev) => ({ ...prev, [toolId]: quantity }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Request Pembelian Kolektif ({cart.length} Barang)</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCartSubmit} className="flex flex-col h-full overflow-hidden mt-4 text-xs">
          <div className="overflow-y-auto space-y-3 flex-1 pr-1">
            {cart.length === 0 ? (
              <p className="text-center text-slate-400 py-8">Keranjang request masih kosong.</p>
            ) : (
              cart.map((tool) => (
                <div key={tool.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl gap-4">
                  <div className="flex items-start space-x-3">
                    <img src={tool.imageUrl} alt={tool.name} className="w-14 h-14 rounded-lg object-cover bg-white border border-slate-200 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800 text-sm mb-1">{tool.name}</p>
                      <div className="flex flex-col gap-1 text-[10px] text-slate-500 font-medium">
                        <span className="bg-slate-200/50 px-1.5 py-0.5 rounded w-fit">Kode: {tool.code}</span>
                        <span className="bg-slate-200/50 px-1.5 py-0.5 rounded w-fit">Stok Saat ini: {tool.stock} {tool.unit}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 bg-white border border-slate-200 p-1 rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(tool.id, (cartQtys[tool.id] || 1) - 1)}
                      className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-lg transition-all"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-slate-900 font-mono">
                      {cartQtys[tool.id] || 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(tool.id, (cartQtys[tool.id] || 1) + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="shrink-0 pt-4">
            <div className="mb-4">
              <label className="block font-semibold text-slate-700 mb-1">Total Estimasi Biaya (Otomatis)</label>
              <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-black text-lg">
                Rp {calculatedCartCost.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={cart.length === 0}
                className="px-5 py-2 red-gradient-btn text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Semua Requisition</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
