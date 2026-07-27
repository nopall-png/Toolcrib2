'use client';

import React, { useState, useEffect } from 'react';
import { ToolItem } from '@/src/lib/mock';
import { X, Minus, Plus, ShoppingCart } from 'lucide-react';

interface RequestQuantityModalProps {
  tool: ToolItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (qty: number) => void;
}

export const RequestQuantityModal: React.FC<RequestQuantityModalProps> = ({ tool, isOpen, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState(1);

  // Reset quantity when modal opens with a new tool
  useEffect(() => {
    if (isOpen && tool) {
      setQuantity(1);
    }
  }, [isOpen, tool]);

  if (!isOpen || !tool) return null;

  const handleConfirm = () => {
    onConfirm(quantity);
  };

  const increase = () => {
    if (quantity < tool.stock) setQuantity(prev => prev + 1);
  };

  const decrease = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-900 text-sm">Pilih Jumlah Barang</h3>
          <button
            onClick={onClose}
            className="p-2 bg-white hover:bg-slate-100 text-slate-500 rounded-xl transition-all shadow-sm border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-32 h-32 bg-slate-100 rounded-xl overflow-hidden mb-4 border border-slate-200 shadow-sm relative">
            <img
              src={tool.imageUrl}
              alt={tool.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
              {tool.code}
            </span>
          </div>

          <h4 className="font-bold text-slate-900 text-center text-sm mb-1 px-4">{tool.name}</h4>
          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[11px] font-bold mb-6">
            {tool.category}
          </span>

          {/* Quantity Selector */}
          <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-3 font-medium">
              <span>Tentukan jumlah request:</span>
              <span>Stok tersedia: <strong className="text-slate-900">{tool.stock} {tool.unit}</strong></span>
            </div>
            
            <div className="flex items-center justify-between bg-white border border-slate-200 p-1.5 rounded-xl shadow-xs">
              <button
                onClick={decrease}
                disabled={quantity <= 1}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 rounded-lg transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <div className="flex-1 text-center font-black text-xl text-slate-900">
                {quantity}
              </div>
              
              <button
                onClick={increase}
                disabled={quantity >= tool.stock}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleConfirm}
            className="w-full red-gradient-btn text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Masukkan ke Keranjang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
