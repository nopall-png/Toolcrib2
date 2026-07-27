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
  const pendingProcurement = procurementRequests.filter((p) => p.status === 'Pending Approval').length;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">
            Dashboard Management Toolcrib
          </h2>
          <p className="text-slate-400 text-xs">
            Selamat datang, <span className="text-white font-medium">{session.userName}</span> ({session.role})
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('user_requests')}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-xs transition-all"
          >
            <span>Request User ({pendingUserReq})</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('master_tools')}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all"
          >
            Master Tools
          </button>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Master Tools</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalTools} <span className="text-xs text-slate-400 font-normal">item</span></h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Stok Low / Out</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{lowStockCount} <span className="text-xs text-slate-400 font-normal">tool</span></h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Request Pending</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{pendingUserReq} <span className="text-xs text-slate-400 font-normal">pengajuan</span></h3>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Procurement Requisition</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{pendingProcurement} <span className="text-xs text-slate-400 font-normal">PO</span></h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
