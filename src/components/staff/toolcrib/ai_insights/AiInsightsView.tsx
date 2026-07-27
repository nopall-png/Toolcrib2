'use client';

import React, { useState } from 'react';
import {
  BrainCircuit,
  Copy,
  AlertTriangle,
  LineChart,
  TrendingDown,
  Scale
} from 'lucide-react';
import { DuplicateDetectionTab } from './DuplicateDetectionTab';
import { CriticalSparesTab } from './CriticalSparesTab';
import { StockForecastTab } from './StockForecastTab';
import { OptimizationTab } from './OptimizationTab';
import { DynamicMinMaxTab } from './DynamicMinMaxTab';

type AiTab = 'duplicates' | 'critical' | 'forecast' | 'optimization' | 'minmax';

export const AiInsightsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AiTab>('duplicates');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">AI Predictive Insights</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analitik pintar bertenaga AI untuk deteksi duplikat, prediksi stok, dan optimasi inventaris.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto">
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
          active={activeTab === 'duplicates'}
          onClick={() => setActiveTab('duplicates')}
          icon={<Copy className="w-4 h-4" />}
          label="Duplicate SKU"
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
