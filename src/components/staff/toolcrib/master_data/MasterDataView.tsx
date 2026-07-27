'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { ToolItem } from '@/src/lib/mock';
import { useToolFilter } from '@/src/hooks/useToolFilter';
import { ToolDetailModal } from './ToolDetailModal';
import { ToolCatalogGrid } from './ToolCatalogGrid';
import { ToolListTable } from './ToolListTable';
import { Package, Search, LayoutGrid, List, Filter } from 'lucide-react';

interface MasterDataViewProps {
  onOpenProcurementModal?: (tool: ToolItem) => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredTools,
  } = useToolFilter();

  const [viewMode, setViewMode] = useState<'list' | 'catalog'>('list');
  const [selectedToolDetail, setSelectedToolDetail] = useState<ToolItem | null>(null);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-slate-900">Master Data Tools & Inventory</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data master perkakas, lokasi penyimpanan rak, serta monitoring spesifikasi detail & stok.
          </p>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Cari kode, nama tool, lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'Semua Kategori' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${viewMode === 'list'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
                }`}
              title="Tampilan List (Tabel)"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('catalog')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${viewMode === 'catalog'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
                }`}
              title="Tampilan Catalog (Grid)"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Catalog</span>
            </button>
          </div>
        </div>
      </div>

      {/* RENDER VIEW: Catalog (Grid) or List (Table) */}
      {viewMode === 'catalog' ? (
        <ToolCatalogGrid tools={filteredTools} onSelectTool={setSelectedToolDetail} />
      ) : (
        <ToolListTable tools={filteredTools} onSelectTool={setSelectedToolDetail} />
      )}

      {/* DETAIL MODAL */}
      {selectedToolDetail && (
        <ToolDetailModal tool={selectedToolDetail} onClose={() => setSelectedToolDetail(null)} />
      )}
    </div>
  );
};
