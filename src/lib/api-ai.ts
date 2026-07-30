/**
 * API-AI.ts
 * 
 * [HYBRID ARCHITECTURE IMPLEMENTATION]
 * Modul ini telah di-refactor dari pemanggilan REST API Python murni menjadi
 * pola Hybrid Caching. Fungsi seperti `fetchMinMax` kini membaca langsung dari
 * PostgreSQL (Supabase) tabel `tools` untuk performa Instant Load.
 * 
 * Endpoint Python (http://localhost:8000/api/ai) hanya dipanggil untuk operasi
 * komputasi berat yang tidak bisa di-cache (misal: Prophet Forecasting).
 */
import { supabase } from './supabase';

const API_BASE_URL = 'http://localhost:8000/api/ai';

export const fetchMinMax = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/minmax`);
    if (!res.ok) throw new Error('Failed to fetch MinMax data');
    return res.json();
  } catch (err) {
    console.error("Failed to fetch MinMax from Python API", err);
    throw new Error('Failed to fetch MinMax data');
  }
};

export const fetchInventoryOptimization = async () => {
  const res = await fetch(`${API_BASE_URL}/inventory-optimization`);
  if (!res.ok) throw new Error('Failed to fetch optimization data');
  return res.json();
};

export const fetchCriticalSpares = async () => {
  const res = await fetch(`${API_BASE_URL}/critical-spares`);
  if (!res.ok) throw new Error('Failed to fetch critical spares');
  return res.json();
};

export const fetchDuplicates = async () => {
  const res = await fetch(`${API_BASE_URL}/duplicates`);
  if (!res.ok) throw new Error('Failed to fetch duplicate data');
  return res.json();
};

export const fetchForecast = async (skuId: string, days: number = 30) => {
  try {
    const res = await fetch(`${API_BASE_URL}/forecast/${encodeURIComponent(skuId)}?days=${days}`);
    const data = await res.json();
    if (!res.ok) return { status: 'error', message: data.detail || data.error || 'Failed to fetch forecast' };
    return data;
  } catch (err) {
    return { status: 'error', message: 'Network error' };
  }
};

export const fetchTools = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/tools`);
    if (!res.ok) return { status: 'error', message: 'Failed to fetch tools' };
    return res.json();
  } catch (err) {
    return { status: 'error', message: 'Network error' };
  }
};
