'use client';

import React from 'react';
import { ShoppingCart, CheckCircle2, Minus, Plus, X } from 'lucide-react';
import { useAppStore } from '@/src/lib/store';

interface CartItem {
  toolId: string;
  toolCode: string;
  toolName: string;
  unit: string;
  quantity: number;
}

interface UserCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateCartQuantity: (toolId: string, quantity: number) => void;
  removeFromCart: (toolId: string) => void;
  requestNotes: string;
  setRequestNotes: (notes: string) => void;
  handleCheckout: () => void;
}

export const UserCartDrawer: React.FC<UserCartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  updateCartQuantity,
  removeFromCart,
  requestNotes,
  setRequestNotes,
  handleCheckout,
}) => {
  const { tools } = useAppStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col justify-between p-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        <div className="overflow-hidden flex flex-col h-full">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-slate-900 text-lg">Daftar Pengajuan Toolcrib</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items in Cart */}
          <div className="py-4 space-y-3 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">Keranjang request masih kosong.</p>
            ) : (
              cart.map((item) => {
                const maxStock = tools.find((t) => t.id === item.toolId)?.stock || 0;

                return (
                  <div
                    key={item.toolId}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{item.toolName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{item.toolCode}</p>
                    </div>

                    <div className="flex items-center space-x-1 bg-white border border-slate-200 p-1 rounded-lg">
                      <button
                        onClick={() => updateCartQuantity(item.toolId, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-bold text-slate-900 font-mono w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.toolId, item.quantity + 1)}
                        disabled={item.quantity >= maxStock}
                        className="w-6 h-6 flex items-center justify-center bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 rounded transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Notes Input */}
          {cart.length > 0 && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Keperluan / No Mold</label>
              <textarea
                rows={2}
                placeholder="Contoh: Untuk perbaikan Mold Line 2 Shift 1"
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}
        </div>

        {/* Bottom Checkout Button */}
        {cart.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={handleCheckout}
              className="w-full red-gradient-btn text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Kirim Request ke Toolcrib</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
