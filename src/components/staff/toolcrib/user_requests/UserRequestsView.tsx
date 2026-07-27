'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import {
  ClipboardList,
  Search,
  Filter
} from 'lucide-react';
import { UserRequestCard } from './UserRequestCard';
import { RejectItemModal } from './RejectItemModal';

export const UserRequestsView: React.FC = () => {
  const { userRequests, tools, updateUserRequestItemStatus, updateUserRequestStatus } = useAppStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectContext, setRejectContext] = useState<{ reqId: string, itemToolId?: string } | null>(null);

  const filteredRequests = userRequests.filter((req) => {
    const matchesSearch = 
      req.requestNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.department.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleOpenReject = (reqId: string, itemToolId?: string) => {
    setRejectContext({ reqId, itemToolId });
    setRejectModalOpen(true);
  };

  const handleConfirmReject = (reason: string) => {
    if (rejectContext) {
      if (rejectContext.itemToolId) {
        // Reject specific item
        updateUserRequestItemStatus(rejectContext.reqId, rejectContext.itemToolId, 'Rejected', reason);
      } else {
        // Reject whole request (e.g. Non-Standard)
        updateUserRequestStatus(rejectContext.reqId, 'Rejected');
        // We might also want to save the reason somewhere, but currently UserRequest doesn't have a rejectionReason field, 
        // it's only on the item level. For non-standard, it's sufficient to reject the status.
      }
      setRejectModalOpen(false);
      setRejectContext(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-2">
        <ClipboardList className="w-8 h-8 text-slate-800" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Request Peminjaman</h2>
          <p className="text-sm text-slate-500">Kelola permintaan peminjaman alat dari user/divisi</p>
        </div>
      </div>

      {/* Control Bar (Search & Filter) */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari Nama Pemohon atau Divisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>

        <div className="relative min-w-[200px]">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Filter className="w-4 h-4 text-slate-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-md text-sm font-semibold text-slate-700 focus:outline-none focus:border-slate-400 appearance-none cursor-pointer"
          >
            <option value="All">Semua Status</option>
            <option value="Pending">Menunggu (Pending)</option>
            <option value="Approved">Disetujui (Approved)</option>
            <option value="Rejected">Ditolak (Rejected)</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-md border border-slate-200 p-12 text-center text-sm text-slate-500 shadow-sm">
            Tidak ada request.
          </div>
        ) : (
          filteredRequests.map((req) => (
            <UserRequestCard 
              key={req.id}
              req={req}
              tools={tools}
              onOpenReject={handleOpenReject}
            />
          ))
        )}
      </div>

      <RejectItemModal 
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
};
