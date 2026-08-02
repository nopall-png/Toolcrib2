'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/src/lib/store';
import { ToolItem } from '@/src/lib/mock';

export function useToolFilter() {
  const { tools, session } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Dynamically extract categories from the database (via tools state)
  const categories = useMemo(() => {
    // Get unique, non-empty categories from tools
    const uniqueCategories = new Set(
      tools
        .map((t) => t.category)
        .filter((cat) => typeof cat === 'string' && cat.trim() !== '')
    );
    
    // Sort them alphabetically, and always put 'All' at the front
    const baseCategories = ['All', ...Array.from(uniqueCategories).sort()];

    // Jika role staff (TOOLCRIB/PROCUREMENT), tampilkan tambahan kategori 'Uncategorized'
    // untuk keperluan filter barang yang belum dikategorikan di master data
    if ((session.role === 'TOOLCRIB' || session.role === 'PROCUREMENT') && !baseCategories.includes('Uncategorized')) {
      return [...baseCategories, 'Uncategorized'];
    }

    return baseCategories;
  }, [tools, session.role]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      // 1. Filter by category
      const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
      
      // 2. Filter by search query (Name, Code, Location)
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        (tool.name || '').toLowerCase().includes(query) ||
        (tool.code || '').toLowerCase().includes(query) ||
        (tool.location || '').toLowerCase().includes(query);

      // Perbedaan logika per role bisa ditambahkan di sini (contoh: menyembunyikan item tertentu bagi User biasa)
      // if (session.role === 'USER' && tool.status === 'Archived') return false;

      return matchesCategory && matchesSearch;
    });
  }, [tools, selectedCategory, searchQuery, session.role]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredTools,
  };
}
