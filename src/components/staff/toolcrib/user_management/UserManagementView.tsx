'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { Users, Building, Plus, User, IdCard, X, Minus } from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const { departments, users, addUser, removeUser } = useAppStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmpId, setNewUserEmpId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || '');
  const [isDeptLocked, setIsDeptLocked] = useState(false);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmpId.trim() || !selectedDeptId) return;

    addUser({
      name: newUserName.trim(),
      employeeId: newUserEmpId.trim(),
      departmentId: selectedDeptId,
    });

    setNewUserName('');
    setNewUserEmpId('');
    setIsAddModalOpen(false);
    alert('User berhasil didaftarkan!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Akses User</h2>
          <p className="text-base text-slate-500 font-medium mt-1">Kelola daftar karyawan yang berhak mengakses sistem Toolcrib.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="p-4 bg-red-100 text-red-600 rounded-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total User</p>
            <p className="text-4xl font-black text-slate-900">{users.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-xl">
            <Building className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Divisi</p>
            <p className="text-4xl font-black text-slate-900">{departments.length}</p>
          </div>
        </div>
      </div>

      {/* Divisi & Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const deptUsers = users.filter((u) => u.departmentId === dept.id);

          return (
            <div key={dept.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xl">{dept.name}</h3>
                  <p className="text-sm text-slate-500 font-mono mt-1.5">{dept.code}</p>
                </div>
                <span className="bg-slate-200 text-slate-600 px-4 py-2 rounded-full text-base font-bold">
                  {deptUsers.length} User
                </span>
              </div>
              <div className="p-5 flex-1 overflow-y-auto max-h-80 space-y-3 bg-slate-50/30">
                {deptUsers.length === 0 ? (
                  <p className="text-center text-base text-slate-400 py-4 italic">Belum ada user terdaftar.</p>
                ) : (
                  deptUsers.map((user) => (
                    <div key={user.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-xs hover:border-slate-300 transition-all">
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <User className="w-6 h-6 text-slate-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-bold text-slate-900 truncate">{user.name}</p>
                          <p className="text-sm text-slate-500 font-mono mt-1">{user.employeeId}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm(`Hapus ${user.name} dari divisi ini?`)) {
                            removeUser(user.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all shrink-0 ml-3"
                        title="Hapus User"
                      >
                        <Minus className="w-6 h-6" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-white">
                <button
                  onClick={() => {
                    setSelectedDeptId(dept.id);
                    setIsDeptLocked(true);
                    setIsAddModalOpen(true);
                  }}
                  className="w-full py-3.5 text-base font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-dashed border-red-200"
                >
                  + Tambah User di {dept.code}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
              <h3 className="font-bold text-slate-900 text-xl">Daftarkan User Baru</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Divisi / Departemen</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                    isDeptLocked ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'cursor-pointer'
                  }`}
                  required
                  disabled={isDeptLocked}
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Lengkap User</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    required
                  />
                  <User className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">ID Karyawan / Badge ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newUserEmpId}
                    onChange={(e) => setNewUserEmpId(e.target.value)}
                    placeholder="Contoh: EMP-1234"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    required
                  />
                  <IdCard className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-base transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-base transition-colors shadow-md hover:shadow-lg"
                >
                  Daftarkan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
