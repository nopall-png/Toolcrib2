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
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-4 h-4" /><span>Selesai</span></span>;
      case 'Ordered':
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-800"><PackageCheck className="w-4 h-4" /><span>Dalam Pengiriman</span></span>;
      case 'Approved':
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-800"><span>Disetujui</span></span>;
      case 'Pending Approval':
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-bold bg-amber-100 text-amber-800 animate-pulse"><Clock className="w-4 h-4" /><span>Menunggu Persetujuan</span></span>;
      case 'Rejected':
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-bold bg-red-100 text-red-800"><XCircle className="w-4 h-4" /><span>Ditolak</span></span>;
      default:
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-bold bg-slate-100 text-slate-800"><span>{status}</span></span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-lg">
          <input
            type="text"
            placeholder="Cari PO No, Nama Barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-6 h-6 text-slate-400 absolute left-4 top-4" />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-6">No PO & Tanggal</th>
                <th className="p-6">Nama Tools</th>
                <th className="p-6 text-center">Qty / Satuan</th>
                <th className="p-6 text-center">Status Pemesanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPr.map((pr) => (
                <tr key={pr.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-6">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg text-base">
                      {pr.poNo}
                    </span>
                    <p className="text-sm text-slate-400 mt-2">{pr.requestDate}</p>
                  </td>

                  <td className="p-6">
                    <h4 className="font-bold text-slate-900 text-lg">{pr.toolName}</h4>
                    <p className="text-sm text-slate-400 mt-1">Pemohon: {pr.requestedBy}</p>
                  </td>

                  <td className="p-6 text-center font-bold text-slate-900 text-xl font-mono">
                    {pr.quantity} {pr.unit}
                  </td>

                  <td className="p-6 text-center">
                    {getStatusBadge(pr.status)}
                  </td>
                </tr>
              ))}
              {filteredPr.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 text-base">
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
