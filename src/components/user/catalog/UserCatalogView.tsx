'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { CheckCircle2, ShoppingCart } from 'lucide-react';
import { Sidebar, ActiveTab } from '@/src/components/layout/Sidebar';
import { Header } from '@/src/components/layout/Header';
import { UserCatalogTab } from './UserCatalogTab';
import { UserRequestBarangTab } from '../request_barang/UserRequestBarangTab';
import { UserHistoryTab } from '../history/UserHistoryTab';
import { UserCartDrawer } from './UserCartDrawer';

export const UserCatalogView: React.FC = () => {
  const { cart, addToCart, updateCartQuantity, removeFromCart, submitUserRequest } = useAppStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [requestNotes, setRequestNotes] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCheckout = () => {
    const res = submitUserRequest(requestNotes);
    if (res.success) {
      setToastMessage(res.message || 'Request berhasil!');
      setIsCartOpen(false);
      setRequestNotes('');
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
        <Header activeTab={activeTab} onOpenCart={() => setIsCartOpen(true)} />

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

      {/* Cart Drawer Overlay */}
      <UserCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateCartQuantity={updateCartQuantity}
        removeFromCart={removeFromCart}
        requestNotes={requestNotes}
        setRequestNotes={setRequestNotes}
        handleCheckout={handleCheckout}
      />

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-slate-900 text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 group border-2 border-slate-700"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 group-hover:border-slate-800">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
        </button>
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
