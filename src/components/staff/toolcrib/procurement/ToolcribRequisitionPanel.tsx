'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { ToolItem } from '@/src/lib/mock';
import { ShoppingCart, Search, AlertTriangle, Plus, Minus, Send } from 'lucide-react';
import { RequisitionQuantityModal } from './RequisitionQuantityModal';

interface ToolcribRequisitionPanelProps {
  initialSelectedTool?: ToolItem | null;
}

export const ToolcribRequisitionPanel: React.FC<ToolcribRequisitionPanelProps> = ({ initialSelectedTool }) => {
  const { tools, createProcurementRequest, procurementCart, procurementCartQtys, addToProcurementCart, updateProcurementCartQty, clearProcurementCart } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  
  // Single PR Request Modal
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(initialSelectedTool || null);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(Boolean(initialSelectedTool));
  
  // Cart States removed (moved to global store)
  
  // Add to Cart Modal States
  const [toolToAddToCart, setToolToAddToCart] = useState<ToolItem | null>(null);

  // Derived Calculations
  const calculatedCartCost = procurementCart.reduce((total, tool) => {
    return total + ((tool.unitPrice || 50000) * (procurementCartQtys[tool.id] || 1));
  }, 0);

  // Sort and filter tools
  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.code.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    const aLow = a.stock <= a.minStock ? 1 : 0;
    const bLow = b.stock <= b.minStock ? 1 : 0;
    if (bLow !== aLow) return bLow - aLow;
    return a.name.localeCompare(b.name);
  });

  // Handlers
  const confirmAddToCart = (qty: number) => {
    if (toolToAddToCart) {
      addToProcurementCart(toolToAddToCart, qty);
      setToolToAddToCart(null);
    }
  };

  const handleCreateSubmit = (qty: number) => {
    if (!selectedTool) return;

    createProcurementRequest({
      toolId: selectedTool.id,
      toolName: selectedTool.name,
      quantity: qty,
      unit: selectedTool.unit,
      reason: 'Restock / Kebutuhan Operasional',
      estimatedCost: (selectedTool.unitPrice || 50000) * qty,
    });

    setIsSingleModalOpen(false);
    setSelectedTool(null);
  };

  const handleCartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    procurementCart.forEach(tool => {
      createProcurementRequest({
        toolId: tool.id,
        toolName: tool.name,
        quantity: procurementCartQtys[tool.id] || 1,
        unit: tool.unit,
        reason: 'Restock / Kebutuhan Operasional',
        estimatedCost: (tool.unitPrice || 50000) * (procurementCartQtys[tool.id] || 1),
      });
    });
    clearProcurementCart();
    alert('Purchase Request kolektif berhasil dikirim ke Procurement!');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative pb-20 items-start">
      <div className="flex-1 space-y-6 min-w-0 w-full">
      {/* Search Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari Nama Barang atau Kode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Master Data List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-sm">Daftar Barang & Status Stok</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredTools.map((tool) => (
            <div key={tool.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${tool.stock <= tool.minStock ? 'bg-red-50/30 hover:bg-red-50/60' : 'bg-white hover:bg-slate-50'}`}>
              <div className="flex items-center space-x-4">
                <img src={tool.imageUrl} alt={tool.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{tool.name}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{tool.code} • {tool.category}</p>
                  <div className="flex items-center mt-1.5 space-x-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${tool.stock <= tool.minStock ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                      Stok: {tool.stock} {tool.unit}
                    </span>
                    {tool.stock <= tool.minStock && (
                      <span className="text-[10px] text-red-600 font-semibold flex items-center bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Kurang dari batas min ({tool.minStock})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                {procurementCart.find(t => t.id === tool.id) ? (
                  <button
                    onClick={() => updateProcurementCartQty(tool.id, 0)}
                    className="w-full sm:w-auto px-4 py-2 border font-semibold rounded-lg text-sm transition-colors shadow-xs bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
                  >
                    Hapus Keranjang
                  </button>
                ) : (
                  <button
                    onClick={() => setToolToAddToCart(tool)}
                    className="w-full sm:w-auto px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 font-semibold rounded-lg text-sm transition-colors shadow-xs"
                  >
                    + Keranjang
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedTool(tool);
                    setIsSingleModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2 red-gradient-btn text-white font-semibold rounded-lg text-sm transition-colors shadow-xs shrink-0"
                >
                  Request Pembelian
                </button>
              </div>
            </div>
          ))}
          {filteredTools.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">Tidak ada barang ditemukan.</div>
          )}
        </div>
      </div>

      </div>

      {/* Single Purchase Request Modal */}
      <RequisitionQuantityModal
        mode="direct"
        tool={selectedTool}
        isOpen={isSingleModalOpen}
        onClose={() => {
          setIsSingleModalOpen(false);
          setSelectedTool(null);
        }}
        onConfirm={handleCreateSubmit}
      />

      {/* Add To Cart Mini Modal */}
      <RequisitionQuantityModal
        mode="cart"
        tool={toolToAddToCart}
        isOpen={!!toolToAddToCart}
        onClose={() => setToolToAddToCart(null)}
        onConfirm={confirmAddToCart}
      />
    </div>
  );
};
