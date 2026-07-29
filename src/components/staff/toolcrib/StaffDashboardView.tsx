'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { Sidebar, ActiveTab } from '@/src/components/layout/Sidebar';
import { Header } from '@/src/components/layout/Header';
import { OnboardingView } from '@/src/components/staff/toolcrib/onboarding/OnboardingView';
import { MasterDataView } from '@/src/components/staff/toolcrib/master_data/MasterDataView';
import { AddToolView } from '@/src/components/staff/toolcrib/add_tool/AddToolView';
import { UserRequestsView } from '@/src/components/staff/toolcrib/user_requests/UserRequestsView';
import { ToolcribRequisitionView } from '@/src/components/staff/toolcrib/procurement/ToolcribRequisitionView';
import { AiInsightsView } from '@/src/components/staff/toolcrib/ai_insights/AiInsightsView';
import { UserManagementView } from '@/src/components/staff/toolcrib/user_management/UserManagementView';
import { ProcurementCartSidebar } from '@/src/components/staff/toolcrib/procurement/ProcurementCartSidebar';
import { ToolItem } from '@/src/lib/mock';

export const StaffDashboardView: React.FC = () => {
  const { session } = useAppStore();
  const [managementTab, setManagementTab] = useState<ActiveTab>(
    session.role === 'PROCUREMENT' ? 'procurement' : 'onboarding'
  );
  const [selectedToolForPr, setSelectedToolForPr] = useState<ToolItem | null>(null);

  const handleOpenProcurementModal = (tool: ToolItem) => {
    setSelectedToolForPr(tool);
    setManagementTab('procurement');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Unified Management Sidebar Navigation */}
      <Sidebar activeTab={managementTab} setActiveTab={setManagementTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Unified Header */}
        <Header activeTab={managementTab} />

        {/* Dynamic Management View */}
        <main className="p-8 lg:p-12 flex-1 w-full">
          {managementTab === 'onboarding' && <OnboardingView setActiveTab={setManagementTab} />}
          {managementTab === 'master_tools' && (
            <MasterDataView onOpenProcurementModal={handleOpenProcurementModal} />
          )}
          {managementTab === 'add_tool' && <AddToolView setActiveTab={setManagementTab} />}
          {managementTab === 'user_requests' && <UserRequestsView />}
          {managementTab === 'procurement' && (
            <ToolcribRequisitionView initialSelectedTool={selectedToolForPr} />
          )}
          {managementTab === 'user_management' && <UserManagementView />}
          {managementTab === 'ai_insights' && <AiInsightsView />}
        </main>
      </div>

      {/* Right Sidebar Cart for Procurement */}
      {managementTab === 'procurement' && <ProcurementCartSidebar />}
    </div>
  );
};
