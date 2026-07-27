'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { Search, CheckCircle2, PackageCheck, Clock, XCircle } from 'lucide-react';

export const ToolcribHistoryPanel: React.FC = () => {
  const { procurementRequests } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter history based on search query
  const filteredPr = procurementRequests.filter(
    (pr) =>
      pr.poNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.requestedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Fulfilled':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3" /><span>Selesai</span></span>;
      case 'Ordered':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800"><PackageCheck className="w-3 h-3" /><span>Dalam Pengiriman</span></span>;
      case 'Approved':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800"><span>Disetujui</span></span>;
      case 'Pending Approval':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse"><Clock className="w-3 h-3" /><span>Menunggu Persetujuan</span></span>;
      case 'Rejected':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800"><XCircle className="w-3 h-3" /><span>Ditolak</span></span>;
      default:
        return <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800"><span>{status}</span></span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Cari PO No, Nama Barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">No PO & Tanggal</th>
                <th className="p-4">Nama Tools</th>
                <th className="p-4 text-center">Qty / Satuan</th>
                <th className="p-4 text-center">Status Pemesanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPr.map((pr) => (
                <tr key={pr.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                      {pr.poNo}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">{pr.requestDate}</p>
                  </td>

                  <td className="p-4">
                    <h4 className="font-bold text-slate-900 text-xs">{pr.toolName}</h4>
                    <p className="text-[10px] text-slate-400">Pemohon: {pr.requestedBy}</p>
                  </td>

                  <td className="p-4 text-center font-bold text-slate-900 font-mono">
                    {pr.quantity} {pr.unit}
                  </td>

                  <td className="p-4 text-center">
                    {getStatusBadge(pr.status)}
                  </td>
                </tr>
              ))}
              {filteredPr.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 text-xs">
                    Belum ada riwayat pembelian barang.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
