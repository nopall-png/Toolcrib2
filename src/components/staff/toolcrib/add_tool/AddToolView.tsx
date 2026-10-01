'use client';

import React, { useState } from 'react';
import { ManagementTab } from '@/src/components/layout/Sidebar';
import { EntryMode } from './types';
import { RestockForm } from './RestockForm';
import { NewToolForm } from './NewToolForm';
import { PackagePlus, RefreshCw, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface AddToolViewProps {
  setActiveTab: (tab: ManagementTab) => void;
}

export const AddToolView: React.FC<AddToolViewProps> = ({ setActiveTab }) => {
  const [entryMode, setEntryMode] = useState<EntryMode>('restock');
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  const handleSuccess = () => {
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setActiveTab('master_tools');
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Enterprise Tabbed Header */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 flex items-center space-x-3">
              <PackagePlus className="w-8 h-8 text-red-600" />
              <span>Input Data Tools & Inventory</span>
            </h2>
            <p className="text-base text-slate-500 mt-2">
              Pilih metode input stok barang masuk atau registrasi master data tool baru.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('master_tools')}
            className="px-5 py-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md text-base font-bold transition-all flex items-center space-x-2 shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali ke Master Tools</span>
          </button>
        </div>

        {/* Corporate Clean Tabs */}
        <div className="flex items-center px-6 bg-slate-50/50">
          <button
            onClick={() => setEntryMode('restock')}
            className={`px-8 py-5 text-lg font-bold border-b-4 flex items-center space-x-3 transition-colors ${
              entryMode === 'restock'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <RefreshCw className="w-6 h-6" />
            <span>1. Penerimaan Barang Datang (Restock)</span>
          </button>

          <button
            onClick={() => setEntryMode('new_tool')}
            className={`px-8 py-5 text-lg font-bold border-b-4 flex items-center space-x-3 transition-colors ${
              entryMode === 'new_tool'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <PackagePlus className="w-6 h-6" />
            <span>2. Registrasi Tool Baru (Detail)</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md flex items-center space-x-3 text-base font-bold shadow-xs">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          <span>
            {entryMode === 'restock'
              ? 'Berhasil memproses penambahan stok barang datang!'
              : 'Berhasil mendaftarkan tool baru!'}
          </span>
        </div>
      )}

      {/* Render Selected Mode */}
      <div className="mt-6">
        {entryMode === 'restock' ? (
          <RestockForm onSuccess={handleSuccess} />
        ) : (
          <NewToolForm onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  );
};
