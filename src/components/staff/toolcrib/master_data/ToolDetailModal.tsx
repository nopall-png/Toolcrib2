'use client';

import React from 'react';
import { ToolItem } from '@/src/lib/mock';
import { X } from 'lucide-react';

interface ToolDetailModalProps {
  tool: ToolItem;
  onClose: () => void;
}

export const ToolDetailModal: React.FC<ToolDetailModalProps> = ({ tool, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn my-8">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <img
              src={tool.imageUrl}
              alt={tool.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
            />
            <div>
              <h3 className="font-extrabold text-base text-white">{tool.name}</h3>
              <p className="text-xs text-slate-400 font-mono">Item Code: {tool.code}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 32 Spec Fields Table */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <table className="w-full text-left text-xs border border-slate-200 divide-y divide-slate-200 rounded-xl overflow-hidden">
            <tbody className="divide-y divide-slate-200 font-medium">
              <tr className="bg-slate-50">
                <td className="p-2.5 font-bold text-slate-700 w-1/3 border-r border-slate-200">SKU</td>
                <td className="p-2.5 font-mono text-slate-900">{tool.sku || 'BRG-MEA-099'}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Item ID</td>
                <td className="p-2.5 font-mono text-slate-900">{tool.code}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Category</td>
                <td className="p-2.5 text-slate-900">{tool.category}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Subcategory</td>
                <td className="p-2.5 text-slate-900">{tool.subcategory || 'ToolCrib'}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Item Name</td>
                <td className="p-2.5 font-bold text-slate-900">{tool.name}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Brand</td>
                <td className="p-2.5 text-slate-900">{tool.brand || 'Mitutoyo'}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Model</td>
                <td className="p-2.5 text-slate-900">{tool.model || 'MIT-198'}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Part Number</td>
                <td className="p-2.5 font-mono text-slate-900">{tool.partNumber || 'PN-5098'}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Technical Specification</td>
                <td className="p-2.5 text-slate-900">{tool.technicalSpec || tool.description || 'Industrial grade precision tool'}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Material</td>
                <td className="p-2.5 text-slate-900">{tool.material || 'Stainless Steel'}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Dimension</td>
                <td className="p-2.5 text-slate-900">{tool.dimension || '110 x 58 x 25 mm'}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Weight</td>
                <td className="p-2.5 text-slate-900">{tool.weight || '0.18 kg'}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Unit</td>
                <td className="p-2.5 font-bold text-slate-900">{tool.unit}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Stock Quantity</td>
                <td className="p-2.5 font-extrabold text-slate-900 text-sm">{tool.stock}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2.5 font-bold text-indigo-700 border-r border-slate-200">✨ AI Minimum Stock (ROP)</td>
                <td className="p-2.5 font-bold text-red-600">{Math.max(1, Math.floor(tool.minStock * 1.2))}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-indigo-700 border-r border-slate-200">✨ AI Maximum Stock</td>
                <td className="p-2.5 font-bold text-emerald-600">{Math.max(5, Math.floor(tool.maxStock * 0.85))}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Warehouse</td>
                <td className="p-2.5 text-slate-900">{tool.warehouse || 'ToolCrib Main Warehouse'}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Supplier</td>
                <td className="p-2.5 text-slate-900">{tool.supplier || 'PT Precision Tools Indonesia'}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Lead Time (Days)</td>
                <td className="p-2.5 text-slate-900">{tool.leadTimeDays || 10} Hari</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Supplier Rating</td>
                <td className="p-2.5 font-bold text-amber-600">{tool.supplierRating || 4.9} / 5.0</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Supplier Email</td>
                <td className="p-2.5 font-mono text-slate-900">{tool.supplierEmail || 'support@precisiontools.co.id'}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Purchase Date</td>
                <td className="p-2.5 text-slate-900">{tool.purchaseDate || '2025-03-15'}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Unit Price</td>
                <td className="p-2.5 font-bold text-slate-900">Rp {(tool.unitPrice || 790000).toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Total Value</td>
                <td className="p-2.5 font-black text-slate-900 text-sm">
                  Rp {((tool.totalValue || (tool.unitPrice || 790000) * tool.stock)).toLocaleString('id-ID')}
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Department</td>
                <td className="p-2.5 text-slate-900">{tool.department || 'Maintenance'}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Calibration Date</td>
                <td className="p-2.5 text-slate-900">{tool.calibrationDate || '2026-12-31'}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Expiry Date</td>
                <td className="p-2.5 text-slate-900">{tool.expiryDate || '-'}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Status</td>
                <td className="p-2.5 font-bold text-emerald-600">{tool.status || 'Active'}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Condition</td>
                <td className="p-2.5 font-bold text-slate-900">{tool.condition || 'Good'}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Inspection Date</td>
                <td className="p-2.5 text-slate-900">{tool.inspectionDate || '2026-04-05'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all"
          >
            Tutup Detail Spesifikasi
          </button>
        </div>
      </div>
    </div>
  );
};
