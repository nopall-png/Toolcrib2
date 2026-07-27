'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/src/lib/store';
import { ItemFormState, createDefaultItemForm } from './types';
import { NewToolImageUpload } from './NewToolImageUpload';
import { NewToolSpecFields } from './NewToolSpecFields';
import { Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface NewToolFormProps {
  onSuccess: () => void;
}

export const NewToolForm: React.FC<NewToolFormProps> = ({ onSuccess }) => {
  const { addToolItem } = useAppStore();

  const [newItems, setNewItems] = useState<ItemFormState[]>([createDefaultItemForm(0)]);
  const [activeNewItemIndex, setActiveNewItemIndex] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentNewItem = newItems[activeNewItemIndex] || newItems[0];

  const updateCurrentNewItem = (field: keyof ItemFormState, value: any) => {
    setNewItems((prev) =>
      prev.map((item, idx) => (idx === activeNewItemIndex ? { ...item, [field]: value } : item))
    );
  };

  const handleAddNewItemForm = () => {
    const newIdx = newItems.length;
    const newItem = createDefaultItemForm(newIdx);
    setNewItems((prev) => [...prev, newItem]);
    setActiveNewItemIndex(newIdx);
    setErrorMsg(null);
  };

  const handleRemoveNewItemForm = (indexToRemove: number) => {
    if (newItems.length === 1) return;
    const updated = newItems.filter((_, idx) => idx !== indexToRemove);
    setNewItems(updated);
    if (activeNewItemIndex >= updated.length) {
      setActiveNewItemIndex(updated.length - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      if (!item.name.trim()) {
        setActiveNewItemIndex(i);
        setErrorMsg(`Nama Barang pada Item #${i + 1} wajib diisi!`);
        return;
      }
      if (!item.imageUrl || !item.imageUrl.trim()) {
        setActiveNewItemIndex(i);
        setErrorMsg(`Gambar Item #${i + 1} WAJIB diunggah/diisi!`);
        return;
      }
    }

    newItems.forEach((item) => {
      const rackBinLocation = item.rack || item.bin ? `Rack ${item.rack || '-'} (${item.bin || '-'})` : 'Rack A-01';

      addToolItem({
        sku: item.sku,
        code: item.code || `ITM-${Date.now().toString().slice(-5)}`,
        name: item.name.trim(),
        category: item.category || 'Measuring Tools',
        subcategory: item.subcategory,
        brand: item.brand,
        model: item.model,
        partNumber: item.partNumber,
        technicalSpec: item.technicalSpec,
        material: item.material,
        dimension: item.dimension,
        weight: item.weight,
        unit: item.unit || 'PCS',
        stock: Number(item.stock),
        minStock: Number(item.minStock),
        maxStock: Number(item.maxStock),
        warehouse: item.warehouse,
        rack: item.rack,
        bin: item.bin,
        location: rackBinLocation,
        supplier: item.supplier,
        leadTimeDays: Number(item.leadTimeDays),
        supplierRating: Number(item.supplierRating),
        supplierEmail: item.supplierEmail,
        purchaseDate: item.purchaseDate,
        unitPrice: Number(item.unitPrice),
        totalValue: Number(item.unitPrice) * Number(item.stock),
        department: item.department,
        calibrationDate: item.calibrationDate,
        expiryDate: item.expiryDate,
        status: item.status || 'Active',
        condition: item.condition || 'Good',
        inspectionDate: item.inspectionDate,
        imageUrl: item.imageUrl,
        description: item.technicalSpec || item.name,
        lastRestocked: new Date().toISOString().substring(0, 10),
      });
    });

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center space-x-3 text-xs font-bold">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Multi-Item Selector Bar */}
      <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Daftar Tool Baru Yang Akan Didaftarkan ({newItems.length} Item)
          </span>

          <button
            type="button"
            onClick={handleAddNewItemForm}
            className="px-3.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-semibold rounded-md text-xs flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Item Baru</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {newItems.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setActiveNewItemIndex(idx)}
              className={`px-3 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-2 shrink-0 border ${
                activeNewItemIndex === idx
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>Item #{idx + 1}: {item.name ? item.name : 'Tool Baru'}</span>
              {newItems.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveNewItemForm(idx);
                  }}
                  className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Details Card */}
      <div className="bg-white p-6 sm:p-8 rounded-md border border-slate-200 shadow-sm space-y-8">
        <NewToolImageUpload item={currentNewItem} onUpdateField={updateCurrentNewItem} />
        <NewToolSpecFields item={currentNewItem} onUpdateField={updateCurrentNewItem} />
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-100 border border-slate-200 shadow-sm rounded-md">
        <div>
          <h4 className="font-bold text-slate-900">Simpan Registrasi Tool Baru ({newItems.length} Items)</h4>
          <p className="text-xs text-slate-500">Barang baru akan terdaftar lengkap di katalog Master Data.</p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleAddNewItemForm}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md text-sm font-semibold transition-all flex items-center justify-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Item Baru</span>
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2 rounded-md text-sm flex items-center justify-center space-x-2 shadow-sm transition-all shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Daftarkan Semua Tool ({newItems.length})</span>
          </button>
        </div>
      </div>
    </form>
  );
};
