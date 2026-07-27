'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { CheckCircle2, ShoppingCart, Minus, Plus, X } from 'lucide-react';
import { Sidebar, ActiveTab } from '@/src/components/layout/Sidebar';
import { Header } from '@/src/components/layout/Header';
import { UserCatalogTab } from './UserCatalogTab';
import { UserRequestBarangTab } from '../request_barang/UserRequestBarangTab';
import { UserHistoryTab } from '../history/UserHistoryTab';

export const UserCatalogView: React.FC = () => {
  const { cart, addToCart, updateCartQuantity, submitUserRequest, tools } = useAppStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCheckout = () => {
    const res = submitUserRequest('');
    if (res.success) {
      setToastMessage(res.message || 'Request berhasil!');
      setActiveTab('request_barang');
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Unified Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Unified Header */}
        <Header activeTab={activeTab} onOpenCart={() => {}} />

        {/* Dynamic Main View Panel */}
        <main className="p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {activeTab === 'catalog' && (
            <UserCatalogTab
              cart={cart}
              addToCart={addToCart}
            />
          )}

          {activeTab === 'request_barang' && (
            <UserRequestBarangTab
              onGoToCatalog={() => setActiveTab('catalog')}
              setToastMessage={setToastMessage}
            />
          )}

          {activeTab === 'history' && <UserHistoryTab />}
        </main>
      </div>

      {/* Right Sidebar Cart (Receipt) */}
      {cart.length > 0 && (
        <div className="w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col shadow-xl shrink-0 sticky top-0 h-screen">
          <div className="p-5 border-b border-slate-200 flex items-center space-x-3 bg-slate-50/50">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-lg">Receipt Request</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
            {cart.map((item) => {
              const maxStock = tools.find((t) => t.id === item.toolId)?.stock || 0;

              return (
                <div
                  key={item.toolId}
                  className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">{item.toolName}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{item.toolCode}</p>
                    </div>
                    <button
                      onClick={() => updateCartQuantity(item.toolId, 0)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors -mt-1 -mr-1"
                      title="Hapus barang"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-1">
                    <span className="text-xs font-semibold text-slate-500">Qty</span>
                    <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                      <button
                        onClick={() => updateCartQuantity(item.toolId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg shadow-sm transition-all border border-slate-100"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-slate-900 font-mono w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.toolId, item.quantity + 1)}
                        disabled={item.quantity >= maxStock}
                        className="w-7 h-7 flex items-center justify-center bg-white hover:bg-emerald-50 disabled:opacity-50 text-slate-600 hover:text-emerald-600 rounded-lg shadow-sm transition-all border border-slate-100"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-5 border-t border-slate-200 bg-white">
            <button
              onClick={handleCheckout}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Kirim Request ke Toolcrib</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-800 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
