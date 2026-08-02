'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { Search, CheckCircle2, PackageCheck, FileText } from 'lucide-react';

export const ProcurementApprovalPanel: React.FC = () => {
  const { procurementRequests, updateProcurementStatus } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter history based on search query
  const filteredPr = procurementRequests.filter(
    (pr) =>
      pr.poNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.requestedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewPDF = (pr: any) => {
    // Filter PRs that have the same PO No and are not rejected
    const relatedPRs = procurementRequests.filter(p => p.poNo === pr.poNo && p.status !== 'Reject');
    import('@/src/lib/pdfGenerator').then(({ generateProcurementPDFBlob }) => {
      const url = generateProcurementPDFBlob(relatedPRs.length > 0 ? relatedPRs : [pr]);
      window.open(url, '_blank');
      // Set timeout to revoke after 1 minute to avoid memory leaks
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Cari PO No, Nama Barang, Pemohon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">No PO & Tanggal</th>
                <th className="p-4">Nama Tools</th>
                <th className="p-4 text-center">Qty / Satuan</th>
                <th className="p-4">Alasan / Catatan</th>
                <th className="p-4 text-right">Total Biaya</th>
                <th className="p-4 text-center">Status PO</th>
                <th className="p-4 text-right">Aksi Procurement</th>
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
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs">{pr.toolName}</h4>
                      {pr.isNonStandard && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-100 text-indigo-700 rounded-md uppercase border border-indigo-200 shrink-0">
                          Non-Standard
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">Pemohon: {pr.requestedBy}</p>
                  </td>

                  <td className="p-4 text-center font-bold text-slate-900 font-mono">
                    {pr.quantity} {pr.unit}
                  </td>

                  <td className="p-4 text-slate-600 max-w-xs text-[11px] truncate" title={pr.reason}>
                    {pr.reason}
                  </td>

                  <td className="p-4 text-right font-bold text-slate-900 font-mono">
                    Rp {pr.estimatedCost.toLocaleString('id-ID')}
                  </td>

                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        pr.status === 'Sudah sampai'
                          ? 'bg-emerald-100 text-emerald-800'
                          : pr.status === 'On going'
                          ? 'bg-blue-100 text-blue-800'
                          : pr.status === 'Accept'
                          ? 'bg-blue-100 text-blue-800'
                          : pr.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <span>
                        {pr.status === 'Pending' ? 'Menunggu Approval' 
                          : pr.status === 'Accept' ? 'Diterima' 
                          : pr.status === 'On going' ? 'Process' 
                          : pr.status === 'Sudah sampai' ? 'Selesai' 
                          : 'Ditolak'}
                      </span>
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => handleViewPDF(pr)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs shadow-xs flex items-center space-x-1 border border-slate-200"
                        title="Lihat Form Requisition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>

                      {pr.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => updateProcurementStatus(pr.id, 'Accept')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs"
                          >
                            Diterima
                          </button>
                          <button
                            onClick={() => updateProcurementStatus(pr.id, 'Reject')}
                            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg text-xs shadow-xs"
                          >
                            Ditolak
                          </button>
                        </>
                      )}

                      {pr.status === 'Accept' && (
                        <button
                          onClick={() => updateProcurementStatus(pr.id, 'On going')}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs shadow-xs"
                        >
                          Process
                        </button>
                      )}

                      {pr.status === 'On going' && (
                        <button
                          onClick={() => updateProcurementStatus(pr.id, 'Sudah sampai')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow-xs"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Sudah dikirim ke toolcrib</span>
                        </button>
                      )}

                      {pr.status === 'Sudah sampai' && (
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Stok Terisi</span>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPr.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    Tidak ada purchase request yang ditemukan.
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
