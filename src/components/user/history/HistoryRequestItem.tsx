'use client';

import React, { useState } from 'react';
import { FileText, PackageCheck, RotateCcw, XCircle, Clock, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { UserRequest, ToolItem } from '@/src/lib/mock';
import { RequestMilestone } from './RequestMilestone';

interface HistoryRequestItemProps {
  request: UserRequest;
  tools: ToolItem[];
}

export const HistoryRequestItem: React.FC<HistoryRequestItemProps> = ({ request, tools }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getToolImage = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    return tool?.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=60';
  };

  const statusColors: Record<string, string> = {
    'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
    'Approved': 'bg-blue-100 text-blue-800 border-blue-200',
    'Issued': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Returned': 'bg-slate-100 text-slate-700 border-slate-300',
    'Rejected': 'bg-red-100 text-red-800 border-red-200'
  };

  // Determine preview image
  const previewImage = request.isNonStandard 
    ? request.nonStandardDetails?.imageUrl 
    : (request.items.length > 0 ? getToolImage(request.items[0].toolId) : null);

  const totalItems = request.isNonStandard ? 1 : request.items.length;
  const firstItemName = request.isNonStandard 
    ? request.nonStandardDetails?.toolName 
    : (request.items.length > 0 ? request.items[0].toolName : '');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-all overflow-hidden">
      {/* Minimized / Header Area (Clickable to expand) */}
      <div 
        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Preview Image */}
          <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
            {previewImage ? (
              <img src={previewImage} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <span className="text-[10px] text-slate-400">No Img</span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 text-sm">{request.requestNo}</span>
              {request.isNonStandard && (
                <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-wider hidden sm:inline-block">Non-Standard</span>
              )}
            </div>
            <p className="text-xs text-slate-700 font-bold truncate mt-0.5">
              {firstItemName} {totalItems > 1 && <span className="text-slate-500 font-normal">+{totalItems - 1} item lainnya</span>}
            </p>
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">{request.requestDate}</span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-4">
          <span
            className={`inline-flex items-center space-x-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColors[request.status] || 'bg-slate-100'}`}
          >
            {request.status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
            {request.status === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {request.status === 'Issued' && <PackageCheck className="w-3.5 h-3.5" />}
            {request.status === 'Returned' && <RotateCcw className="w-3.5 h-3.5" />}
            {request.status === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
            <span>{request.status}</span>
          </span>
          <div className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-lg transition-colors">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Area: Details & Milestone */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50">
          

          {/* Full Items List */}
          <div className="space-y-3 mb-6">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detail Barang:</h4>
            {request.isNonStandard ? (
              <div className="flex items-center space-x-4 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate">{request.nonStandardDetails?.toolName}</h4>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">Vendor: {request.nonStandardDetails?.vendorName} • Approver: {request.nonStandardDetails?.approver}</p>
                  <div className="mt-1">
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      1 Unit (Custom)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              request.items.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-4 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{item.toolName}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.toolCode}</p>
                  </div>
                  <div className="shrink-0">
                    <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Milestone Progress */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status Progress:</h4>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <RequestMilestone status={request.status} />
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
