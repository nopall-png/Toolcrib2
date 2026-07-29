'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { Building2, Lock, UserCheck, IdCard, ArrowRight } from 'lucide-react';

export const UserLogin: React.FC = () => {
  const { session, departments, users, loginUserStep1, loginUserStep2 } = useAppStore();

  // Step 1 State
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || '');
  const [password, setPassword] = useState('divisi123'); // default mock pass for easy testing
  const [errorMsg, setErrorMsg] = useState('');

  // Sync selectedDeptId if departments load late
  React.useEffect(() => {
    if (!selectedDeptId && departments.length > 0) {
      setSelectedDeptId(departments[0].id);
    }
  }, [departments, selectedDeptId]);

  // Step 2 State
  const [inputEmployeeId, setInputEmployeeId] = useState('EMP-001'); // Default for dev mode

  const handleCombinedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedDeptId || !inputEmployeeId) {
      setErrorMsg('Pilih departemen dan ketik ID Pegawai terlebih dahulu.');
      return;
    }

    const deptUsers = users.filter((u) => u.departmentId === selectedDeptId);
    const matchedUser = deptUsers.find(u => u.employeeId.toUpperCase() === inputEmployeeId.toUpperCase());

    if (!matchedUser) {
      setErrorMsg(`Pegawai dengan ID '${inputEmployeeId}' tidak ditemukan di departemen ini.`);
      return;
    }

    const res = loginUserStep1(selectedDeptId, password);
    if (!res.success) {
      setErrorMsg(res.message || 'Login gagal (Cek password departemen)');
      return;
    }

    // Jika step 1 sukses dan user cocok, langsung jalankan step 2
    loginUserStep2(matchedUser.id);
  };

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

      <form onSubmit={handleCombinedSubmit} className="space-y-4">
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
          <label className="block text-xs font-semibold text-slate-700 mb-1">Identitas (ID Pegawai)</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Contoh: EMP-001"
              value={inputEmployeeId}
              onChange={(e) => setInputEmployeeId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
              required
            />
            <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password Departemen</label>
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
          <span>Masuk ke Katalog Barang</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Cheat Sheet untuk Development */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-bold">
          <UserCheck className="w-3 h-3 text-amber-500" /> Cheat Sheet (Dev Mode)
        </span>
        <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono text-slate-600 space-y-1 border border-slate-200">
          <p><span className="font-bold">Password Dept:</span> divisi123</p>
          <p className="text-[10px] italic mt-1">Pilih Divisi 1 lalu ketik ID EMP-001 untuk testing.</p>
        </div>
      </div>
    </div>
  );
};
