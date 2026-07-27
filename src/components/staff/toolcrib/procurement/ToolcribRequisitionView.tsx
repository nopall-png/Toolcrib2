'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { ShoppingCart, History, PackageSearch } from 'lucide-react';
import { ToolcribRequisitionPanel } from './ToolcribRequisitionPanel';
import { ToolcribHistoryPanel } from './ToolcribHistoryPanel';
import { ToolItem } from '@/src/lib/mock';

interface ToolcribRequisitionViewProps {
  initialSelectedTool?: ToolItem | null;
}

export const ToolcribRequisitionView: React.FC<ToolcribRequisitionViewProps> = ({ initialSelectedTool }) => {
  // Toolcrib specific tabs
  const [activeTab, setActiveTab] = useState<'requisition' | 'history'>('requisition');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Pengadaan Barang Toolcrib
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen pengajuan pembelian barang dan riwayat pesanan (Purchase History).
          </p>
        </div>

        {/* Tab Selector for Toolcrib */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('requisition')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'requisition'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <PackageSearch className="w-4 h-4" />
              <span>Pengajuan Baru</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Riwayat Pembelian</span>
            </button>
          </div>
      </div>

      {/* Main Content Render */}
      {activeTab === 'requisition' ? (
        <ToolcribRequisitionPanel initialSelectedTool={initialSelectedTool} />
      ) : (
        <ToolcribHistoryPanel />
      )}
    </div>
  );
};
