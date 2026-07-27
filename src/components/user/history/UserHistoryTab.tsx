'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { History, Search, AlertCircle } from 'lucide-react';
import { HistoryRequestItem } from './HistoryRequestItem';

export const UserHistoryTab: React.FC = () => {
  const { userRequests, session, tools } = useAppStore();
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter requests belonging to current user or user's department
  const myRequests = userRequests.filter(
    (req) => req.userName === session.userName || req.department === session.department?.name
  );

  const filterFn = (req: typeof userRequests[0]) => {
    return (
      req.requestNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.notes && req.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (req.isNonStandard && req.nonStandardDetails?.toolName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      req.items.some((item) => item.toolName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const onGoingRequests = myRequests.filter(
    (req) => req.status === 'Pending' || req.status === 'Approved'
  ).filter(filterFn);

  const completedRequests = myRequests.filter(
    (req) => req.status === 'Issued' || req.status === 'Returned' || req.status === 'Rejected'
  ).filter(filterFn);

  return (
    <div className="space-y-8 w-full">
      {/* Header Title Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
            <History className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Riwayat History Request</h2>
            <p className="text-base text-slate-500 mt-1">
              Pantau status pengajuan barang yang sedang berjalan dan riwayat pengajuan yang sudah selesai.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-96">
          <Search className="w-6 h-6 text-slate-400 absolute left-4 top-4" />
          <input
            type="text"
            placeholder="Cari No Request, Alat, atau Catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
          />
        </div>
      </div>

      {/* SECTION 1: Sedang Berjalan (On Going) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="font-extrabold text-slate-900 text-xl flex items-center space-x-3">
            <span className="w-4 h-4 rounded-full bg-amber-500 inline-block animate-pulse"></span>
            <span>Pengajuan Sedang Berjalan (On Going)</span>
          </h3>
          <span className="text-base font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-800">
            {onGoingRequests.length} Request
          </span>
        </div>

        {onGoingRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 text-lg">Tidak Ada Request Sedang Berjalan</h4>
            <p className="text-base text-slate-500 mt-1">Saat ini Anda tidak memiliki pengajuan aktif.</p>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            {onGoingRequests.map((req) => (
              <HistoryRequestItem key={req.id} request={req} tools={tools} />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Sudah Selesai (Completed) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="font-extrabold text-slate-900 text-xl flex items-center space-x-3">
            <span className="w-4 h-4 rounded-full bg-emerald-500 inline-block"></span>
            <span>Pengajuan Sudah Selesai</span>
          </h3>
          <span className="text-base font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">
            {completedRequests.length} Request
          </span>
        </div>

        {completedRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 text-lg">Belum Ada Riwayat Pengajuan Selesai</h4>
            <p className="text-base text-slate-500 mt-1">Pengajuan yang telah selesai/diserahkan akan muncul di sini.</p>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            {completedRequests.map((req) => (
              <HistoryRequestItem key={req.id} request={req} tools={tools} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
