'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { Search, CheckCircle2, PackageCheck, Clock, XCircle, FileText, X } from 'lucide-react';

export const ToolcribHistoryPanel: React.FC = () => {
  const { procurementRequests } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  
  // Filter history based on search query
  const filteredPr = procurementRequests.filter(
    (pr) =>
      pr.poNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.requestedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sudah sampai':
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-4 h-4" /><span>Selesai</span></span>;
      case 'On going':
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-800"><PackageCheck className="w-4 h-4" /><span>Dalam Pengiriman</span></span>;
      case 'Accept':
        return <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-800"><span>Disetujui</span></span>;
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

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 text-left font-bold text-slate-500 w-1/4">NO PO & TANGGAL</th>
                  <th className="p-4 text-left font-bold text-slate-500 w-1/3">NAMA TOOLS</th>
                  <th className="p-4 text-center font-bold text-slate-500 w-1/6">QTY / SATUAN</th>
                  <th className="p-4 text-center font-bold text-slate-500 w-1/6">STATUS</th>
                  <th className="p-4 text-center font-bold text-slate-500 w-1/6">AKSI</th>
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
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-lg">{pr.toolName}</h4>
                      {pr.isNonStandard && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-md uppercase border border-indigo-200 shrink-0">
                          Non-Standard
                        </span>
                      )}
                    </div>
                    {pr.isNonStandard && pr.notes?.vendorName && (
                      <p className="text-sm text-indigo-600 font-medium mt-1">Vendor: {pr.notes.vendorName}</p>
                    )}
                    <p className="text-sm text-slate-400 mt-1">Pemohon: {pr.requestedBy}</p>
                  </td>

                  <td className="p-6 text-center font-bold text-slate-900 text-xl font-mono">
                    {pr.quantity} {pr.unit}
                  </td>

                  <td className="p-6 text-center">
                    {getStatusBadge(pr.status)}
                  </td>
                  <td className="p-6 text-center">
                    {pr.status === 'Sudah sampai' && (
                      <button
                        onClick={async () => {
                          const { generateProcurementPDFBlob } = await import('@/src/lib/pdfGenerator');
                          const relatedPRs = procurementRequests.filter(p => p.poNo === pr.poNo && p.status !== 'Reject');
                          const url = generateProcurementPDFBlob(relatedPRs.length > 0 ? relatedPRs : [pr]);
                          setPreviewPdfUrl(url);
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg text-sm transition-colors border border-blue-200 flex items-center space-x-1.5 mx-auto"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Lihat PDF</span>
                      </button>
                    )}
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
