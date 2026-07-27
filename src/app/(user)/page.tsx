'use client';

import React from 'react';
import { useAppStore } from '@/src/lib/store';
import { UserLogin } from '@/src/components/user/UserLogin';
import { UserCatalogView } from '@/components/user/catalog/UserCatalogView';
import { StaffDashboardView } from '@/src/components/staff/toolcrib/StaffDashboardView';
import Link from 'next/link';

export default function HomePage() {
  const { session } = useAppStore();

  // State 1: User authenticated views
  if (session.role === 'USER' && session.isVerified) {
    return <UserCatalogView />;
  }

  // State 2: Staff authenticated views
  if (session.role === 'TOOLCRIB' || session.role === 'PROCUREMENT') {
    return <StaffDashboardView />;
  }

  // State 3: Default User Login (Unauthenticated)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-8">
      {/* Brand Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-200/80">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-3">
            <img src="/logo/logo1.png" alt="Toolcrib Logo" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="font-black text-slate-900 text-xl tracking-tight">TOOLCRIB SYSTEM</h1>
              <p className="text-xs text-red-600 font-bold tracking-wider uppercase">PT Mattel Indonesia</p>
            </div>
          </div>
        </div>

        <Link
          href="/stafflogin"
          className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
        >
          Staff Login &rarr;
        </Link>
      </header>

      {/* Main Login Area - User Login Default */}
      <main className="max-w-4xl w-full mx-auto py-8 flex flex-col items-center">
        <div className="text-center max-w-lg mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Login User Portal
          </h2>
        </div>

        {/* Render User Login Card */}
        <div className="w-full flex justify-center">
          <UserLogin />
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center pt-6 border-t border-slate-200 text-slate-400 text-xs font-medium">
        &copy; 2026 PT Mattel Indonesia
      </footer>
    </div>
  );
}
