'use client';

import React from 'react';
import { Check, Clock, X, Truck, Package } from 'lucide-react';
import { ProcurementRequest } from '@/src/types';

interface ProcurementMilestoneProps {
  status: ProcurementRequest['status'];
}

export const ProcurementMilestone: React.FC<ProcurementMilestoneProps> = ({ status }) => {
  // Define steps: Pending -> Accept -> On going -> Sudah sampai
  // If Reject, it branches off at step 2.
  const steps = [
    { label: 'Diajukan', key: 'step1' },
    { label: status === 'Reject' ? 'Ditolak' : 'Disetujui', key: 'step2' },
    { label: 'Dikirim', key: 'step3' },
    { label: 'Selesai', key: 'step4' }
  ];

  let currentStepIndex = 0;
  let isRejected = status === 'Reject';

  if (status === 'Pending') {
    currentStepIndex = 0;
  } else if (status === 'Accept' || status === 'Reject') {
    currentStepIndex = 1;
  } else if (status === 'On going') {
    currentStepIndex = 2;
  } else if (status === 'Sudah sampai') {
    currentStepIndex = 3;
  }

  return (
    <div className="w-full py-4 relative">
      {/* Background Line */}
      <div className="absolute top-9 left-[10%] right-[10%] h-2 bg-slate-200 rounded-full" />

      {/* Progress Line */}
      <div 
        className={`absolute top-9 left-[10%] h-2 rounded-full transition-all duration-500 ${isRejected ? 'bg-red-500' : 'bg-emerald-500'}`}
        style={{ width: currentStepIndex === 0 ? '0%' : currentStepIndex === 1 ? '26%' : currentStepIndex === 2 ? '53%' : '80%' }}
      />

      <div className="flex justify-between relative z-10">
        {steps.map((step, index) => {
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          let Icon = Clock;
          if (isActive) {
            Icon = Check;
          }
          if (isCurrent && isRejected && index === 1) {
            Icon = X;
          }
          if (isActive && !isRejected && index === 2) {
            Icon = Truck;
          }
          if (isActive && !isRejected && index === 3) {
            Icon = Package;
          }

          let iconBg = 'bg-slate-100 text-slate-400 border-2 border-white';
          if (isActive) {
            if (isRejected && isCurrent) {
              iconBg = 'bg-red-500 text-white border-4 border-red-100 shadow-md shadow-red-200';
            } else {
              iconBg = 'bg-emerald-500 text-white border-4 border-emerald-100 shadow-md shadow-emerald-200';
            }
          } else if (isCurrent && !isRejected && status === 'Pending') {
              iconBg = 'bg-blue-500 text-white border-4 border-blue-100 shadow-md shadow-blue-200';
          }

          return (
            <div key={step.key} className="flex flex-col items-center w-1/4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${iconBg} ${isCurrent ? 'scale-110' : ''}`}>
                <Icon className={isCurrent ? "w-6 h-6" : "w-5 h-5"} />
              </div>
              <div className="mt-4 text-center">
                <p className={`text-sm font-bold ${isActive ? (isRejected && isCurrent ? 'text-red-600' : 'text-emerald-700') : 'text-slate-500'}`}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
