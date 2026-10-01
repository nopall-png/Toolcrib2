'use client';

import React from 'react';
import { ItemFormState } from './types';
import { Tag, FileText, DollarSign, MapPin, ShieldCheck } from 'lucide-react';

interface NewToolSpecFieldsProps {
  item: ItemFormState;
  onUpdateField: (field: keyof ItemFormState, value: any) => void;
}

export const NewToolSpecFields: React.FC<NewToolSpecFieldsProps> = ({ item, onUpdateField }) => {
  const inputClass = "w-full px-5 py-4 bg-white border border-slate-300 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400";
  const labelClass = "block text-base font-semibold text-slate-700 mb-2";
  
  return (
    <div className="space-y-10">
      {/* SECTION 1: IDENTITAS BARANG */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-wider pb-4 border-b border-slate-200 flex items-center space-x-3">
          <Tag className="w-6 h-6 text-slate-500" />
          <span>1. Identitas & Informasi Barang</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className={labelClass}>SKU</label>
            <input
              type="text"
              value={item.sku}
              onChange={(e) => onUpdateField('sku', e.target.value)}
              className={`${inputClass} font-mono`}
              placeholder="BRG-MEA-099"
            />
          </div>

          <div>
            <label className={labelClass}>Item ID / Kode *</label>
            <input
              type="text"
              value={item.code}
              onChange={(e) => onUpdateField('code', e.target.value)}
              className={`${inputClass} font-mono font-bold`}
              placeholder="ITM-00099"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Category *</label>
            <select
              value={item.category}
              onChange={(e) => onUpdateField('category', e.target.value)}
              className={inputClass}
            >
              <option value="Measuring Tools">Measuring Tools (MEA)</option>
              <option value="Power Tools">Power Tools</option>
              <option value="Hand Tools">Hand Tools</option>
              <option value="Safety & PPE">Safety & PPE</option>
              <option value="Consumables">Consumables</option>
              <option value="Molding & Dies">Molding & Dies</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Subcategory</label>
            <input
              type="text"
              value={item.subcategory}
              onChange={(e) => onUpdateField('subcategory', e.target.value)}
              className={inputClass}
              placeholder="ToolCrib"
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Item Name *</label>
            <input
              type="text"
              value={item.name}
              onChange={(e) => onUpdateField('name', e.target.value)}
              className={`${inputClass} font-bold`}
              placeholder="Dial Indicator 10mm"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Brand</label>
            <input
              type="text"
              value={item.brand}
              onChange={(e) => onUpdateField('brand', e.target.value)}
              className={inputClass}
              placeholder="Mitutoyo"
            />
          </div>

          <div>
            <label className={labelClass}>Model</label>
            <input
              type="text"
              value={item.model}
              onChange={(e) => onUpdateField('model', e.target.value)}
              className={inputClass}
              placeholder="MIT-198"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: STOK & HARGA */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-wider pb-4 border-b border-slate-200 flex items-center space-x-3">
          <DollarSign className="w-6 h-6 text-slate-500" />
          <span>2. Jumlah Stok, Batas & Nilai Aset</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
          <div>
            <label className={labelClass}>Unit *</label>
            <select
              value={item.unit}
              onChange={(e) => onUpdateField('unit', e.target.value)}
              className={inputClass}
            >
              <option value="PCS">PCS</option>
              <option value="SET">SET</option>
              <option value="BOX">BOX</option>
              <option value="PAIR">PAIR</option>
              <option value="ROLL">ROLL</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Stock Quantity *</label>
            <input
              type="number"
              min="0"
              value={item.stock}
              onChange={(e) => onUpdateField('stock', Number(e.target.value))}
              className={`${inputClass} font-bold`}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Minimum Stock *</label>
            <input
              type="number"
              min="0"
              value={item.minStock}
              onChange={(e) => onUpdateField('minStock', Number(e.target.value))}
              className={`${inputClass} font-bold text-amber-700`}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Maximum Stock *</label>
            <input
              type="number"
              min="1"
              value={item.maxStock}
              onChange={(e) => onUpdateField('maxStock', Number(e.target.value))}
              className={`${inputClass} font-bold`}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Unit Price (Rp)</label>
            <input
              type="number"
              min="0"
              value={item.unitPrice}
              onChange={(e) => onUpdateField('unitPrice', Number(e.target.value))}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Total Value (Auto)</label>
            <input
              type="text"
              value={`Rp ${(item.unitPrice * item.stock).toLocaleString('id-ID')}`}
              disabled
              className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-xl text-lg font-bold text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: LOKASI GUDANG */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-wider pb-4 border-b border-slate-200 flex items-center space-x-3">
          <MapPin className="w-6 h-6 text-slate-500" />
          <span>3. Lokasi Rak & Gudang</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className={labelClass}>Warehouse</label>
            <input
              type="text"
              value={item.warehouse}
              onChange={(e) => onUpdateField('warehouse', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Rack</label>
            <input
              type="text"
              value={item.rack}
              onChange={(e) => onUpdateField('rack', e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>

          <div>
            <label className={labelClass}>Bin</label>
            <input
              type="text"
              value={item.bin}
              onChange={(e) => onUpdateField('bin', e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: SUPPLIER */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-wider pb-4 border-b border-slate-200 flex items-center space-x-3">
          <ShieldCheck className="w-6 h-6 text-slate-500" />
          <span>4. Supplier & Inspeksi</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="sm:col-span-2">
            <label className={labelClass}>Supplier Name</label>
            <input
              type="text"
              value={item.supplier}
              onChange={(e) => onUpdateField('supplier', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Supplier Rating (1-5)</label>
            <input
              type="number"
              step="0.1"
              max="5"
              min="1"
              value={item.supplierRating}
              onChange={(e) => onUpdateField('supplierRating', Number(e.target.value))}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Lead Time (Days)</label>
            <input
              type="number"
              min="0"
              value={item.leadTimeDays}
              onChange={(e) => onUpdateField('leadTimeDays', Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
