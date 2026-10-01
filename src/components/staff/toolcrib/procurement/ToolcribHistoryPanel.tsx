'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { Search, CheckCircle2, PackageCheck, Clock, XCircle, FileText, X } from 'lucide-react';
import { ProcurementMilestone } from './ProcurementMilestone';

export const ToolcribHistoryPanel: React.FC = () => {
  const { procurementRequests } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
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

  const getGroupStatus = (items: typeof procurementRequests) => {
    if (items.length === 0) return 'Pending';
    if (items.every(i => i.status === 'Reject' || i.status === 'Rejected')) return 'Reject';
    if (items.some(i => i.status === 'Pending')) return 'Pending';
    if (items.every(i => i.status === 'Sudah sampai' || i.status === 'Reject' || i.status === 'Rejected')) return 'Sudah sampai';
    if (items.some(i => i.status === 'On going')) return 'On going';
    if (items.some(i => i.status === 'Accept')) return 'Accept';
    return items[0].status;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sudah sampai':
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-4 h-4" /><span>Selesai</span></span>;
      case 'On going':
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-800"><PackageCheck className="w-4 h-4" /><span>Dalam Pengiriman</span></span>;
      case 'Accept':
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-800"><span>Disetujui Sebagian / Penuh</span></span>;
      case 'Pending':
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-bold bg-amber-100 text-amber-800 animate-pulse"><Clock className="w-4 h-4" /><span>Menunggu Persetujuan</span></span>;
      case 'Reject':
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

      {/* History Grouped Cards */}
      <div className="space-y-4">
        {groupedPrs.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-base shadow-xs">
            Belum ada riwayat pembelian barang.
          </div>
        ) : (
          groupedPrs.map((group) => {
            const isExpanded = expandedPo === group.poNo;
            const totalItems = group.items.length;
            const firstItemName = group.items[0].toolName;
            
            const activeItems = group.items.filter(i => i.status !== 'Reject' && i.status !== 'Rejected');
            const totalCost = activeItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

            return (
              <div key={group.poNo} className="bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all overflow-hidden">
                {/* Header / Minimized State */}
                <div 
                  className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedPo(isExpanded ? null : group.poNo)}
                >
                  <div className="flex items-center space-x-5 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <span className="font-extrabold text-blue-700 text-xl font-mono bg-blue-50 px-3 py-1 rounded-lg">{group.poNo}</span>
                      </div>
                      <p className="text-lg text-slate-700 font-bold truncate mt-2">
                        {firstItemName} {totalItems > 1 && <span className="text-slate-500 font-normal">+{totalItems - 1} item lainnya</span>}
                      </p>
                      <div className="text-sm text-slate-500 mt-1.5 flex items-center space-x-2">
                        <span>Pemohon: <span className="font-bold text-slate-700">{group.requestedBy}</span></span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-slate-400">{group.requestDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    <div className="text-right hidden sm:block mr-4">
                      <p className="text-sm text-slate-500 mb-1">Total Biaya</p>
                      <p className="font-bold text-slate-900 font-mono text-lg">
                        Rp {totalCost.toLocaleString('id-ID')}
                      </p>
                    </div>
                    {getStatusBadge(getGroupStatus(group.items))}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedPo(isExpanded ? null : group.poNo);
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 font-bold rounded-lg text-sm transition-colors border border-slate-200"
                    >
                      {isExpanded ? 'Tutup' : 'Inspect'}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-4 border-t border-slate-100 bg-slate-50/50">
                    
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Detail Barang:</h4>
                      
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const { generateProcurementPDFBlob } = await import('@/src/lib/pdfGenerator');
                          const relatedPRs = group.items.filter(p => p.status !== 'Reject' && p.status !== 'Rejected');
                          const url = generateProcurementPDFBlob(relatedPRs.length > 0 ? relatedPRs : group.items);
                          setPreviewPdfUrl(url);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-lg text-sm transition-colors shadow-sm flex items-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Lihat PDF PO</span>
                      </button>
                    </div>

                    <div className="space-y-3 mb-8">
                      {group.items.map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-4 bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <h4 className="font-bold text-slate-800 text-lg truncate">{item.toolName}</h4>
                              <div className="flex items-center gap-2 shrink-0">
                                {item.isNonStandard && (
                                  <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-md uppercase border border-indigo-200">
                                    Non-Standard
                                  </span>
                                )}
                              </div>
                              {getStatusBadge(item.status)}
                            </div>
                            {item.isNonStandard && item.notes?.vendorName && (
                              <p className="text-sm text-indigo-600 font-medium mt-1">Vendor: {item.notes.vendorName}</p>
                            )}
                            <p className="text-sm text-slate-500 mt-1 truncate" title={item.reason}>{item.reason}</p>
                          </div>
                          
                          <div className="text-right px-6 border-r border-slate-100">
                            <p className="text-xs text-slate-400 mb-1">Subtotal</p>
                            <p className="text-lg font-bold text-slate-700 font-mono">Rp {(item.estimatedCost || 0).toLocaleString('id-ID')}</p>
                          </div>

                          <div className="shrink-0 text-center w-24">
                            <span className="text-base font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg font-mono block">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Milestone Progress */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Status Progress:</h4>
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                        {/* Use dynamic import for Milestone or require it at top level */}
                        <ProcurementMilestone status={getGroupStatus(group.items) as any} />
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* PDF Preview Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Preview PDF Purchase Order
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = previewPdfUrl;
                    a.download = `Purchase_Order.pdf`;
                    a.click();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    URL.revokeObjectURL(previewPdfUrl);
                    setPreviewPdfUrl(null);
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <iframe src={previewPdfUrl} className="w-full flex-1 bg-slate-100" title="PDF Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

