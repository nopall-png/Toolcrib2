'use client';

import React from 'react';
import { ItemFormState } from './types';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface NewToolImageUploadProps {
  item: ItemFormState;
  onUpdateField: (field: keyof ItemFormState, value: any) => void;
}

export const NewToolImageUpload: React.FC<NewToolImageUploadProps> = ({ item, onUpdateField }) => {
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateField('imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 bg-slate-50 border border-slate-200 rounded-md space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <ImageIcon className="w-4 h-4 text-slate-500" />
          <span>Foto / Gambar Barang</span>
        </label>
        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
          * WAJIB
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
        <div className="w-full h-40 rounded-md border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center p-2 text-center relative overflow-hidden">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt="Preview"
              className="w-full h-full object-contain rounded-md"
            />
          ) : (
            <div className="space-y-1 text-slate-400 flex flex-col items-center">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">Belum ada foto</span>
              <span className="text-[10px]">Pilih file foto atau isi URL</span>
            </div>
          )}
        </div>

        <div className="sm:col-span-2 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Upload File Foto</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileUpload}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Atau Masukkan URL Gambar (Direct Link)</label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/photo-..."
              value={item.imageUrl}
              onChange={(e) => onUpdateField('imageUrl', e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 font-mono"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <span className="text-[10px] text-slate-400 font-semibold">Preset Demo:</span>
            <button
              type="button"
              onClick={() =>
                onUpdateField(
                  'imageUrl',
                  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60'
                )
              }
              className="text-xs bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-md font-medium text-slate-700 shadow-xs transition-colors"
            >
              Measuring Tool
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateField(
                  'imageUrl',
                  'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=60'
                )
              }
              className="text-xs bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-md font-medium text-slate-700 shadow-xs transition-colors"
            >
              Power Tool
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
