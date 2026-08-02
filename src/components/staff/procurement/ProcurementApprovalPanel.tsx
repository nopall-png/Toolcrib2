'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { Search, CheckCircle2, PackageCheck, FileText } from 'lucide-react';

export const ProcurementApprovalPanel: React.FC = () => {
  const { procurementRequests, updateProcurementStatus } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPo, setExpandedPo] = useState<string | null>(null);
  
  // Filter history based on search query
  const filteredPr = procurementRequests.filter(
    (pr) =>
      pr.poNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.requestedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by PO No
  const groupedPrs = Object.values(
    filteredPr.reduce((acc, pr) => {
      const basePoNo = pr.poNo.replace(/-\d+$/, ''); // Strip -1, -2 suffix
      if (!acc[basePoNo]) {
        acc[basePoNo] = {
          poNo: basePoNo,
          requestDate: pr.requestDate,
          requestedBy: pr.requestedBy,
          items: [],
          status: pr.status
        };
      }
      acc[basePoNo].items.push(pr);
      return acc;
    }, {} as Record<string, { poNo: string, requestDate: string, requestedBy: string, items: typeof procurementRequests, status: string }>)
  ).sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());

  const handleUpdatePOStatus = async (items: typeof procurementRequests, newStatus: any) => {
    for (const item of items) {
      await updateProcurementStatus(item.id, newStatus);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sudah sampai':
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-4 h-4" /><span>Selesai</span></span>;
      case 'On going':
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800"><PackageCheck className="w-4 h-4" /><span>Dalam Proses</span></span>;
      case 'Accept':
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800"><span>Disetujui</span></span>;
      case 'Pending':
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse"><span>Menunggu Persetujuan</span></span>;
      case 'Reject':
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800"><span>Ditolak</span></span>;
      default:
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800"><span>{status}</span></span>;
    }
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
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      <div className="space-y-4">
        {groupedPrs.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm shadow-xs">
            Tidak ada purchase request yang ditemukan.
          </div>
        ) : (
          groupedPrs.map((group) => {
            const isExpanded = expandedPo === group.poNo;
            const totalItems = group.items.length;
            const firstItemName = group.items[0].toolName;
            
            // Calculate total cost for the PO
            const totalCost = group.items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

            return (
              <div key={group.poNo} className="bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all overflow-hidden">
                
                {/* Header / Minimized State */}
                <div 
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedPo(isExpanded ? null : group.poNo)}
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <span className="font-extrabold text-blue-700 text-lg font-mono bg-blue-50 px-2.5 py-0.5 rounded-lg">{group.poNo}</span>
                      </div>
                      <p className="text-base text-slate-700 font-bold truncate mt-1">
                        {firstItemName} {totalItems > 1 && <span className="text-slate-500 font-normal">+{totalItems - 1} item lainnya</span>}
                      </p>
                      <div className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                        <span>Pemohon: <span className="font-bold text-slate-700">{group.requestedBy}</span></span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-slate-400">{group.requestDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    <div className="text-right hidden sm:block mr-4">
                      <p className="text-xs text-slate-500 mb-1">Total Biaya</p>
                      <p className="font-bold text-slate-900 font-mono">Rp {totalCost.toLocaleString('id-ID')}</p>
                    </div>
                    {getStatusBadge(group.status)}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedPo(isExpanded ? null : group.poNo);
                      }}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 font-bold rounded-lg text-xs transition-colors border border-slate-200"
                    >
                      {isExpanded ? 'Tutup' : 'Inspect'}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-4 border-t border-slate-100 bg-slate-50/50">
                    
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detail Barang:</h4>
                      
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const { generateProcurementPDFBlob } = await import('@/src/lib/pdfGenerator');
                          const relatedPRs = procurementRequests.filter(p => p.poNo === group.poNo && p.status !== 'Reject');
                          const url = generateProcurementPDFBlob(relatedPRs.length > 0 ? relatedPRs : group.items);
                          window.open(url, '_blank');
                          setTimeout(() => URL.revokeObjectURL(url), 60000);
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg text-xs transition-colors shadow-xs flex items-center space-x-1.5 border border-blue-200"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Lihat Form PO</span>
                      </button>
                    </div>

                    <div className="space-y-3 mb-6">
                      {group.items.map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-4 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-800 text-sm truncate">{item.toolName}</h4>
                              {item.isNonStandard && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-100 text-indigo-700 rounded-md uppercase border border-indigo-200 shrink-0">
                                  Non-Standard
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 truncate" title={item.reason}>{item.reason}</p>
                          </div>
                          
                          <div className="text-right px-4 border-r border-slate-100">
                            <p className="text-[10px] text-slate-400 mb-0.5">Subtotal</p>
                            <p className="text-sm font-bold text-slate-700 font-mono">Rp {item.estimatedCost.toLocaleString('id-ID')}</p>
                          </div>

                          <div className="shrink-0 text-center w-20">
                            <span className="text-sm font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg font-mono block">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions Panel */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Aksi untuk PO <span className="font-bold text-slate-800">{group.poNo}</span></p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {group.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleUpdatePOStatus(group.items, 'Accept')}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors"
                            >
                              Terima PO
                            </button>
                            <button
                              onClick={() => handleUpdatePOStatus(group.items, 'Reject')}
                              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg text-xs shadow-xs transition-colors"
                            >
                              Tolak PO
                            </button>
                          </>
                        )}

                        {group.status === 'Accept' && (
                          <button
                            onClick={() => handleUpdatePOStatus(group.items, 'On going')}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs shadow-xs transition-colors"
                          >
                            Proses Pemesanan
                          </button>
                        )}

                        {group.status === 'On going' && (
                          <button
                            onClick={() => handleUpdatePOStatus(group.items, 'Sudah sampai')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
                          >
                            <PackageCheck className="w-4 h-4" />
                            <span>Tandai Sudah Sampai</span>
                          </button>
                        )}

                        {group.status === 'Sudah sampai' && (
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Selesai</span>
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1">*Update stok master data dilakukan manual via Add Tools</span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
