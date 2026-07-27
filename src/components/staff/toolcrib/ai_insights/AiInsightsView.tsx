'use client';

import React, { useState } from 'react';
import {
  BrainCircuit,
  Copy,
  AlertTriangle,
  LineChart,
  TrendingDown,
  Scale,
  Layers,
  HeartPulse,
  AlertOctagon,
  TrendingUp
} from 'lucide-react';
import { DuplicateDetectionTab } from './DuplicateDetectionTab';
import { CriticalSparesTab } from './CriticalSparesTab';
import { StockForecastTab } from './StockForecastTab';
import { OptimizationTab } from './OptimizationTab';
import { DynamicMinMaxTab } from './DynamicMinMaxTab';
import { AbcXyzClassificationTab } from './AbcXyzClassificationTab';

type AiTab = 'abcxyz' | 'duplicates' | 'critical' | 'forecast' | 'optimization' | 'minmax';

export const AiInsightsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AiTab>('duplicates');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Dasbor MRO (Maintenance, Repair, & Operations)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pusat kendali inventaris ditenagai AI. Pantau kesehatan stok, risiko *downtime*, dan optimalisasi anggaran.
          </p>
        </div>
      </div>

      {/* MRO Dashboard KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col hover:border-indigo-300 transition-colors cursor-pointer group">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">Kesehatan Inventaris</h4>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-slate-900">92%</span>
            <p className="text-xs text-emerald-600 font-bold mt-1">↑ +5% membaik dari bulan lalu</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col hover:border-indigo-300 transition-colors cursor-pointer group">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">Wawasan Klasifikasi</h4>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-slate-900">14<span className="text-sm font-normal text-slate-500"> Item Class A</span></span>
            <p className="text-xs text-slate-500 mt-1">Menyumbang 75% nilai total aset</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col hover:border-indigo-300 transition-colors cursor-pointer group">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">Risiko Ketersediaan</h4>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-slate-900">3<span className="text-sm font-normal text-slate-500"> SKU Kritis</span></span>
            <p className="text-xs text-red-500 font-bold mt-1">Berada di bawah batas aman!</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col hover:border-indigo-300 transition-colors cursor-pointer group">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">Peluang Optimalisasi</h4>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-slate-900">Rp 45Jt</span>
            <p className="text-xs text-amber-600 font-bold mt-1">Potensi hemat dari *dead-stock*</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto">
        <TabButton
          active={activeTab === 'duplicates'}
          onClick={() => setActiveTab('duplicates')}
          icon={<Copy className="w-4 h-4" />}
          label="Duplicate SKU"
        />
        <TabButton
          active={activeTab === 'abcxyz'}
          onClick={() => setActiveTab('abcxyz')}
          icon={<Layers className="w-4 h-4" />}
          label="ABC/XYZ Class"
        />
        <TabButton
          active={activeTab === 'minmax'}
          onClick={() => setActiveTab('minmax')}
          icon={<Scale className="w-4 h-4" />}
          label="Dynamic Min-Max"
        />
        <TabButton
          active={activeTab === 'critical'}
          onClick={() => setActiveTab('critical')}
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Critical Spares"
        />
        <TabButton
          active={activeTab === 'forecast'}
          onClick={() => setActiveTab('forecast')}
          icon={<LineChart className="w-4 h-4" />}
          label="Stock Forecast"
        />
        <TabButton
          active={activeTab === 'optimization'}
          onClick={() => setActiveTab('optimization')}
          icon={<TrendingDown className="w-4 h-4" />}
          label="Optimizations"
        />
      </div>

      {/* Content Area */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        {activeTab === 'abcxyz' && <AbcXyzClassificationTab />}
        {activeTab === 'minmax' && <DynamicMinMaxTab />}
        {activeTab === 'duplicates' && <DuplicateDetectionTab />}
        {activeTab === 'critical' && <CriticalSparesTab />}
        {activeTab === 'forecast' && <StockForecastTab />}
        {activeTab === 'optimization' && <OptimizationTab />}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${active
      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);
