'use client';

import React from 'react';
import { UserCheck } from 'lucide-react';
import { DUMMY_APPROVERS } from '@/src/lib/mock';

interface ApproverSelectionProps {
  selectedApprover: string;
  setSelectedApprover: (id: string) => void;
  disabled?: boolean;
}

export const ApproverSelection: React.FC<ApproverSelectionProps> = ({ 
  selectedApprover, 
  setSelectedApprover,
  disabled = false
}) => {
  return (
    <div className={disabled ? 'opacity-50 pointer-events-none transition-opacity' : 'opacity-100 transition-opacity'}>
      <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-200 mt-6">
        <div className="p-4 bg-red-100 text-red-600 rounded-xl">
          <UserCheck className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 text-2xl">Langkah 2: Pilih Approver <span className="text-red-500">*</span></h3>
          <p className="text-base text-slate-500 mt-1">Pilih atasan atau manager yang akan menyetujui pengajuan ini.</p>
        </div>
      </div>

      <div className="overflow-hidden border border-slate-200 rounded-xl">
        <table className="w-full text-left text-lg">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="p-5">Pilih</th>
              <th className="p-5">Nama Approver</th>
              <th className="p-5">Jabatan</th>
              <th className="p-5">Departemen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {DUMMY_APPROVERS.map(approver => (
              <tr 
                key={approver.id} 
                className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedApprover === approver.id ? 'bg-red-50/50' : ''}`} 
                onClick={() => setSelectedApprover(approver.id)}
              >
                <td className="p-5 text-center w-14">
                  <input 
                    type="radio" 
                    name="approver" 
                    checked={selectedApprover === approver.id} 
                    onChange={() => setSelectedApprover(approver.id)}
                    className="w-6 h-6 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                </td>
                <td className="p-5 font-bold text-slate-900">{approver.name}</td>
                <td className="p-5 text-slate-600">{approver.role}</td>
                <td className="p-5 text-slate-600">{approver.department}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
