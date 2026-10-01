'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Filter, AlertTriangle, BrainCircuit, CheckCircle2,
  Search, Loader2, ArrowRightLeft, GitMerge,
  Eye, ChevronDown, ChevronUp, RefreshCw, Zap, Shield,
  XCircle, CheckCircle, Info
} from 'lucide-react';
import { recordDuplicateDecision } from '@/src/lib/api-ai';

// ============================================================
// TYPES
// ============================================================

type ActionType = 'MERGE' | 'SUBSTITUTE' | 'KEEP_SEPARATE' | 'REVIEW';
type StockStatus = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'OPTIMAL' | 'OVERSTOCK';
type DuplicateTab = 'duplicates' | 'substitutes';

interface DuplicateRecord {
  sku1: string;
  desc1: string;
  fullDesc1: string;
  cat1: string;
  unit1: string;
  brand1: string;
  specs1: string;
  stock1: number;
  stockStatus1: StockStatus;
  price1: number;
  leadTime1: number;
  sku2: string;
  desc2: string;
  fullDesc2: string;
  cat2: string;
  unit2: string;
  brand2: string;
  specs2: string;
  stock2: number;
  stockStatus2: StockStatus;
  price2: number;
  leadTime2: number;
  score: number;
  specsMatchRate: number;
  matchAttributes: string;
  mismatchFields: string;
  priceDifference: string;
  stockComparison: string;
  attrComparison: AttrItem[];
  action: ActionType;
  actionLabel: string;
  verdict: string;
  status: 'PENDING' | 'MERGED' | 'IGNORED';
}

interface AttrItem {
  field: string;
  val1: string;
  val2: string;
  match: boolean;
}

interface SubstituteItem {
  sku_id: string;
  description: string;
  category: string;
  brand: string;
  specs: string;
  similarity_score: number;
  specs_match_rate: number;
  current_stock: number;
  stock_status: StockStatus;
  min_stock: number;
  max_stock: number;
  price: number;
  price_difference: string;
  lead_time_days: number;
  lead_time_comparison: string;
  image_url: string;
  action: string;
  reason: string;
}

interface SubstituteResult {
  sku_id: string;
  sku_name: string;
  category: string;
  brand: string;
  current_stock: number;
  stock_status: StockStatus;
  min_stock: number;
  max_stock: number;
  target_price: number;
  target_lead_time: number;
  specs: string;
  image_url: string;
  substitutes: SubstituteItem[];
  total_candidates: number;
  recommended_count: number;
  message: string;
}

interface DuplicatesResponse {
  status: string;
  summary: {
    total_pairs: number;
    action_breakdown: Record<string, number>;
    urgent_substitute_needed: number;
    merge_candidates: number;
    review_required: number;
    keep_separate: number;
    avg_similarity: number;
  };
  threshold_used: number;
  data: any[];
}

// ============================================================
// HELPERS
// ============================================================

function TabButton({
  label,
  isActive,
  onClick,
  icon,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
        isActive ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function isSubstitutesTab(tab: DuplicateTab): boolean {
  return tab === 'substitutes';
}

const STOCK_CONFIG: Record<StockStatus, { color: string; bg: string; label: string }> = {
  OUT_OF_STOCK: { color: 'text-red-600', bg: 'bg-red-100', label: 'KOSONG' },
  LOW_STOCK: { color: 'text-orange-600', bg: 'bg-orange-100', label: 'MENIPIS' },
  OPTIMAL: { color: 'text-green-600', bg: 'bg-green-100', label: 'TERSEDIA' },
  OVERSTOCK: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'BERLEBIH' }
};

const ACTION_CONFIG: Record<ActionType, { color: string; bg: string; icon: React.ReactNode; label: string; tip: string }> = {
  MERGE: {
    color: 'text-purple-700',
    bg: 'bg-purple-100 border-purple-200',
    icon: <GitMerge className="w-3.5 h-3.5" />,
    label: 'MERGE',
    tip: 'Kedua item adalah duplikat fisik. Staff toolcrib harus cek gudang dan menggabungkan stok.'
  },
  SUBSTITUTE: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-100 border-emerald-200',
    icon: <ArrowRightLeft className="w-3.5 h-3.5" />,
    label: 'SUBSTITUSI',
    tip: 'Item kosong bisa digantikan oleh item lain. Tidak perlu beli baru.'
  },
  KEEP_SEPARATE: {
    color: 'text-slate-700',
    bg: 'bg-slate-100 border-slate-200',
    icon: <Shield className="w-3.5 h-3.5" />,
    label: 'SIMPAN TERPISAH',
    tip: 'Item berbeda — jangan digabung. Simpan sebagai item terpisah.'
  },
  REVIEW: {
    color: 'text-amber-700',
    bg: 'bg-amber-100 border-amber-200',
    icon: <Eye className="w-3.5 h-3.5" />,
    label: 'REVIEW',
    tip: 'AI belum yakin. Staff harus cek manual di gudang.'
  }
};

