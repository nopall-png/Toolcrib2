'use client';

import React from 'react';
import { useAppStore } from '@/src/lib/store';
import {
  ChevronRight,
  Building2,
  UserCheck,
  ShoppingCart,
  LogOut,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onOpenCart }) => {
  const { session, logout, cart } = useAppStore();

  const cartTotalQty = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  // Map active tab to human readable breadcrumb title
  const getTabLabel = (tab: ActiveTab): string => {
    switch (tab) {
      case 'catalog':
        return 'Katalog Tools';
      case 'request_barang':
        return 'Request Barang';
      case 'history':
        return 'History Request';
      case 'onboarding':
        return 'Dashboard Overview';
      case 'master_tools':
        return 'Master Data Tools';
      case 'add_tool':
        return 'Tambah Tool Baru';
      case 'user_requests':
        return 'Request dari User';
      case 'procurement':
        return 'Request ke Procurement';
      default:
        return 'Dashboard';
    }
  };

  const isUser = session.role === 'USER';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Breadcrumb Path */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <span>{isUser ? 'Portal User' : 'Toolcrib Management'}</span>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <span className="text-slate-900 font-bold capitalize">
          {getTabLabel(activeTab)}
        </span>
      </div>

      {/* Right Action Items */}
      <div className="flex items-center space-x-3">
        {isUser ? (
          <>
            {/* User Profile Pill */}
            <div className="hidden sm:flex items-center space-x-3 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60">
              <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-semibold">
                <Building2 className="w-3.5 h-3.5 text-red-600" />
                <span>{session.department?.name}</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-semibold">
                <UserCheck className="w-3.5 h-3.5 text-red-600" />
                <span>{session.userName}</span>
              </div>
            </div>

            {/* Cart Drawer Trigger */}
            {onOpenCart && (
              <button
                onClick={onOpenCart}
                className="relative p-2 px-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border border-red-200 flex items-center space-x-2 font-bold text-xs shadow-xs"
              >
                <ShoppingCart className="w-4 h-4 text-red-600" />
                <span className="hidden sm:inline">Keranjang</span>
                {cartTotalQty > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
                    {cartTotalQty}
                  </span>
                )}
              </button>
            )}
          </>
        ) : (
          /* Staff Profile Pill */
          <div className="flex items-center space-x-3 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60">
            <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-semibold">
              <Wrench className="w-3.5 h-3.5 text-red-600" />
              <span>Role: <strong className="text-red-600">{session.role}</strong></span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
              <span>{session.userName}</span>
            </div>
          </div>
        )}

        {/* Logout Quick Button */}
        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          title="Logout Portal"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
};
