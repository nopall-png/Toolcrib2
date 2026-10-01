'use client';

import React from 'react';
import { useAppStore } from '@/src/lib/store';
import { StaffLogin } from '@/src/components/staff/toolcrib/StaffLogin';
import { StaffDashboardView } from '@/src/components/staff/toolcrib/StaffDashboardView';
import { ProcurementDashboardView } from '@/src/components/staff/procurement/ProcurementDashboardView';
import Link from 'next/link';

export default function StaffLoginPage() {
  const { session } = useAppStore();

  // If already authenticated as Staff, show respective Dashboard
  if (session.role === 'PROCUREMENT') {
    return <ProcurementDashboardView />;
  }
  if (session.role === 'TOOLCRIB') {
    return <StaffDashboardView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-8">
      {/* Brand Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-200/80">
        <div className="flex items-center space-x-3">
          <img src="/logo/logo1.png" alt="Toolcrib Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="font-black text-slate-900 text-xl tracking-tight">TOOLCRIB SYSTEM</h1>
            <p className="text-xs text-red-600 font-bold tracking-wider uppercase">PT Mattel Indonesia</p>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
        >
          &larr; Switch to User Login
        </Link>
      </header>

      {/* Main Staff Login Area */}
      <main className="max-w-4xl w-full mx-auto py-8 flex flex-col items-center">
        <div className="text-center max-w-lg mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Login Staff Portal
          </h2>
        </div>

        {/* Staff Login Card */}
        <div className="w-full flex justify-center">
          <StaffLogin />
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center pt-6 border-t border-slate-200 text-slate-400 text-xs font-medium">
        &copy; 2026 PT Mattel Indonesia
      </footer>
    </div>
  );
}
