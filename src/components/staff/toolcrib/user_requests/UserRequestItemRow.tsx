import React from 'react';
import { UserRequestItem, ToolItem } from '@/src/lib/mock';
import { CheckCircle2, XCircle } from 'lucide-react';

interface UserRequestItemRowProps {
  item: UserRequestItem;
  toolDetails?: ToolItem;
  onApprove: () => void;
  onReject: () => void;
  isParentPending: boolean;
}

export const UserRequestItemRow: React.FC<UserRequestItemRowProps> = ({ 
  item, 
  toolDetails, 
  onApprove, 
  onReject,
  isParentPending
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 space-x-0 sm:space-x-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
      
      {/* Tool Info */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {toolDetails ? (
          <img
            src={toolDetails.imageUrl}
            alt={toolDetails.name}
            className="w-12 h-12 rounded-md object-cover border border-slate-200 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
            <span className="text-[10px] text-slate-400">N/A</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.toolName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-slate-500 font-mono">{item.toolCode}</p>
            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
              {item.quantity} {item.unit}
            </span>
          </div>
          {item.rejectionReason && (
            <p className="text-[10px] text-red-600 mt-1 italic">
              Alasan: {item.rejectionReason}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons / Status */}
      <div className="shrink-0 flex items-center justify-end border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3">
        {item.status === 'Approved' ? (
          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved</span>
          </span>
        ) : item.status === 'Rejected' ? (
          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        ) : isParentPending ? (
          <div className="flex gap-1.5">
            <button
              onClick={onApprove}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded border border-emerald-200 transition-colors"
            >
              ACC
            </button>
            <button
              onClick={onReject}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded border border-rose-200 transition-colors"
            >
              Tolak
            </button>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 font-semibold italic">
            Menunggu
          </span>
        )}
      </div>

    </div>
  );
};
