'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import {
  ChevronRight,
  Building2,
  UserCheck,
  ShoppingCart,
  LogOut,
  ShieldCheck,
  Wrench,
  Menu,
} from 'lucide-react';
import { ActiveTab } from './Sidebar';
import ChatbotDrawer from './ChatbotDrawer';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onOpenCart }) => {
  const { session, logout, cart, isSidebarOpen, setSidebarOpen } = useAppStore();

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
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shadow-xs shrink-0 z-20 sticky top-0">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-3 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu className="w-7 h-7" />
        </button>
        <div className="flex items-center space-x-3 text-slate-500 text-base font-bold uppercase tracking-wider">
        <span>{isUser ? 'Portal User' : 'Toolcrib Management'}</span>
        <ChevronRight className="w-6 h-6 text-slate-300" />
        <span className="text-slate-900 font-bold capitalize text-xl">
          {getTabLabel(activeTab)}
        </span>
      </div>
      </div>

      {/* Right Action Items */}
      <div className="flex items-center space-x-3">
        {isUser ? (
          <>
            {/* User Profile Pill */}
            <div className="hidden sm:flex items-center space-x-4 bg-slate-100/80 px-5 py-2.5 rounded-xl border border-slate-200/60">
              <div className="flex items-center space-x-2 text-base text-slate-700 font-semibold">
                <Building2 className="w-5 h-5 text-red-600" />
                <span>{session.department?.name}</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center space-x-2 text-base text-slate-700 font-semibold">
                <UserCheck className="w-5 h-5 text-red-600" />
                <span>{session.userName}</span>
              </div>
            </div>

            {/* Cart Drawer Trigger */}
            {onOpenCart && (
              <button
                onClick={onOpenCart}
                className="relative p-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ShoppingCart className="w-7 h-7" />
                {cartTotalQty > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full border-2 border-white">
                    {cartTotalQty}
                  </span>
                )}
              </button>
            )}
          </>
        ) : (
          /* Staff Profile Pill */
          <div className="flex items-center space-x-4 bg-slate-100/80 px-5 py-2.5 rounded-xl border border-slate-200/60">
            <div className="flex items-center space-x-2 text-base text-slate-700 font-semibold">
              <Wrench className="w-5 h-5 text-red-600" />
              <span>Role: <strong className="text-red-600">{session.role}</strong></span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center space-x-2 text-base text-slate-700 font-semibold">
              <ShieldCheck className="w-5 h-5 text-red-600" />
              <span>{session.userName}</span>
            </div>
          </div>
        )}

        <div className="w-px h-6 bg-slate-200 mx-2"></div>

        {/* Logout Quick Button */}
        <button
          onClick={logout}
          className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          title="Keluar"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      {/* Render Chatbot Drawer */}
      {session.role === 'TOOLCRIB' && (
        <ChatbotDrawer 
          isOpen={isChatbotOpen} 
          onClose={() => setIsChatbotOpen(false)} 
          user={session} 
        />
      )}
    </header>
  );
};
