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
    <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl space-y-6">
      <div className="flex items-center justify-between">
        <label className="text-xl font-bold text-slate-900 flex items-center space-x-3">
          <ImageIcon className="w-6 h-6 text-slate-500" />
          <span>Foto / Gambar Barang</span>
        </label>
        <span className="text-sm font-bold text-slate-500 bg-slate-200 border border-slate-300 px-3 py-1 rounded-md">
          OPSIONAL
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-center">
        <div className="w-full h-56 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt="Preview"
              className="w-full h-full object-contain rounded-xl"
            />
          ) : (
            <div className="space-y-2 text-slate-400 flex flex-col items-center">
              <Upload className="w-10 h-10 text-slate-400" />
              <span className="text-base font-semibold text-slate-500">Belum ada foto</span>
              <span className="text-sm">Pilih file foto atau isi URL</span>
            </div>
          )}
        </div>

        <div className="sm:col-span-2 space-y-6">
          <div>
            <label className="block text-base font-semibold text-slate-700 mb-2">Upload File Foto</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileUpload}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-slate-700 mb-2">Atau Masukkan URL Gambar (Direct Link)</label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/photo-..."
              value={item.imageUrl}
              onChange={(e) => onUpdateField('imageUrl', e.target.value)}
              className="w-full px-5 py-4 bg-white border border-slate-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 font-mono"
            />
          </div>

          <div className="flex items-center space-x-3 pt-3">
            <span className="text-sm text-slate-400 font-semibold">Preset Demo:</span>
            <button
              type="button"
              onClick={() =>
                onUpdateField(
                  'imageUrl',
                  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60'
                )
              }
              className="text-base bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium text-slate-700 shadow-xs transition-colors"
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
              className="text-base bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium text-slate-700 shadow-xs transition-colors"
            >
              Power Tool
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
