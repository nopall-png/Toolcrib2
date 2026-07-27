'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/src/lib/store';
import { RestockItemState } from './types';
import { RefreshCw, Plus, Trash2, CheckCircle2, AlertCircle, Search, ChevronDown, X, Upload, Loader2, Sparkles } from 'lucide-react';

interface RestockFormProps {
  onSuccess: () => void;
}

export const RestockForm: React.FC<RestockFormProps> = ({ onSuccess }) => {
  const { tools, updateToolStock } = useAppStore();

  const [restockItems, setRestockItems] = useState<RestockItemState[]>([
    { toolId: tools[0]?.id || '', quantityAdded: 5, notes: 'Restock pasokan baru' },
  ]);
  const [activeRestockIndex, setActiveRestockIndex] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successAutoFill, setSuccessAutoFill] = useState<string | null>(null);

  // Auto-fill AI State
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const autoFillFileRef = useRef<HTMLInputElement>(null);

  // Custom Dropdown State
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddRestockRow = () => {
    const nextTool = tools[restockItems.length % tools.length] || tools[0];
    setRestockItems((prev) => [
      ...prev,
      { toolId: nextTool?.id || '', quantityAdded: 5, notes: 'Restock tambahan' },
    ]);
    setActiveRestockIndex(restockItems.length);
  };

  // ── AI Auto-Fill from PDF ───────────────────────────────────────
  const fuzzyMatchTool = (itemName: string) => {
    const lower = itemName.toLowerCase();
    // 1. Exact code match (e.g. TL-BOS-03)
    const codeMatch = tools.find(t => lower.includes(t.code.toLowerCase()));
    if (codeMatch) return codeMatch;
    // 2. Name substring match
    const nameMatch = tools.find(t => lower.includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(lower));
    if (nameMatch) return nameMatch;
    // 3. Word-by-word similarity: find the tool with most matching words
    const words = lower.split(/\s+/).filter(w => w.length > 2);
    let bestMatch: typeof tools[0] | null = null;
    let bestScore = 0;
    for (const tool of tools) {
      const toolWords = tool.name.toLowerCase().split(/\s+/);
      const score = words.filter(w => toolWords.some(tw => tw.includes(w) || w.includes(tw))).length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = tool;
      }
    }
    return bestScore >= 1 ? bestMatch : null;
  };

  const handleAutoFillFromPDF = async (file: File) => {
    setIsAutoFilling(true);
    setErrorMsg(null);
    setSuccessAutoFill(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:8000/api/parse-restock', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Gagal terhubung ke server AI.');

      const data = await res.json();

      if (data.status !== 'success' || !data.items?.length) {
        setErrorMsg(data.message || 'AI tidak menemukan item di dalam PDF.');
        setIsAutoFilling(false);
        return;
      }

      // Match extracted items to master data tools
      const newRows: RestockItemState[] = [];
      const unmatchedItems: string[] = [];

      for (const item of data.items) {
        const matchedTool = fuzzyMatchTool(item.name);
        if (matchedTool) {
          newRows.push({
            toolId: matchedTool.id,
            quantityAdded: item.quantity,
            notes: `Auto-fill dari PDF: ${file.name}`,
          });
        } else {
          unmatchedItems.push(item.name);
        }
      }

      if (newRows.length > 0) {
        setRestockItems(newRows);
        setActiveRestockIndex(0);
        setSuccessAutoFill(
          `Berhasil mengisi ${newRows.length} item dari PDF.` +
          (unmatchedItems.length > 0 ? ` (${unmatchedItems.length} item tidak ditemukan di master data)` : '')
        );
      } else {
        setErrorMsg('Tidak ada item dari PDF yang cocok dengan master data tools.');
      }
    } catch (err) {
      setErrorMsg('Gagal memproses PDF. Pastikan server AI Python sudah berjalan.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleRemoveRestockRow = (idx: number) => {
    if (restockItems.length === 1) return;
    const updated = restockItems.filter((_, i) => i !== idx);
    setRestockItems(updated);
    if (activeRestockIndex >= updated.length) {
      setActiveRestockIndex(updated.length - 1);
    }
  };

  const updateRestockRow = (field: keyof RestockItemState, value: any) => {
    setRestockItems((prev) =>
      prev.map((item, idx) => (idx === activeRestockIndex ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    for (let i = 0; i < restockItems.length; i++) {
      const item = restockItems[i];
      if (!item.toolId) {
        setActiveRestockIndex(i);
        setErrorMsg(`Pilih tool yang akan direstock pada Item #${i + 1}!`);
        return;
      }
      if (item.quantityAdded <= 0) {
        setActiveRestockIndex(i);
        setErrorMsg(`Jumlah stok masuk pada Item #${i + 1} harus lebih dari 0!`);
        return;
      }
    }

    restockItems.forEach((item) => {
      updateToolStock(item.toolId, Number(item.quantityAdded));
    });

    onSuccess();
  };

  const currentRestockItem = restockItems[activeRestockIndex] || restockItems[0];
  const selectedToolObject = tools.find((t) => t.id === currentRestockItem?.toolId) || tools[0];

  const filteredTools = tools.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center space-x-3 text-xs font-bold shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successAutoFill && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md flex items-center space-x-3 text-xs font-bold shadow-sm">
          <Sparkles className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successAutoFill} — Silakan crosscheck sebelum klik &quot;Update Data Stok&quot;.</span>
        </div>
      )}

      {/* Loading Overlay during AI processing */}
      {isAutoFilling && (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-md flex flex-col items-center justify-center space-y-3 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
          <p className="text-sm font-bold text-slate-700">AI sedang membaca dan menganalisis PDF...</p>
          <p className="text-xs text-slate-500">Proses ini membutuhkan beberapa detik.</p>
        </div>
      )}
      {/* Multi Restock Items Selector */}
      <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Daftar Barang Datang Yang Akan Ditambah Stoknya ({restockItems.length} Item)
          </span>

          <div className="flex items-center space-x-2">
            {/* AI Auto-Fill Button */}
            <input
              type="file"
              ref={autoFillFileRef}
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAutoFillFromPDF(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => autoFillFileRef.current?.click()}
              disabled={isAutoFilling}
              className="px-3.5 py-1.5 bg-slate-900 text-white hover:bg-slate-800 border border-slate-700 font-semibold rounded-md text-xs flex items-center space-x-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isAutoFilling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{isAutoFilling ? 'AI Memproses...' : 'Tambah Otomatis (PDF)'}</span>
            </button>

            {/* Manual Add Button */}
            <button
              type="button"
              onClick={handleAddRestockRow}
              className="px-3.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-semibold rounded-md text-xs flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Item Datang</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {restockItems.map((item, idx) => {
            const targetTool = tools.find((t) => t.id === item.toolId);
            return (
              <div
                key={idx}
                onClick={() => {
                  setActiveRestockIndex(idx);
                  setSearchQuery('');
                  setIsDropdownOpen(false);
                }}
                className={`px-3 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-2 shrink-0 border ${
                  activeRestockIndex === idx
                    ? 'bg-red-50 text-red-700 border-red-300 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Item #{idx + 1}: {targetTool ? targetTool.name : 'Pilih Barang'}</span>
                {restockItems.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveRestockRow(idx);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Restock Form Details */}
      <div className="bg-white p-6 sm:p-8 rounded-md border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
          <RefreshCw className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-bold text-slate-900">
            Form Penambahan Stok Barang Datang #{activeRestockIndex + 1}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Cari & Pilih Tool Dari Master Data *
            </label>
            
            <div 
              className="w-full bg-white border border-slate-300 rounded-md flex items-center justify-between cursor-pointer focus-within:ring-1 focus-within:ring-red-500 focus-within:border-red-500"
              onClick={() => setIsDropdownOpen(true)}
            >
              <div className="flex-1 flex items-center px-3 py-2.5">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Ketik nama atau kode tool..."
                  value={isDropdownOpen ? searchQuery : (selectedToolObject ? `[${selectedToolObject.code}] ${selectedToolObject.name}` : '')}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  className="w-full outline-none text-sm font-semibold text-slate-900 placeholder:text-slate-400 bg-transparent"
                />
              </div>
              <div className="px-3">
                {isDropdownOpen ? (
                  <X 
                    className="w-4 h-4 text-slate-400 hover:text-slate-600" 
                    onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); }}
                  />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 shadow-lg rounded-md max-h-60 overflow-y-auto">
                {filteredTools.length > 0 ? (
                  <ul className="py-1">
                    {filteredTools.map((t) => (
                      <li
                        key={t.id}
                        onClick={() => {
                          updateRestockRow('toolId', t.id);
                          setSearchQuery('');
                          setIsDropdownOpen(false);
                        }}
                        className={`px-4 py-2 text-sm cursor-pointer hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center justify-between ${
                          currentRestockItem?.toolId === t.id ? 'bg-red-50 text-red-700 font-bold' : 'text-slate-700 font-medium'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{t.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{t.code}</span>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          Stok: {t.stock} {t.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-sm text-slate-500 text-center font-medium">
                    Tidak ada tool ditemukan.
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Jumlah Stok Datang / Tambah *
            </label>
            <input
              type="number"
              min="1"
              value={currentRestockItem?.quantityAdded || ''}
              onChange={(e) => updateRestockRow('quantityAdded', Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-base font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>
        </div>

        {selectedToolObject && (
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-md flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="flex items-center space-x-4">
              <img
                src={selectedToolObject.imageUrl}
                alt={selectedToolObject.name}
                className="w-16 h-16 rounded-md object-cover border border-slate-300 shrink-0"
              />
              <div>
                <span className="font-mono text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                  {selectedToolObject.code}
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm mt-1">
                  {selectedToolObject.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kategori: <span className="font-semibold text-slate-700">{selectedToolObject.category}</span> | Lokasi: <span className="font-semibold text-slate-700">{selectedToolObject.location}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Keterangan / Nomor Surat Jalan (Opsional)
          </label>
          <input
            type="text"
            placeholder="Contoh: Penerimaan PO-2026-081 dari PT Precision Tools"
            value={currentRestockItem?.notes || ''}
            onChange={(e) => updateRestockRow('notes', e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-400"
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-100 border border-slate-200 rounded-md shadow-sm">
        <div>
          <h4 className="font-bold text-slate-900">Simpan Pembaruan Stok ({restockItems.length} Item)</h4>
          <p className="text-xs text-slate-500">Stok barang pada Master Data akan langsung bertambah.</p>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-2.5 rounded-md text-sm flex items-center justify-center space-x-2 shadow-sm transition-all shrink-0"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Update Data Stok</span>
        </button>
      </div>
    </form>
  );
};
