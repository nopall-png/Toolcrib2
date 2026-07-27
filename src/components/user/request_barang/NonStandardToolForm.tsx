'use client';

import React from 'react';
import { Wrench, Image as ImageIcon, Building, DollarSign, Phone, Ruler, Send } from 'lucide-react';

interface FormData {
  toolName: string;
  vendorName: string;
  price: string;
  contact: string;
  dimensions: string;
  imageUrl: string;
}

interface NonStandardToolFormProps {
  formData: FormData;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  canSubmit: boolean;
}

export const NonStandardToolForm: React.FC<NonStandardToolFormProps> = ({
  formData,
  handleFormChange,
  disabled = false,
  canSubmit
}) => {
  return (
    <div className={disabled ? 'opacity-50 pointer-events-none transition-opacity' : 'opacity-100 transition-opacity'}>
      <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-200 mt-6">
        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
          <Wrench className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">Langkah 3: Detail Barang Baru</h3>
          <p className="text-xs text-slate-500">Isi spesifikasi barang dengan lengkap dan jelas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-bold text-slate-700">Nama Barang <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              type="text"
              name="toolName"
              value={formData.toolName}
              onChange={handleFormChange}
              placeholder="Contoh: Digital Torque Wrench 1/2 inch"
              className="w-full p-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <Wrench className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-bold text-slate-700">Link Gambar / Referensi <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleFormChange}
              placeholder="https://contoh.com/gambar-barang.jpg"
              className="w-full p-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Nama Vendor / Toko <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              type="text"
              name="vendorName"
              value={formData.vendorName}
              onChange={handleFormChange}
              placeholder="Contoh: PT Kawan Lama"
              className="w-full p-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Estimasi Harga (Satuan) <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleFormChange}
              placeholder="Contoh: 1500000"
              min="1"
              className="w-full p-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Kontak Vendor <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleFormChange}
              placeholder="No HP / Email Vendor"
              className="w-full p-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Ukuran / Dimensi Tools <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              type="text"
              name="dimensions"
              value={formData.dimensions}
              onChange={handleFormChange}
              placeholder="Contoh: 1/2 inch drive, 50cm"
              className="w-full p-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <Ruler className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Submit Action Button */}
      <div className="pt-6 mt-6 border-t border-slate-200">
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3.5 red-gradient-btn text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          <span>Kirim Request Non-Standard</span>
        </button>
      </div>
    </div>
  );
};
