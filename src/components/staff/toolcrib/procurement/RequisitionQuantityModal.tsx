'use client';

import React, { useState, useEffect } from 'react';
import { ToolItem } from '@/src/lib/mock';
import { X, Minus, Plus, ShoppingCart, Send } from 'lucide-react';

interface RequisitionQuantityModalProps {
  tool: ToolItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (qty: number) => void;
  mode?: 'cart' | 'direct';
}

export const RequisitionQuantityModal: React.FC<RequisitionQuantityModalProps> = ({ 
  tool, 
  isOpen, 
  onClose, 
  onConfirm,
  mode = 'cart'
}) => {
  const [quantity, setQuantity] = useState(10);

  useEffect(() => {
    if (isOpen && tool) {
      setQuantity(10); // default to 10 for procurement
    }
  }, [isOpen, tool]);

  if (!isOpen || !tool) return null;

  const handleConfirm = () => {
    onConfirm(quantity);
  };

  const increase = () => setQuantity(prev => prev + 1);
  const decrease = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const estimatedCost = (tool.unitPrice || 50000) * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-900 text-xl">
            {mode === 'cart' ? 'Masukkan ke Keranjang' : 'Buat Purchase Request'}
          </h3>
          <button
            onClick={onClose}
            className="p-3 bg-white hover:bg-slate-100 text-slate-500 rounded-xl transition-all shadow-sm border border-slate-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-48 h-48 bg-slate-100 rounded-xl overflow-hidden mb-6 border border-slate-200 shadow-sm relative">
            <img
              src={tool.imageUrl}
              alt={tool.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-sm font-mono px-3 py-1 rounded-md">
              {tool.code}
            </span>
          </div>

          <h4 className="font-bold text-slate-900 text-center text-2xl mb-2 px-4">{tool.name}</h4>
          <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-md text-base font-bold mb-8">
            {tool.category}
          </span>

          {/* Quantity Selector */}
          <div className="w-full bg-slate-50 p-6 rounded-xl border border-slate-100 mb-4">
            <div className="flex items-center justify-between text-lg text-slate-500 mb-4 font-medium">
              <span>Tentukan jumlah beli:</span>
              <span>Stok saat ini: <strong className="text-slate-900">{tool.stock} {tool.unit}</strong></span>
            </div>
            
            <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-xl shadow-xs">
              <button
                onClick={decrease}
                disabled={quantity <= 1}
                className="w-14 h-14 flex items-center justify-center bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 rounded-lg transition-all"
              >
                <Minus className="w-6 h-6" />
              </button>
              
              <div className="flex-1 text-center font-black text-4xl text-slate-900">
                {quantity}
              </div>
              
              <button
                onClick={increase}
                className="w-14 h-14 flex items-center justify-center bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 rounded-lg transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Estimated Cost Info */}
          <div className="w-full mt-4 text-center text-lg text-slate-500 font-medium">
            Estimasi Biaya: <span className="font-bold text-slate-700">Rp {estimatedCost.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleConfirm}
            className="w-full red-gradient-btn text-white py-5 rounded-xl text-xl font-bold flex items-center justify-center space-x-3 shadow-md hover:shadow-lg transition-all"
          >
            {mode === 'cart' ? <ShoppingCart className="w-6 h-6" /> : <Send className="w-6 h-6" />}
            <span>{mode === 'cart' ? 'Tambah ke Keranjang' : 'Kirim Requisition'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
