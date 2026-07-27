'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { ShieldAlert, Wrench, ShoppingBag, Lock, ArrowRight, Sparkles } from 'lucide-react';

export const StaffLogin: React.FC = () => {
  const { loginStaff } = useAppStore();
  const [activeTab, setActiveTab] = useState<'TOOLCRIB' | 'PROCUREMENT'>('TOOLCRIB');
  const [username, setUsername] = useState('admin.toolcrib');
  const [password, setPassword] = useState('admin123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginStaff(activeTab);
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
        <div className="p-3 bg-slate-900 text-white rounded-xl shadow-sm">
          <ShieldAlert className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Login Staff</h2>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => {
            setActiveTab('TOOLCRIB');
            setUsername('admin.toolcrib');
          }}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'TOOLCRIB'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Toolcrib Staff</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('PROCUREMENT');
            setUsername('officer.procurement');
          }}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'PROCUREMENT'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Procurement</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {activeTab === 'TOOLCRIB' ? 'Username Staff Toolcrib' : 'Username Staff Procurement'}
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password Staff</label>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
              required
            />
            <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
          </div>
        </div>

        <button
          type="submit"
          className="w-full red-gradient-btn text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-sm shadow-md"
        >
          <span>Masuk Dashboard {activeTab === 'TOOLCRIB' ? 'Toolcrib' : 'Procurement'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Quick Demo Assist */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Demo Mode Akses Cepat
        </span>
        <button
          onClick={() => loginStaff(activeTab)}
          className="text-xs text-red-600 font-bold hover:underline"
        >
          Masuk Langsung &rarr;
        </button>
      </div>
    </div>
  );
};
