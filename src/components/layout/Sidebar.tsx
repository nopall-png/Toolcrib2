'use client';

import React from 'react';
import { useAppStore } from '@/src/lib/store';
import {
  Compass,
  Package,
  ClipboardList,
  ShoppingCart,
  LogOut,
  Wrench,
  Building,
  User,
  ShieldCheck,
  PackagePlus,
  History,
  BrainCircuit,
} from 'lucide-react';

export type ActiveTab =
  // User Tabs
  | 'catalog'
  | 'request_barang'
  | 'history'
  // Staff Tabs
  | 'onboarding'
  | 'master_tools'
  | 'add_tool'
  | 'user_requests'
  | 'procurement'
  | 'ai_insights';

export type ManagementTab = ActiveTab;

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { session, logout, userRequests, procurementRequests, tools, cart } = useAppStore();

  const isUser = session.role === 'USER';

  // Badges calculations
  const pendingUserReqCount = userRequests.filter((r) => r.status === 'Pending').length;
  const pendingProcurementCount = procurementRequests.filter((p) => p.status === 'Pending Approval').length;
  const cartTotalQty = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  const myRequests = userRequests.filter(
    (req) => req.userName === session.userName || req.department === session.department?.name
  );
  const activeUserRequestsCount = myRequests.filter(
    (r) => r.status === 'Pending' || r.status === 'Approved'
  ).length;
  const historyUserRequestsCount = myRequests.filter(
    (r) => r.status === 'Issued' || r.status === 'Returned' || r.status === 'Rejected'
  ).length;

  const isProcurement = session.role === 'PROCUREMENT';

  // Build menu items based on user role
  let navItems;
  if (isUser) {
    navItems = [
        {
          id: 'catalog' as ActiveTab,
          label: 'Katalog Tools',
          icon: Package,
        },
        {
          id: 'request_barang' as ActiveTab,
          label: 'Request Barang',
          icon: ShoppingCart,
        },
        {
          id: 'history' as ActiveTab,
          label: 'History Request',
          icon: History,
        },
      ];
  } else if (isProcurement) {
    navItems = [
      {
        id: 'procurement' as ActiveTab,
        label: 'Daftar Request dari Toolcrib',
        icon: ShoppingCart,
        badge: pendingProcurementCount > 0 ? `${pendingProcurementCount}` : undefined,
        badgeColor: 'bg-blue-600 text-white',
      },
    ];
  } else {
    // TOOLCRIB role
    navItems = [
      {
        id: 'onboarding' as ActiveTab,
        label: 'Dashboard Overview',
        icon: Compass,
      },
      {
        id: 'master_tools' as ActiveTab,
        label: 'Master Data Tools',
        icon: Package,
      },
      {
        id: 'add_tool' as ActiveTab,
        label: 'Tambah Tool Baru',
        icon: PackagePlus,
      },
      {
        id: 'user_requests' as ActiveTab,
        label: 'Request dari User',
        icon: ClipboardList,
        badge: pendingUserReqCount > 0 ? `${pendingUserReqCount}` : undefined,
        badgeColor: 'bg-red-600 text-white',
      },
      {
        id: 'procurement' as ActiveTab,
        label: 'Request ke Procurement',
        icon: ShoppingCart,
        badge: pendingProcurementCount > 0 ? `${pendingProcurementCount}` : undefined,
        badgeColor: 'bg-blue-600 text-white',
      },
      {
        id: 'ai_insights' as ActiveTab,
        label: 'AI Predictive Insights',
        icon: BrainCircuit,
      },
    ];
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shadow-xs z-30 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
        <img
          src="/logo/logo1.png"
          alt="Toolcrib Logo"
          className="w-9 h-9 object-contain shrink-0"
        />
        <div>
          <h1 className="font-extrabold text-slate-900 tracking-tight text-base">TOOLCRIB</h1>
          <p className="text-[10px] font-bold text-red-600 tracking-wider uppercase">PT Mattel Indonesia</p>
        </div>
      </div>

      {/* User Role Card */}
      <div className="p-3 mx-3 mt-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center space-x-3">
        <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
          {session.role === 'TOOLCRIB' ? (
            <Wrench className="w-4 h-4" />
          ) : session.role === 'PROCUREMENT' ? (
            <Building className="w-4 h-4" />
          ) : (
            <User className="w-4 h-4" />
          )}
        </div>
        <div className="overflow-hidden min-w-0">
          <div className="flex items-center space-x-1">
            <span className="text-xs font-bold text-slate-900 truncate">{session.userName || 'User'}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-red-600 shrink-0" />
          </div>
          <p className="text-[10px] text-slate-500 font-medium truncate capitalize">
            Role: <span className="text-red-600 font-bold">{session.role}</span>
          </p>
          {session.department?.name && (
            <p className="text-[9px] text-slate-400 font-medium truncate">{session.department.name}</p>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div className="p-3 space-y-1 flex-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          {isUser ? 'Menu Utama User' : 'Menu Utama Management'}
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full py-2.5 px-3 rounded-xl transition-all text-left flex items-center justify-between group ${
                isActive
                  ? 'bg-red-600 text-white shadow-sm font-bold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-red-600'
                  }`}
                />
                <span className="text-xs font-bold">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-red-600' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={logout}
          className="w-full py-2.5 px-3 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-xl transition-all text-xs font-bold flex items-center justify-center space-x-2 shadow-xs"
        >
          <LogOut className="w-4 h-4 text-red-600" />
          <span>Keluar Portal</span>
        </button>
      </div>
    </aside>
  );
};
