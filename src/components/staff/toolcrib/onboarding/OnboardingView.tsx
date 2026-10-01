'use client';

import React from 'react';
import { useAppStore } from '@/src/lib/store';
import { ManagementTab } from '@/src/components/layout/Sidebar';
import {
  Sparkles,
  Package,
  ClipboardList,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Building,
} from 'lucide-react';

interface OnboardingViewProps {
  setActiveTab: (tab: ManagementTab) => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ setActiveTab }) => {
  const { session, tools, userRequests, procurementRequests } = useAppStore();

  const totalTools = tools.length;
  const lowStockCount = tools.filter((t) => t.status === 'Low Stock' || t.status === 'Out of Stock').length;
  const pendingUserReq = userRequests.filter((r) => r.status === 'Pending').length;
  const pendingProcurement = procurementRequests.filter((p) => p.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-slate-900 rounded-3xl p-8 lg:p-10 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <h2 className="text-4xl font-bold tracking-tight">
            Dashboard Management Toolcrib
          </h2>
          <p className="text-slate-400 text-base">
            Selamat datang, <span className="text-white font-medium text-lg">{session.userName}</span> ({session.role})
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveTab('user_requests')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3.5 rounded-xl text-base flex items-center space-x-2 shadow-sm transition-all"
          >
            <span>Request User ({pendingUserReq})</span>
            <ArrowRight className="w-6 h-6" />
          </button>

          <button
            onClick={() => setActiveTab('master_tools')}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3.5 rounded-xl text-base transition-all shadow-sm"
          >
            Master Tools
          </button>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-base font-bold text-slate-500 uppercase tracking-wider">Total Master Tools</p>
            <h3 className="text-5xl font-black text-slate-900 mt-2">{totalTools} <span className="text-base text-slate-400 font-bold ml-1">item</span></h3>
          </div>
          <div className="p-5 bg-blue-50 text-blue-600 rounded-2xl">
            <Package className="w-10 h-10" />
          </div>
        </div>

        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-base font-bold text-slate-500 uppercase tracking-wider">Stok Low / Out</p>
            <h3 className="text-5xl font-black text-slate-900 mt-2">{lowStockCount} <span className="text-base text-slate-400 font-bold ml-1">tool</span></h3>
          </div>
          <div className="p-5 bg-amber-50 text-amber-600 rounded-2xl">
            <AlertTriangle className="w-10 h-10" />
          </div>
        </div>

        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-base font-bold text-slate-500 uppercase tracking-wider">Request Pending</p>
            <h3 className="text-5xl font-black text-slate-900 mt-2">{pendingUserReq} <span className="text-base text-slate-400 font-bold ml-1">pengajuan</span></h3>
          </div>
          <div className="p-5 bg-red-50 text-red-600 rounded-2xl">
            <ClipboardList className="w-10 h-10" />
          </div>
        </div>

        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-base font-bold text-slate-500 uppercase tracking-wider">Procurement Req</p>
            <h3 className="text-5xl font-black text-slate-900 mt-2">{pendingProcurement} <span className="text-base text-slate-400 font-bold ml-1">PO</span></h3>
          </div>
          <div className="p-5 bg-blue-50 text-blue-600 rounded-2xl">
            <ShoppingCart className="w-10 h-10" />
          </div>
        </div>
      </div>
    </div>
  );
};
