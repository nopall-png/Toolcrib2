'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { Building2, Lock, UserCheck, IdCard, ArrowRight } from 'lucide-react';

export const UserLogin: React.FC = () => {
  const { session, departments, users, loginUserStep1, loginUserStep2 } = useAppStore();

  // Step 1 State
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || '');
  const [password, setPassword] = useState('user123'); // default mock pass for easy testing
  const [errorMsg, setErrorMsg] = useState('');

  // Step 2 State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [step2Error, setStep2Error] = useState('');

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedDeptId) {
      setErrorMsg('Pilih departemen terlebih dahulu.');
      return;
    }

    const res = loginUserStep1(selectedDeptId, password);
    if (!res.success) {
      setErrorMsg(res.message || 'Login gagal');
    }
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep2Error('');

    if (!selectedUserId) {
      setStep2Error('Pilih identitas Anda dari daftar.');
      return;
    }

    loginUserStep2(selectedUserId);
  };

  // Get users for selected department
  const deptUsers = users.filter((u) => u.departmentId === session.department?.id);

  // Render Step 2: Verification Form (Nama & ID)
  if (session.role === 'USER' && !session.isVerified) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 transition-all">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Verifikasi Identitas User</h2>
            <p className="text-xs text-slate-500 font-medium">
              Departemen: <span className="text-red-600 font-semibold">{session.department?.name}</span>
            </p>
          </div>
        </div>

        {step2Error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {step2Error}
          </div>
        )}

        <form onSubmit={handleStep2Submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Identitas Anda</label>
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>-- Pilih Nama Anda --</option>
                {deptUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.employeeId})
                  </option>
                ))}
              </select>
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>
          
          {deptUsers.length === 0 && (
            <p className="text-[11px] text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
              Belum ada user terdaftar di divisi ini. Silakan hubungi Admin Toolcrib.
            </p>
          )}

          <button
            type="submit"
            className="w-full red-gradient-btn text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-sm shadow-md"
          >
            <span>Masuk ke Katalog Barang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  // Step 1 Form: Departemen & Password
  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
        <div className="p-3 bg-red-100 text-red-600 rounded-xl">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Login User</h2>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleStep1Submit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Departemen</label>
          <div className="relative">
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all appearance-none cursor-pointer"
            >
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  [{dept.code}] {dept.name}
                </option>
              ))}
            </select>
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
          <div className="relative">
            <input
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
              required
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>
        </div>

        <button
          type="submit"
          className="w-full red-gradient-btn text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-sm shadow-md"
        >
          <span>Lanjut ke Verifikasi</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