function StockBadge({ status, stock }: { status: StockStatus; stock: number }) {
  const cfg = STOCK_CONFIG[status] || STOCK_CONFIG.OPTIMAL;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color} ${cfg.bg}`}>
      <span>{stock}</span>
      <span>{cfg.label}</span>
    </span>
  );
}

function ActionBadge({ action }: { action: ActionType }) {
  const cfg = ACTION_CONFIG[action] || ACTION_CONFIG.REVIEW;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${cfg.color} ${cfg.bg}`} title={cfg.tip}>
      {cfg.icon}
      <span>{cfg.label}</span>
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? 'bg-red-100 text-red-700' : score >= 65 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${color}`}>
      {score.toFixed(1)}%
    </span>
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  const configs = {
    success: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
    error: { bg: 'bg-red-50 border-red-200 text-red-800', icon: <XCircle className="w-5 h-5 text-red-500" /> },
    info: { bg: 'bg-blue-50 border-blue-200 text-blue-800', icon: <Info className="w-5 h-5 text-blue-500" /> }
  };
  const cfg = configs[type];
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-bold shadow-md animate-in fade-in slide-in-from-top-2 ${cfg.bg}`}>
      {cfg.icon}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="hover:opacity-70 transition-opacity">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}

function transformDuplicate(raw: any): DuplicateRecord {
  return {
    sku1: raw.SKU_1 || '',
    desc1: raw.Desc_1 || raw.Description || '',
    fullDesc1: raw.Full_Desc_1 || raw.full_description || '',
    cat1: raw.Category_1 || '-',
    unit1: raw.Unit_1 || '-',
    brand1: raw.Brand_1 || '-',
    specs1: raw.Specs_1 || '-',
    stock1: raw.Stock_1 ?? 0,
    stockStatus1: raw.Stock_Status_1 || 'OPTIMAL',
    price1: raw.Price_1 ?? 0,
    leadTime1: raw.Lead_Time_1 ?? 0,
    sku2: raw.SKU_2 || '',
    desc2: raw.Desc_2 || '',
    fullDesc2: raw.Full_Desc_2 || '',
    cat2: raw.Category_2 || '-',
    unit2: raw.Unit_2 || '-',
    brand2: raw.Brand_2 || '-',
    specs2: raw.Specs_2 || '-',
    stock2: raw.Stock_2 ?? 0,
    stockStatus2: raw.Stock_Status_2 || 'OPTIMAL',
    price2: raw.Price_2 ?? 0,
    leadTime2: raw.Lead_Time_2 ?? 0,
    score: raw.Similarity_Score ?? 0,
    specsMatchRate: raw.Specs_Match_Rate ?? 0,
    matchAttributes: raw.Match_Attributes || '0/0',
    mismatchFields: raw.Mismatch_Fields || '-',
    priceDifference: raw.Price_Difference || '-',
    stockComparison: raw.Stock_Comparison || '0 vs 0',
    attrComparison: raw.Attr_Comparison || [],
    action: raw.Action || 'REVIEW',
    actionLabel: raw.Action_Label || '',
    verdict: raw.Verdict || '',
    status: 'PENDING'
  };
}

// ============================================================
// SUBSTITUTE SEARCH TAB
// ============================================================

