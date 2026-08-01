'use client';

import React, { useState } from 'react';
import { ToolItem } from '@/src/lib/mock';
import { Search, Plus, Filter, List, LayoutGrid } from 'lucide-react';
import { useToolFilter } from '@/src/hooks/useToolFilter';
import { UserToolListTable } from './UserToolListTable';
import { RequestQuantityModal } from './RequestQuantityModal';

import type { UserRequestItem } from '@/src/types';

interface UserCatalogTabProps {
  cart: UserRequestItem[];
  addToCart: (tool: ToolItem, qty: number) => void;
}

export const UserCatalogTab: React.FC<UserCatalogTabProps> = ({ cart, addToCart }) => {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredTools,
  } = useToolFilter();

  const [viewMode, setViewMode] = useState<'list' | 'catalog'>('catalog');
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);

  return (
    <div className="space-y-6">
      {/* Search & Category Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari kode, nama alat, rak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
          />
          <Search className="w-6 h-6 text-slate-400 absolute left-4 top-4" />
        </div>

        {/* Categories Dropdown Filter & View Toggle */}
        <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center space-x-2">
            <Filter className="w-6 h-6 text-slate-400 hidden sm:block" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer w-full md:w-auto transition-all"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'Semua Kategori' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-2 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`p-3.5 rounded-lg text-base font-bold flex items-center space-x-2 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan List (Tabel)"
            >
              <List className="w-6 h-6" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('catalog')}
              className={`p-3.5 rounded-lg text-base font-bold flex items-center space-x-2 transition-all ${
                viewMode === 'catalog'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan Catalog (Grid)"
            >
              <LayoutGrid className="w-6 h-6" />
              <span className="hidden sm:inline">Catalog</span>
            </button>
          </div>
        </div>
      </div>

      {/* RENDER VIEW: Catalog (Grid) or List (Table) */}
      {viewMode === 'list' ? (
        <UserToolListTable tools={filteredTools} cart={cart} onRequestTool={setSelectedTool} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredTools.map((tool) => {
            const inCartItem = cart.find((item) => item.toolId === tool.id);
            const isOutOfStock = tool.stock === 0;

            return (
              <div
                key={tool.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Image Thumbnail */}
                  <div className="h-48 bg-slate-100 relative overflow-hidden">
                    <img
                      src={tool.imageUrl}
                      alt={tool.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {isOutOfStock && (
                      <span className="absolute top-4 right-4 text-sm font-extrabold px-4 py-2 rounded-full shadow-xs bg-slate-900 text-white">
                        Habis
                      </span>
                    )}

                    <span className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-xs text-white text-sm font-mono px-3 py-1.5 rounded-md">
                      {tool.code}
                    </span>
                  </div>

                  {/* Tool Info */}
                  <div className="p-6 space-y-4">
                    <h3 className="font-bold text-slate-900 text-2xl leading-snug line-clamp-2">{tool.name}</h3>
                    <p className="text-base text-slate-500 line-clamp-2">{tool.description}</p>

                    <div className="pt-4 flex items-center justify-between text-base border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Stok Toolcrib:</span>
                      <span className="font-bold text-slate-900 text-xl">
                        {tool.stock} {tool.unit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="p-6 pt-0">
                  {isOutOfStock ? (
                    <button
                      disabled
                      className="w-full py-3.5 bg-slate-100 text-slate-400 text-base font-bold rounded-xl cursor-not-allowed text-center"
                    >
                      Stok Habis
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedTool(tool)}
                      className="w-full red-gradient-btn text-white py-3.5 rounded-xl text-base font-bold flex items-center justify-center space-x-2 shadow-sm"
                    >
                      <Plus className="w-6 h-6" />
                      <span>{inCartItem ? `Tambah (ada di Cart)` : 'Tambah ke Request'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quantity Selection Modal */}
      <RequestQuantityModal
        tool={selectedTool}
        isOpen={!!selectedTool}
        onClose={() => setSelectedTool(null)}
        onConfirm={(qty) => {
          if (selectedTool) {
            addToCart(selectedTool, qty);
          }
          setSelectedTool(null);
        }}
      />
    </div>
  );
};
