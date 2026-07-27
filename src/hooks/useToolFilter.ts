'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/src/lib/store';
import { ToolItem } from '@/src/lib/mock';

export function useToolFilter() {
  const { tools, session } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Role-specific categories
  const categories = useMemo(() => {
    const baseCategories = [
      'All',
      'Power Tools',
      'Measuring Tools',
      'Hand Tools',
      'Safety & PPE',
      'Consumables',
      'Molding & Dies',
    ];

    // Perbedaan filter berdasarkan role:
    // Jika role staff (TOOLCRIB/PROCUREMENT), tampilkan tambahan kategori spesifik (contoh)
    if (session.role === 'TOOLCRIB' || session.role === 'PROCUREMENT') {
      return [...baseCategories, 'Uncategorized'];
    }

    // Jika role USER, kembalikan base categories
    return baseCategories;
  }, [session.role]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      // 1. Filter by category
      const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
      
      // 2. Filter by search query (Name, Code, Location)
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        tool.name.toLowerCase().includes(query) ||
        tool.code.toLowerCase().includes(query) ||
        tool.location.toLowerCase().includes(query);

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