function SubstituteTab() {
  const [searchSku, setSearchSku] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [threshold, setThreshold] = useState(0.40);
  const [result, setResult] = useState<SubstituteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSku, setExpandedSku] = useState<string | null>(null);

  const fetchSubstitutes = async (sku: string) => {
    if (!sku.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `http://localhost:8000/api/ai/substitutes/${encodeURIComponent(sku)}?threshold=${threshold}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengambil data');
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    fetchSubstitutes(searchSku);
  };

  const filtered = result?.substitutes.filter(s => {
    const matchesSearch = !searchTerm ||
      s.sku_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-base">Cari Substitusi Barang</h3>
        </div>
        <p className="text-xs text-slate-500">
          Masukkan SKU barang yang kosong. AI akan mencari item pengganti berdasarkan kemiripan nama, spesifikasi, dan deskripsi.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchSku}
            onChange={e => setSearchSku(e.target.value)}
            placeholder="Ketik SKU, contoh: WR-001..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <select
          value={threshold}
          onChange={e => setThreshold(Number(e.target.value))}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-400 cursor-pointer bg-white"
        >
          <option value={0.30}>Similarity &gt; 30%</option>
          <option value={0.40}>Similarity &gt; 40%</option>
          <option value={0.50}>Similarity &gt; 50%</option>
          <option value={0.60}>Similarity &gt; 60%</option>
          <option value={0.70}>Similarity &gt; 70%</option>
        </select>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Cari
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-3 justify-center py-8 text-slate-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          <span>AI sedang menganalisis kemiripan...</span>
        </div>
      )}

      {result && !error && !isLoading && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-800 text-base">{result.sku_id}</span>
                  <StockBadge status={result.stock_status as StockStatus} stock={result.current_stock} />
                </div>
                <p className="text-sm text-slate-600 font-medium">{result.sku_name}</p>
                {result.specs && result.specs !== '-' && (
                  <p className="text-xs text-slate-400 mt-0.5 italic">{result.specs}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                  <span>Harga: <strong>Rp {result.target_price.toLocaleString('id-ID')}</strong></span>
                  <span>Lead Time: <strong>{result.target_lead_time} hari</strong></span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-slate-500">{result.total_candidates} kandidat</div>
                <div className="text-xs font-bold text-emerald-600">{result.recommended_count} direkomendasikan</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-emerald-700">{result.recommended_count}</div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase">Sangat Direkomendasikan</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-amber-700">
                {result.substitutes.filter(s => s.action === 'CONSIDER').length}
              </div>
              <div className="text-[10px] font-bold text-amber-600 uppercase">Pertimbangkan</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-slate-700">
                {result.total_candidates - result.recommended_count}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Lainnya</div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              Tidak ada kandidat pengganti ditemukan.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter hasil..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-400"
                />
              </div>

              {filtered.map((sub, i) => {
                const isExpanded = expandedSku === sub.sku_id;
                const actionColor = {
                  STRONGLY_RECOMMENDED: { color: 'emerald', bg: 'bg-emerald-50 border-emerald-200' },
                  CONSIDER: { color: 'blue', bg: 'bg-blue-50 border-blue-200' },
                  WEAK_RECOMMENDATION: { color: 'amber', bg: 'bg-amber-50 border-amber-200' },
                  LAST_RESORT: { color: 'slate', bg: 'bg-slate-50 border-slate-200' },
                  NOT_RECOMMENDED: { color: 'red', bg: 'bg-red-50 border-red-200' }
                }[sub.action] || { color: 'slate', bg: 'bg-slate-50 border-slate-200' };

                return (
                  <div key={i} className={`border rounded-xl overflow-hidden transition-all ${actionColor.bg}`}>
                    <button
                      onClick={() => setExpandedSku(isExpanded ? null : sub.sku_id)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/50 transition-colors"
                    >
                      <div className={`w-1.5 h-12 rounded-full shrink-0 ${
                        sub.action === 'STRONGLY_RECOMMENDED' ? 'bg-emerald-500' :
                        sub.action === 'CONSIDER' ? 'bg-blue-500' :
                        sub.action === 'WEAK_RECOMMENDATION' ? 'bg-amber-500' :
                        sub.action === 'NOT_RECOMMENDED' ? 'bg-red-400' : 'bg-slate-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm">{sub.sku_id}</span>
                          <StockBadge status={sub.stock_status as StockStatus} stock={sub.current_stock} />
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                            Similarity: {sub.similarity_score.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 truncate">{sub.description}</p>
                      </div>
                      <div className="shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-black/5 pt-3 space-y-3">
                        <div className={`text-xs font-bold p-3 rounded-lg border ${
                          sub.action === 'STRONGLY_RECOMMENDED' ? 'bg-emerald-100 border-emerald-200 text-emerald-700' :
                          sub.action === 'NOT_RECOMMENDED' ? 'bg-red-100 border-red-200 text-red-700' :
                          'bg-blue-50 border-blue-200 text-blue-700'
                        }`}>
                          {sub.action === 'STRONGLY_RECOMMENDED' ? '⭐ ' : sub.action === 'NOT_RECOMMENDED' ? '⚠️ ' : ''}
                          {sub.reason}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          {[
                            ['Harga', `Rp ${sub.price.toLocaleString('id-ID')}`],
                            ['Selisih Harga', sub.price_difference],
                            ['Lead Time', `${sub.lead_time_days} hari`],
                            ['Perbandingan LT', sub.lead_time_comparison],
                            ['Specs Match', `${sub.specs_match_rate.toFixed(0)}%`],
                            ['Stok', `${sub.current_stock} unit`],
                            ['Kategori', sub.category],
                            ['Brand', sub.brand !== '-' ? sub.brand : '-'],
                          ].map(([label, val]) => (
                            <div key={label} className="bg-white/60 rounded-lg p-2">
                              <div className="text-slate-500 font-medium">{label}</div>
                              <div className="font-bold text-slate-800 truncate" title={val}>{val}</div>
                            </div>
                          ))}
                        </div>
                        {sub.specs && sub.specs !== '-' && (
                          <div className="text-xs">
                            <span className="font-semibold text-slate-600">Spesifikasi: </span>
                            <span className="text-slate-700">{sub.specs}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// DETAIL PANEL COMPONENT
// ============================================================

function DetailPanel({
  item,
  onClose,
  onAction,
}: {
  item: DuplicateRecord;
  onClose: () => void;
  onAction: (actionType: 'MERGE' | 'IGNORE' | 'SUBSTITUTE', label: string) => void;
}) {
  const cfg = ACTION_CONFIG[item.action] || ACTION_CONFIG.REVIEW;
  const verdictBg = item.score >= 85 ? 'bg-red-50 border-red-200' : item.score >= 65 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200';
  const verdictColor = item.score >= 85 ? 'text-red-700' : item.score >= 65 ? 'text-amber-700' : 'text-green-700';

  return (
    <div className="flex flex-col max-h-[75vh]">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-4">

        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-600 shrink-0" />
            <h4 className="font-bold text-slate-800 text-base">Analisis AI</h4>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* AI Verdict */}
        {item.verdict && (
          <div className={`p-4 rounded-xl border text-sm font-medium leading-relaxed ${verdictBg} ${verdictColor} shrink-0`}>
            <p className="whitespace-pre-wrap break-words">{item.verdict}</p>
          </div>
        )}

        {/* Action Recommendation */}
        <div className={`p-3 rounded-xl border text-sm font-bold shrink-0 ${cfg.color} ${cfg.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            {cfg.icon}
            <span>Rekomendasi: {cfg.label}</span>
          </div>
          <p className="font-normal text-xs opacity-80 leading-relaxed">{cfg.tip}</p>
        </div>

        {/* 2-Column Item Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
          {/* Item 1 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between min-w-0">
              <span className="font-bold text-slate-800 text-base truncate">{item.sku1}</span>
              <StockBadge status={item.stockStatus1} stock={item.stock1} />
            </div>
            <p className="text-sm font-semibold text-slate-700 leading-snug break-words">{item.desc1}</p>
            {item.fullDesc1 && item.fullDesc1 !== item.desc1 && (
              <p className="text-xs text-slate-500 italic leading-snug break-words">{item.fullDesc1}</p>
            )}
            <div className="space-y-1 pt-1 border-t border-blue-200/50">
              {[
                ['Kategori', item.cat1],
                ['Satuan', item.unit1],
                ['Harga', `Rp ${item.price1.toLocaleString('id-ID')}`],
                ['Lead Time', `${item.leadTime1} hari`],
                ['Specs', item.specs1 !== '-' ? item.specs1 : 'Tidak ada'],
              ].map(([label, val]) => (
                <div key={label} className="flex items-start gap-2 text-xs min-w-0">
                  <span className="text-slate-500 font-medium shrink-0 w-16">{label}:</span>
                  <span className="text-slate-700 font-semibold leading-snug break-words flex-1 min-w-0">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Item 2 */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between min-w-0">
              <span className="font-bold text-slate-800 text-base truncate">{item.sku2}</span>
              <StockBadge status={item.stockStatus2} stock={item.stock2} />
            </div>
            <p className="text-sm font-semibold text-slate-700 leading-snug break-words">{item.desc2}</p>
            {item.fullDesc2 && item.fullDesc2 !== item.desc2 && (
              <p className="text-xs text-slate-500 italic leading-snug break-words">{item.fullDesc2}</p>
            )}
            <div className="space-y-1 pt-1 border-t border-amber-200/50">
              {[
                ['Kategori', item.cat2],
                ['Satuan', item.unit2],
                ['Harga', `Rp ${item.price2.toLocaleString('id-ID')}`],
                ['Lead Time', `${item.leadTime2} hari`],
                ['Specs', item.specs2 !== '-' ? item.specs2 : 'Tidak ada'],
              ].map(([label, val]) => (
                <div key={label} className="flex items-start gap-2 text-xs min-w-0">
                  <span className="text-slate-500 font-medium shrink-0 w-16">{label}:</span>
                  <span className="text-slate-700 font-semibold leading-snug break-words flex-1 min-w-0">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Price & Stock Comparison */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
            <div className="text-[10px] text-slate-500 font-medium">Selisih Harga</div>
            <div className="text-xs font-bold text-slate-800 leading-snug break-words">{item.priceDifference}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
            <div className="text-[10px] text-slate-500 font-medium">Perbandingan Stok</div>
            <div className="text-xs font-bold text-slate-800">{item.stockComparison}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
            <div className="text-[10px] text-slate-500 font-medium">Specs Match</div>
            <div className="text-xs font-bold text-slate-800">{item.specsMatchRate.toFixed(0)}%</div>
          </div>
        </div>

        {/* Attribute Comparison Table */}
        {item.attrComparison.length > 0 && (
          <div className="shrink-0">
            <p className="text-xs font-bold text-slate-600 mb-2">Perbandingan Atribut</p>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 text-left font-bold text-slate-600 w-20 shrink-0">Atribut</th>
                    <th className="p-2 text-left font-bold text-blue-600 min-w-0 break-words">{item.sku1}</th>
                    <th className="p-2 text-left font-bold text-amber-600 min-w-0 break-words">{item.sku2}</th>
                    <th className="p-2 text-center font-bold text-slate-600 w-10 shrink-0">Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {item.attrComparison.map((attr, ai) => (
                    <tr key={ai} className={attr.match ? 'bg-emerald-50/30' : 'bg-red-50/30'}>
                      <td className="p-2 font-semibold text-slate-700 shrink-0">{attr.field}</td>
                      <td className="p-2 text-slate-600 leading-snug break-words min-w-0">{attr.val1}</td>
                      <td className="p-2 text-slate-600 leading-snug break-words min-w-0">{attr.val2}</td>
                      <td className="p-2 text-center shrink-0">{attr.match ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mismatch Fields */}
        {item.mismatchFields && item.mismatchFields !== '-' && (
          <div className="text-xs text-slate-500 leading-snug break-words shrink-0">
            <span className="font-semibold">Perbedaan ditemukan: </span>
            <span>{item.mismatchFields}</span>
          </div>
        )}
      </div>

      {/* Sticky Action Buttons — always visible at bottom */}
      <div className="shrink-0 border-t border-indigo-100 pt-3 mt-1 bg-indigo-50/50 -mx-1 px-1">
        <p className="text-xs font-semibold text-slate-500 mb-2">Pilih tindakan untuk kedua item ini:</p>
        <div className="flex flex-wrap gap-2">
          {item.action === 'MERGE' && (
            <button onClick={() => onAction('MERGE', 'Merge Duplikat')}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs hover:bg-purple-700 flex items-center gap-1.5 shrink-0">
              <GitMerge className="w-3.5 h-3.5" /> Merge Duplikat
            </button>
          )}
          {(item.action === 'SUBSTITUTE' || item.stockStatus1 === 'OUT_OF_STOCK' || item.stockStatus2 === 'OUT_OF_STOCK') && (
            <button onClick={() => onAction('SUBSTITUTE', 'Setuju Substitusi')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 flex items-center gap-1.5 shrink-0">
              <ArrowRightLeft className="w-3.5 h-3.5" /> Setuju Substitusi
            </button>
          )}
          <button onClick={() => onAction('IGNORE', 'Tolak')}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 shrink-0">
            <XCircle className="w-3.5 h-3.5" /> Bukan Duplikat
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export const DuplicateDetectionTab = () => {
  const [activeTab, setActiveTab] = useState<DuplicateTab>('duplicates');
  const [filterThreshold, setFilterThreshold] = useState(40);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateRecord[]>([]);
  const [summary, setSummary] = useState<DuplicatesResponse['summary'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ idx: number; actionType: 'MERGE' | 'IGNORE' | 'SUBSTITUTE'; label: string; notes: string } | null>(null);

  // Front-end cache: simpan hasil per threshold agar tidak re-fetch
  const cacheRef = React.useRef<Map<number, { data: DuplicateRecord[]; summary: DuplicatesResponse['summary'] | null }>>(new Map());

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchData = useCallback(async (thresholdValue: number) => {
    // Cek cache dulu
    const cached = cacheRef.current.get(thresholdValue);
    if (cached) {
      setDuplicates(cached.data);
      setSummary(cached.summary);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/ai/duplicates?threshold=${thresholdValue / 100}`
      );
      if (!response.ok) throw new Error('Failed to fetch');
      const result: DuplicatesResponse = await response.json();

      if (result.status === 'success') {
        const records = result.data.map(transformDuplicate);
        setDuplicates(records);
        setSummary(result.summary);
        // Simpan ke cache
        cacheRef.current.set(thresholdValue, { data: records, summary: result.summary });
      }
    } catch (error) {
      console.error('Error fetching duplicates:', error);
      showToast('Gagal mengambil data. Pastikan backend Predictive AI berjalan.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'duplicates') {
      fetchData(filterThreshold);
    }
  }, [activeTab, filterThreshold, fetchData]);

  const handleThresholdChange = (value: number) => {
    setFilterThreshold(value);
    setExpandedItem(null);
  };

  const handleRefresh = () => {
    // Clear cache untuk threshold ini dan refetch
    cacheRef.current.delete(filterThreshold);
    setIsRefreshing(true);
    fetchData(filterThreshold);
  };

  const filteredDuplicates = duplicates.filter(item => {
    if (item.status !== 'PENDING') return false;
    if (item.score < filterThreshold) return false;
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      item.sku1.toLowerCase().includes(s) ||
      item.sku2.toLowerCase().includes(s) ||
      item.desc1.toLowerCase().includes(s) ||
      item.desc2.toLowerCase().includes(s)
    );
  });

  const handleActionClick = (idx: number, actionType: 'MERGE' | 'IGNORE' | 'SUBSTITUTE', label: string) => {
    setConfirmAction({ idx, actionType, label, notes: '' });
    setExpandedItem(null);
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    const { idx, actionType, notes } = confirmAction;
    const newDuplicates = [...duplicates];
    const targetItem = newDuplicates[idx];
    const targetIdx = duplicates.indexOf(targetItem);

    try {
      await recordDuplicateDecision({
        sku1: targetItem.sku1,
        sku2: targetItem.sku2,
        action: actionType,
        similarityScore: targetItem.score,
        notes: notes || undefined,
      });
    } catch {
      // API gagal — tetap lanjut update UI, tapi tampilkan error
      showToast(`⚠️ Gagal menyimpan ke database. Keputusan tetap dicatat secara lokal.`, 'error');
    }

    if (actionType === 'MERGE') {
      newDuplicates[targetIdx] = { ...targetItem, status: 'MERGED' };
      showToast(`✅ Merge disimpan! ${targetItem.sku1} dan ${targetItem.sku2} ditandai sebagai duplikat.`, 'success');
    } else if (actionType === 'SUBSTITUTE') {
      newDuplicates[targetIdx] = { ...targetItem, status: 'IGNORED' };
      showToast(`🔄 Substitusi disimpan! ${targetItem.sku1} ← gunakan ${targetItem.sku2} sebagai pengganti.`, 'info');
    } else {
      newDuplicates[targetIdx] = { ...targetItem, status: 'IGNORED' };
      showToast(`❌ Ditolak! ${targetItem.sku1} dan ${targetItem.sku2} disimpan sebagai item berbeda.`, 'info');
    }

    setDuplicates(newDuplicates);
    setExpandedItem(null);
    setConfirmAction(null);
  };

  // ============================================================
  // RENDER: LOADING
  // ============================================================
  if (isLoading && activeTab === 'duplicates') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <div className="text-center space-y-1">
          <p className="font-semibold text-slate-600 text-sm">AI sedang menganalisis kemiripan barang...</p>
          <p className="text-xs text-slate-400">Embedding deskripsi + cosine similarity sedang diproses</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: SUBSTITUTE TAB
  // ============================================================
  if (activeTab === 'substitutes') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('duplicates')}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            ← Kembali ke Deteksi Duplikat
          </button>
        </div>
        <SubstituteTab />
      </div>
    );
  }

  // ============================================================
  // RENDER: DUPLICATES TAB
  // ============================================================
  return (
    <div className="space-y-4">

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          <TabButton
            label="Deteksi Duplikat"
            isActive={activeTab === 'duplicates'}
            onClick={() => setActiveTab('duplicates')}
          />
          <TabButton
            label="Cari Substitusi"
            isActive={isSubstitutesTab(activeTab)}
            onClick={() => setActiveTab('substitutes')}
            icon={<ArrowRightLeft className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-red-700">{summary.urgent_substitute_needed}</div>
            <div className="text-[9px] font-bold text-red-600 uppercase">Urgent ⚠️</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-purple-700">{summary.merge_candidates}</div>
            <div className="text-[9px] font-bold text-purple-600 uppercase">Merge</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-emerald-700">
              {(summary.action_breakdown['SUBSTITUTE'] || 0)}
            </div>
            <div className="text-[9px] font-bold text-emerald-600 uppercase">Substitusi</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-amber-700">{summary.review_required}</div>
            <div className="text-[9px] font-bold text-amber-600 uppercase">Review</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-slate-700">{summary.total_pairs}</div>
            <div className="text-[9px] font-bold text-slate-500 uppercase">Total Pasangan</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-indigo-700">{summary.avg_similarity}%</div>
            <div className="text-[9px] font-bold text-indigo-600 uppercase">Avg Similarity</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Potensi Barang Ganda</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            AI menganalisis kemiripan nama, spesifikasi, dan deskripsi barang.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none w-28 placeholder:font-normal"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterThreshold}
              onChange={e => handleThresholdChange(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={30}>Semua (&gt;30%)</option>
              <option value={40}>Mirip (&gt;40%)</option>
              <option value={60}>Cukup (&gt;60%)</option>
              <option value={80}>Sangat (&gt;80%)</option>
              <option value={90}>Identik (&gt;90%)</option>
            </select>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
            title="Refresh (dari cache)"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xl whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-sm border-b border-slate-200">
            <tr>
              <th className="p-3">Item 1</th>
              <th className="p-3">Item 2</th>
              <th className="p-3">Similarity</th>
              <th className="p-3">Rekomendasi AI</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDuplicates.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-500 text-sm space-y-2">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                    <span>Tidak ada potensi barang ganda ditemukan.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDuplicates.map((item) => {
                const realIdx = duplicates.indexOf(item);
                return (
                  <React.Fragment key={realIdx}>
                    {/* Main Row */}
                    <tr className={`hover:bg-slate-50 transition-colors ${item.status !== 'PENDING' ? 'opacity-40' : ''}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-700 text-sm">{item.sku1}</span>
                              <StockBadge status={item.stockStatus1} stock={item.stock1} />
                            </div>
                            <span className="text-xs text-slate-500 block truncate max-w-[160px]">{item.desc1}</span>
                            {item.fullDesc1 && item.fullDesc1 !== item.desc1 && (
                              <span className="text-[10px] text-slate-400 italic block truncate max-w-[160px]">{item.fullDesc1}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700 text-sm">{item.sku2}</span>
                          <StockBadge status={item.stockStatus2} stock={item.stock2} />
                        </div>
                        <span className="text-xs text-slate-500 block truncate max-w-[160px]">{item.desc2}</span>
                        {item.fullDesc2 && item.fullDesc2 !== item.desc2 && (
                          <span className="text-[10px] text-slate-400 italic block truncate max-w-[160px]">{item.fullDesc2}</span>
                        )}
                      </td>

                      <td className="p-3">
                        <ScoreBadge score={item.score} />
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.specsMatchRate.toFixed(0)}% specs match</div>
                        <div className="text-[10px] text-slate-500">{item.priceDifference}</div>
                      </td>

                      <td className="p-3">
                        <ActionBadge action={item.action} />
                        <div className="text-[10px] text-slate-400 mt-1">{ACTION_CONFIG[item.action]?.tip}</div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setExpandedItem(expandedItem === realIdx ? null : realIdx)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                              expandedItem === realIdx
                                ? 'bg-indigo-600 text-white'
                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                            }`}
                          >
                            {expandedItem === realIdx ? 'Tutup' : 'Detail'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {expandedItem === realIdx && item.status === 'PENDING' && (
                      <tr className="bg-indigo-50/30">
                        <td colSpan={5} className="p-6 border-t border-indigo-100">
                          {confirmAction?.idx === realIdx ? (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                              <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                                <AlertTriangle className="w-5 h-5" />
                                <span>Konfirmasi: {confirmAction.label}</span>
                              </div>
                              <p className="text-xs text-red-600">
                                {confirmAction.actionType === 'MERGE'
                                  ? `Item ${item.sku1} dan ${item.sku2} akan ditandai sebagai DUPLIKAT.`
                                  : confirmAction.actionType === 'SUBSTITUTE'
                                  ? `Item ${item.sku1} akan menggunakan ${item.sku2} sebagai pengganti.`
                                  : `Item ${item.sku1} dan ${item.sku2} akan disimpan sebagai BARANG BERBEDA.`}
                              </p>
                              <div>
                                <label className="text-[10px] font-bold text-red-500 block mb-1">Catatan (opsional):</label>
                                <textarea
                                  value={confirmAction.notes}
                                  onChange={e => setConfirmAction(prev => prev ? { ...prev, notes: e.target.value } : null)}
                                  placeholder="Tambahkan catatan jika perlu..."
                                  rows={2}
                                  className="w-full px-3 py-1.5 border border-red-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-red-400 resize-none"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => setConfirmAction(null)}
                                  className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100">
                                  Batal
                                </button>
                                <button onClick={executeAction}
                                  className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700">
                                  Ya, Konfirmasi
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="overflow-y-auto max-h-[75vh]">
                              <DetailPanel
                                item={item}
                                onClose={() => setExpandedItem(null)}
                                onAction={(actionType, label) => {
                                  const ri = duplicates.indexOf(item);
                                  handleActionClick(ri, actionType, label);
                                }}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    )}

                    {/* Confirmed/Merged Row Indicator */}
                    {item.status !== 'PENDING' && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={5} className="p-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            {item.status === 'MERGED' ? (
                              <>
                                <GitMerge className="w-3.5 h-3.5 text-purple-500" />
                                <span>Duplikat dikonfirmasi</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                                <span>Item disimpan terpisah</span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
        <span className="font-semibold">Legenda:</span>
        {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
          <div key={key} className={`flex items-center gap-1 px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
            {cfg.icon}
            <span>{cfg.label}</span>
          </div>
        ))}
        <span className="text-slate-300">|</span>
        <span>AI analysis di-cache per threshold</span>
        <span className="text-slate-300">|</span>
        <span>Ganti filter = load baru, filter sama = dari cache</span>
      </div>
    </div>
  );
};
