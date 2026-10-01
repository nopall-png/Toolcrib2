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
  const { cart, addToCart, updateCartQuantity, submitUserRequest, tools, session } = useAppStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCheckout = async () => {
    const res = await submitUserRequest('');
    if (res.success) {
      setToastMessage(res.message || 'Request berhasil!');
      setActiveTab('history');
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      alert(res.message);
    }
  };

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (cart.length > 0 && session.userName) {
      import('@/src/lib/pdfGenerator').then(({ generateRequestPDFBlob }) => {
        const url = generateRequestPDFBlob(cart, tools, session.userName!);
        setPdfUrl(url);
      });
    }
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [cart, tools, session.userName]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Unified Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Unified Header */}
        <Header activeTab={activeTab} onOpenCart={() => { }} />

        {/* Dynamic Main View Panel */}
        <main className="p-8 lg:p-12 flex-1 w-full mx-auto">
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
        <div className="w-[450px] bg-white border-l border-slate-200 flex flex-col shadow-xl shrink-0 sticky top-0 h-screen">
          <div className="p-6 border-b border-slate-200 flex items-center space-x-4 bg-slate-50/50">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-slate-900 text-2xl">Receipt Request</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30 flex flex-col">
            {cart.map((item) => {
              const maxStock = tools.find((t) => t.id === item.toolId)?.stock || 0;

              return (
                <div
                  key={item.toolId}
                  className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-lg text-slate-900 leading-snug">{item.toolName}</h4>
                      <p className="text-sm text-slate-400 font-mono mt-1">{item.toolCode}</p>
                    </div>
                    <button
                      onClick={() => updateCartQuantity(item.toolId, 0)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors -mt-1 -mr-1"
                      title="Hapus barang"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                    <span className="text-sm font-semibold text-slate-500">Qty</span>
                    <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
                      <button
                        onClick={() => updateCartQuantity(item.toolId, item.quantity - 1)}
                        className="w-9 h-9 flex items-center justify-center bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg shadow-sm transition-all border border-slate-100"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="text-lg font-bold text-slate-900 font-mono w-10 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.toolId, item.quantity + 1)}
                        disabled={item.quantity >= maxStock}
                        className="w-9 h-9 flex items-center justify-center bg-white hover:bg-emerald-50 disabled:opacity-50 text-slate-600 hover:text-emerald-600 rounded-lg shadow-sm transition-all border border-slate-100"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* PDF Preview area */}
            {pdfUrl && (
              <div className="mt-4 border-t border-slate-200 pt-4 flex-1 flex flex-col min-h-[400px]">
                <h4 className="font-semibold text-slate-700 mb-2">Form Request (PDF Preview)</h4>
                <iframe src={pdfUrl} className="w-full flex-1 border border-slate-300 rounded-xl bg-slate-100" title="PDF Preview" />
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-200 bg-white">
            <button
              onClick={handleCheckout}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl text-base flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
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
