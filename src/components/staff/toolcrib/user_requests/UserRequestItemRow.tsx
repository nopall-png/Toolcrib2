import React from 'react';
import { UserRequestItem, ToolItem } from '@/src/lib/mock';
import { CheckCircle2, XCircle } from 'lucide-react';

interface UserRequestItemRowProps {
  item: UserRequestItem;
  toolDetails?: ToolItem;
  onApprove: () => void;
  onReject: () => void;
  isParentPending: boolean;
  disabled?: boolean;
}

export const UserRequestItemRow: React.FC<UserRequestItemRowProps> = ({ 
  item, 
  toolDetails, 
  onApprove, 
  onReject,
  isParentPending,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 space-x-0 sm:space-x-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
      
      {/* Tool Info */}
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {toolDetails ? (
          <img
            src={toolDetails.imageUrl}
            alt={toolDetails.name}
            className="w-20 h-20 rounded-lg object-cover border border-slate-200 shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <span className="text-sm text-slate-400">N/A</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-slate-800 line-clamp-1">{item.toolName}</p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-base text-slate-500 font-mono">{item.toolCode}</p>
            <span className="text-base font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-md">
              {item.quantity} {item.unit}
            </span>
          </div>
          {item.rejectionReason && (
            <p className="text-sm text-red-600 mt-2 italic">
              Alasan: {item.rejectionReason}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons / Status */}
      <div className="shrink-0 flex items-center justify-end border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
        {item.status === 'Approved' ? (
          <span className="inline-flex items-center space-x-2 text-base font-bold px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
            <span>Approved</span>
          </span>
        ) : item.status === 'Rejected' ? (
          <span className="inline-flex items-center space-x-2 text-base font-bold px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
            <XCircle className="w-5 h-5" />
            <span>Rejected</span>
          </span>
        ) : isParentPending ? (
          <div className="flex gap-3">
            <button
              onClick={onApprove}
              className="px-6 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-lg font-semibold rounded-lg border border-emerald-200 transition-colors"
            >
              {disabled ? 'Memproses...' : 'Approve'}
            </button>
            <button
              onClick={onReject}
              className="px-6 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-lg font-semibold rounded-lg border border-rose-200 transition-colors"
            >
              Tolak
            </button>
          </div>
        ) : (
          <span className="text-base text-slate-400 font-semibold italic">
            Menunggu
          </span>
        )}
      </div>

    </div>
  );
};
