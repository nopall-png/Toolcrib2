import React, { useState } from 'react';
import { UserRequest, ToolItem } from '@/src/lib/mock';
import { useAppStore } from '@/src/lib/store';
import { UserRequestItemRow } from './UserRequestItemRow';

interface UserRequestCardProps {
  req: UserRequest;
  tools: ToolItem[];
  onOpenReject: (reqId: string, itemToolId?: string) => void;
}

export const UserRequestCard: React.FC<UserRequestCardProps> = ({ req, tools, onOpenReject }) => {
  const { updateUserRequestStatus, updateUserRequestItemStatus } = useAppStore();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // If Non-Standard, the whole request is treated as one item
  const handleApproveNonStandard = () => {
    updateUserRequestStatus(req.id, 'Approved');
  };

  const handleApproveItem = (toolId: string) => {
    updateUserRequestItemStatus(req.id, toolId, 'Approved');
  };

  const allItemsApprovedOrRejected = req.items.length > 0 && req.items.every(item => item.status === 'Approved' || item.status === 'Rejected');

  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col hover:border-slate-300 transition-colors">
      
      {/* Card Header (Request Info) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-bold text-slate-900 text-lg">{req.userName}</h3>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                req.status === 'Pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                req.status === 'Rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              {req.status === 'Issued' || req.status === 'Returned' || req.status === 'Approved' ? 'APPROVED' : req.status}
            </span>
            {req.isNonStandard && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-md uppercase border border-indigo-200">
                Non-Standard
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 font-medium">Divisi: <span className="text-slate-700">{req.department}</span></p>
          <div className="flex items-center space-x-3 mt-1.5 text-xs text-slate-400">
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
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-6 rounded-md transition-all shadow-sm"
            >
              Tandai Barang Diambil
            </button>
          )}
          {(req.status === 'Issued' || req.status === 'Returned') && (
            <div className="py-2 px-6 bg-slate-100 border border-slate-200 rounded-md">
              <span className="text-xs font-bold text-slate-500">
                {req.status === 'Issued' ? 'SUDAH DIAMBIL' : 'SELESAI (DIKEMBALIKAN)'}
              </span>
            </div>
          )}
          {req.status === 'Rejected' && (
            <div className="py-2 px-6 bg-rose-50 border border-rose-100 rounded-md">
              <span className="text-xs font-bold text-rose-600">DITOLAK SEPENUHNYA</span>
            </div>
          )}
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-slate-50 rounded-md p-3 sm:p-4 border border-slate-100">
        <div 
          className="flex items-center justify-between cursor-pointer group mb-3"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <p className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors uppercase tracking-wider">
            Daftar Barang ({req.isNonStandard ? 1 : req.items.length})
          </p>
          <span className="text-[10px] text-slate-500 font-medium group-hover:text-slate-700 bg-white px-2.5 py-1 border border-slate-200 rounded">
            {isExpanded ? 'Tutup Detail ▲' : 'Lihat Detail ▼'}
          </span>
        </div>

        {isExpanded && (
          <div className="space-y-3 animate-fadeIn">
            {req.isNonStandard ? (
              // Non Standard Request Render
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="w-16 h-16 rounded-md bg-slate-100 border border-slate-200 shrink-0 overflow-hidden">
                   {req.nonStandardDetails?.imageUrl ? (
                     <img src={req.nonStandardDetails.imageUrl} alt="tool" className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-[10px] text-slate-400 flex h-full items-center justify-center">N/A</span>
                   )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800">{req.nonStandardDetails?.toolName}</h4>
                  <p className="text-xs text-slate-500 mt-1">Vendor: {req.nonStandardDetails?.vendorName}</p>
                  <p className="text-xs text-slate-500">Approver: {req.nonStandardDetails?.approver}</p>
                </div>
                <div className="shrink-0 flex items-center justify-end sm:border-l border-slate-100 sm:pl-4">
                  {req.status === 'Pending' ? (
                     <div className="flex gap-2">
                        <button
                          onClick={handleApproveNonStandard}
                          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-md border border-emerald-200"
                        >
                          ACC Request
                        </button>
                        <button
                          onClick={() => onOpenReject(req.id)}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-semibold rounded-md border border-rose-200"
                        >
                          Tolak
                        </button>
                     </div>
                  ) : (
                     <span className="text-xs font-bold text-slate-400 italic">Telah Diproses</span>
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
                  />
                );
              })
            )}

            {/* Notes */}
            {req.notes && (
              <div className="mt-4 bg-white p-3 rounded-md border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Catatan Pemohon:</span>
                <p className="text-sm text-slate-600 mt-1 italic">"{req.notes}"</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
