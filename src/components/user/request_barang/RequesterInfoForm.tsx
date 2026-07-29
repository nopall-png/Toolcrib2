'use client';

import React from 'react';
import { User } from 'lucide-react';
import { useAppStore } from '@/src/lib/store';

interface RequesterInfoFormProps {
  requesterName: string;
  setRequesterName: (name: string) => void;
}

export const RequesterInfoForm: React.FC<RequesterInfoFormProps> = ({ requesterName, setRequesterName }) => {
  const { session } = useAppStore();

  return (
    <div>
      <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-200">
        <div className="p-4 bg-red-100 text-red-600 rounded-xl">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 text-2xl">Langkah 1: Identitas Pemohon <span className="text-red-500">*</span></h3>
          <p className="text-base text-slate-500 mt-1">Pastikan data diri Anda sesuai sebelum mengajukan barang.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="space-y-3 md:col-span-3">
          <label className="block text-lg font-bold text-slate-700">Nama Lengkap <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Masukkan Nama Anda"
          />
        </div>

        <div className="space-y-3 md:col-span-1">
          <label className="block text-lg font-bold text-slate-700">ID Karyawan</label>
          <input
            type="text"
            value={session.employeeId || ''}
            disabled
            className="w-full p-4 bg-slate-100 border border-slate-200 rounded-xl text-lg text-slate-500 cursor-not-allowed"
          />
        </div>

        <div className="space-y-3 md:col-span-2">
          <label className="block text-lg font-bold text-slate-700">Departemen / Divisi</label>
          <input
            type="text"
            value={session.department?.name || ''}
            disabled
            className="w-full p-4 bg-slate-100 border border-slate-200 rounded-xl text-lg text-slate-500 cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
};
