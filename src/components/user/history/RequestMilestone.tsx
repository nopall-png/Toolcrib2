'use client';

import React from 'react';
import { Check, Clock, X } from 'lucide-react';
import { UserRequest } from '@/src/lib/mock';

interface RequestMilestoneProps {
  status: UserRequest['status'];
}

export const RequestMilestone: React.FC<RequestMilestoneProps> = ({ status }) => {
  // Define steps
  const steps = [
    { label: 'Diajukan', key: 'step1' },
    { label: status === 'Cancelled' ? 'Batal Diambil' : 'Diproses', key: 'step2' },
    { label: status === 'Rejected' ? 'Ditolak' : (status === 'Returned' ? 'Dikembalikan' : 'Diserahkan'), key: 'step3' }
  ];

  // Determine current step index based on status
  let currentStepIndex = 0;
  let isRejected = status === 'Rejected';
  let isCancelled = status === 'Cancelled';
  let isReturned = status === 'Returned';
  let isIssued = status === 'Issued';

  if (status === 'Pending') {
    currentStepIndex = 0;
  } else if (status === 'Approved' || status === 'Cancelled') {
    currentStepIndex = 1;
  } else if (status === 'Issued' || status === 'Returned' || status === 'Rejected') {
    currentStepIndex = 2;
  }

  return (
    <div className="w-full py-4 relative">
      {/* Background Line */}
      <div className="absolute top-7 left-[10%] right-[10%] h-1 bg-slate-200 rounded-full" />

      {/* Progress Line */}
      <div 
        className={`absolute top-7 left-[10%] h-1 rounded-full transition-all duration-500 ${isRejected || isCancelled ? 'bg-red-500' : 'bg-emerald-500'}`}
        style={{ width: currentStepIndex === 0 ? '0%' : currentStepIndex === 1 ? '40%' : '80%' }}
      />

      <div className="flex justify-between relative z-10">
        {steps.map((step, index) => {
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          // Icon mapping
          let Icon = Clock;
          if (isActive) {
            Icon = Check;
          }
          if (isCurrent && isRejected && index === 2) {
            Icon = X;
          }
          if (isCurrent && isCancelled && index === 1) {
            Icon = X;
          }

          let bgColor = isActive ? ((isRejected && index === 2) || (isCancelled && index === 1) ? 'bg-red-500' : 'bg-emerald-500') : 'bg-slate-200';
          let textColor = isActive ? ((isRejected && index === 2) || (isCancelled && index === 1) ? 'text-red-700' : 'text-emerald-700') : 'text-slate-400';
          let iconColor = isActive ? 'text-white' : 'text-slate-400';
          
          return (
            <div key={step.key} className="flex flex-col items-center w-1/3">
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm ${bgColor} ${isCurrent ? 'ring-4 ring-slate-50 scale-110' : ''}`}
              >
                <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
              </div>
              <span className={`text-[10px] font-bold mt-2 text-center ${textColor}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
