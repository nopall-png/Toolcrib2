import React, { useState } from 'react';
import { UserRequest, ToolItem } from '@/src/lib/mock';
import { useAppStore } from '@/src/lib/store';
import { UserRequestItemRow } from './UserRequestItemRow';
import { FileText, ChevronDown, Package, MessageSquare, Wrench, XCircle, CheckCircle2 } from 'lucide-react';

interface UserRequestCardProps {
  req: UserRequest;
  tools: ToolItem[];
  onOpenReject: (reqId: string, itemToolId?: string) => void;
}

export const UserRequestCard: React.FC<UserRequestCardProps> = ({ req, tools, onOpenReject }) => {
  const { updateUserRequestStatus, updateUserRequestItemStatus, isProcessingRPC, approveNonStandardRequest, session } = useAppStore();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState<boolean>(false);

  React.useEffect(() => {
    if (isExpanded && req.items.length > 0) {
      import('@/src/lib/pdfGenerator').then(({ generateRequestPDFBlob }) => {
        const url = generateRequestPDFBlob(req.items, tools, req.userName, req.requestNo);
        setPdfUrl(url);
      });
    }
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [isExpanded, req, tools]);

  const [isApproving, setIsApproving] = useState(false);

  // If Non-Standard, the whole request is treated as one item
  const handleApproveNonStandard = async () => {
    setIsApproving(true);
    let token = session?.access_token || '';
    
    // Fallback: Jika user belum relogin (sehingga token di state kosong),
    // kita tarik paksa token yang tersimpan di local Supabase client.
    if (!token) {
      try {
        const { supabase } = await import('@/src/lib/supabase');
        const { data: { session: sbSession } } = await supabase.auth.getSession();
        if (sbSession?.access_token) {
          token = sbSession.access_token;
        }
      } catch (e) {
        console.error("Gagal mendapatkan token fallback:", e);
      }
    }
    
    if (!token) {
      alert("Sesi Anda tidak valid. Mohon LOG OUT dan LOG IN kembali.");
      setIsApproving(false);
      return;
    }

    await approveNonStandardRequest(req.id, token);
    setIsApproving(false);
  };

  const handleApproveItem = (toolId: string) => {
    updateUserRequestItemStatus(req.id, toolId, 'Approved');
  };

  const allItemsApprovedOrRejected = req.items.length > 0 && req.items.every(item => item.status === 'Approved' || item.status === 'Rejected');

  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col hover:border-slate-300 transition-colors">

      {/* Card Header (Request Info) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-100 pb-5 mb-5">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-3">
            <h3 className="font-bold text-slate-900 text-3xl">{req.userName}</h3>
            <span
              className={`px-4 py-1.5 text-sm font-bold rounded-lg uppercase tracking-wider ${req.status === 'Pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                  req.status === 'Rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                    'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
            >
              {req.status === 'Issued' || req.status === 'Returned' || req.status === 'Approved' ? 'APPROVED' : req.status}
            </span>
            {req.isNonStandard && (
              <span className="px-4 py-1.5 text-sm font-bold bg-indigo-100 text-indigo-700 rounded-lg uppercase border border-indigo-200">
                Non-Standard
              </span>
            )}
          </div>
          <p className="text-xl text-slate-500 font-medium">Divisi: <span className="text-slate-700">{req.department}</span></p>
          <div className="flex items-center space-x-4 mt-3 text-base text-slate-400">
            <span>No: {req.requestNo}</span>
            <span>•</span>
            <span>{req.requestDate}</span>
          </div>
        </div>

        {/* Global Action for Entire Request (if already approved/issued) */}
        <div className="shrink-0 flex items-center justify-end">
          {req.status === 'Approved' && (
            <button
              onClick={() => updateUserRequestStatus(req.id, 'Issued')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 px-8 rounded-2xl transition-all shadow-md"
            >
              Tandai Barang Diambil
            </button>
          )}
          {(req.status === 'Issued' || req.status === 'Returned') && (
            <div className="py-4 px-8 bg-slate-100 border border-slate-200 rounded-2xl">
              <span className="text-base font-bold text-slate-500">
                {req.status === 'Issued' ? 'SUDAH DIAMBIL' : 'SELESAI (DIKEMBALIKAN)'}
              </span>
            </div>
          )}
          {req.status === 'Rejected' && (
            <div className="py-4 px-8 bg-rose-50 border border-rose-100 rounded-2xl">
              <span className="text-base font-bold text-rose-600">DITOLAK SEPENUHNYA</span>
            </div>
          )}
          {req.status === 'Cancelled' && (
            <div className="py-2 px-6 bg-slate-100 border border-slate-200 rounded-md">
              <span className="text-xs font-bold text-slate-500">BATAL DIAMBIL</span>
            </div>
          )}
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-100">
        <div
          className="flex items-center justify-between cursor-pointer group mb-5"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <p className="text-lg font-bold text-slate-600 group-hover:text-slate-800 transition-colors uppercase tracking-wider">
            Daftar Barang ({req.isNonStandard ? 1 : req.items.length})
          </p>
          <span className="text-base text-slate-500 font-medium group-hover:text-slate-700 bg-white px-4 py-2 border border-slate-200 rounded-lg">
            {isExpanded ? 'Tutup Detail ▲' : 'Lihat Detail ▼'}
          </span>
        </div>

        {isExpanded && (
          <div className="space-y-3 animate-fadeIn">
            {req.isNonStandard ? (
              // Non Standard Request Render
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="w-24 h-24 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden">
                  {req.nonStandardDetails?.imageUrl ? (
                    <img src={req.nonStandardDetails.imageUrl} alt="tool" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm text-slate-400 flex h-full items-center justify-center">N/A</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-xl">{req.nonStandardDetails?.toolName}</h4>
                  <p className="text-base text-slate-500 mt-2">Vendor: {req.nonStandardDetails?.vendorName}</p>
                  <p className="text-base text-slate-500 mt-1">Approver: {req.nonStandardDetails?.approver}</p>
                </div>
                <div className="shrink-0 flex items-center justify-end sm:border-l border-slate-100 sm:pl-6">
                  {req.status === 'Pending' ? (
                    <div className="flex gap-3">
                      <button
                        onClick={handleApproveNonStandard}
                        disabled={isApproving}
                        className={`px-6 py-3 text-lg font-semibold rounded-lg border ${isApproving ? 'bg-emerald-100 text-emerald-500 border-emerald-200 cursor-not-allowed' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'}`}
                      >
                        {isApproving ? 'Loading...' : 'ACC Request'}
                      </button>
                      <button
                        onClick={() => onOpenReject(req.id)}
                        className="px-6 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-lg font-semibold rounded-lg border border-rose-200"
                      >
                        Tolak
                      </button>
                    </div>
                  ) : (
                    <span className="text-base font-bold text-slate-400 italic">Telah Diproses</span>
                  )}
                </div>
              </div>
            ) : (
              // Standard Items
              req.items.map((item, idx) => {
                const originalTool = tools.find((t) => t.id === item.toolId);
                return (
                  <UserRequestItemRow
                    key={`${item.toolId}-${idx}`}
                    item={item}
                    toolDetails={originalTool}
                    onApprove={() => handleApproveItem(item.toolId)}
                    onReject={() => onOpenReject(req.id, item.toolId)}
                    isParentPending={req.status === 'Pending' && !allItemsApprovedOrRejected}
                    disabled={isProcessingRPC}
                  />
                );
              })
            )}
          </div>
        )}

        {/* PDF Preview */}
        {!req.isNonStandard && pdfUrl && (
          <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div 
              className="bg-slate-50 hover:bg-slate-100 cursor-pointer border-b border-slate-200 p-4 px-5 flex items-center justify-between transition-colors"
              onClick={() => setShowPdf(!showPdf)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Formulir Pesanan (PDF)</h4>
                  <p className="text-xs text-slate-500 font-medium">Klik untuk {showPdf ? 'menyembunyikan' : 'melihat'} dokumen request barang</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <a 
                  href={pdfUrl} 
                  download={`Request_${req.requestNo}.pdf`} 
                  onClick={(e) => e.stopPropagation()} 
                  className="text-sm font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 bg-white px-4 py-2 rounded-lg border border-indigo-200 transition-all shadow-sm"
                >
                  Download
                </a>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showPdf ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            {showPdf && (
              <div className="h-[500px] border-t border-slate-200">
                <iframe src={pdfUrl} className="w-full h-full bg-white" title="PDF Preview" />
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
