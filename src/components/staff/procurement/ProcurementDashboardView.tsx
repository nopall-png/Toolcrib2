'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { Sidebar, ActiveTab } from '@/src/components/layout/Sidebar';
import { Header } from '@/src/components/layout/Header';
import { ProcurementApprovalPanel } from './ProcurementApprovalPanel';
import { ShoppingCart } from 'lucide-react';

export const ProcurementDashboardView: React.FC = () => {
  const { session } = useAppStore();
  const [managementTab, setManagementTab] = useState<ActiveTab>('procurement');

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Unified Management Sidebar Navigation */}
      <Sidebar activeTab={managementTab} setActiveTab={setManagementTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Unified Header */}
        <Header activeTab={managementTab} />

        {/* Dynamic Management View */}
        <main className="p-8 flex-1 max-w-7xl w-full mx-auto">
          {managementTab === 'procurement' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-slate-900">
                      Approval & Fulfillment Procurement
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Panel verifikasi pengajuan PO dari Toolcrib, persetujuan anggaran, dan pembaruan pengiriman barang.
                  </p>
                </div>
              </div>

              {/* Main Content Render */}
              <ProcurementApprovalPanel />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
