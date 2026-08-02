'use client';

import React, { createContext, useContext, useState } from 'react';
import type { ToolItem, ProcurementRequest } from '@/src/types';
import { supabase } from '../supabase';

// ============================================================
// Procurement Store — Procurement requests & procurement cart
// ============================================================

export interface ProcurementContextType {
  procurementRequests: ProcurementRequest[];
  setProcurementRequests: React.Dispatch<React.SetStateAction<ProcurementRequest[]>>;
  createProcurementRequest: (
    data: any,
    session: { userName?: string; employeeId?: string },
    users: { id: string; employeeId: string }[]
  ) => Promise<{ success: boolean; message?: string; newPrs?: ProcurementRequest[]; newPr?: ProcurementRequest }>;
  updateProcurementStatus: (prId: string, status: ProcurementRequest['status']) => Promise<{ success: boolean; message?: string }>;
  procurementCart: ToolItem[];
  procurementCartQtys: Record<string, number>;
  addToProcurementCart: (tool: ToolItem, qty: number) => void;
  updateProcurementCartQty: (toolId: string, qty: number) => void;
  clearProcurementCart: () => void;
}

const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

export const ProcurementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>([]);
  const [procurementCart, setProcurementCart] = useState<ToolItem[]>([]);
  const [procurementCartQtys, setProcurementCartQtys] = useState<Record<string, number>>({});

  const createProcurementRequest = async (
    data: any,
    session: { userName?: string; employeeId?: string },
    users: { id: string; employeeId: string }[]
  ) => {
    try {
      const currentUser = users.find(u => u.employeeId === session.employeeId);
      const isBatch = Array.isArray(data);
      const itemsPayload = isBatch ? data.map((item: any) => ({ toolId: item.toolId, quantity: item.quantity })) : [{ toolId: data.toolId, quantity: data.quantity }];

      const res = await fetch('/api/procurement/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsPayload,
          requestedById: currentUser ? currentUser.id : null,
        }),
      });

      const apiData = await res.json();

      if (!apiData.success) {
        console.error('Failed to create PR API:', apiData.message);
        return { success: false, message: apiData.message };
      }

      const prDataArray = Array.isArray(apiData.data) ? apiData.data : [apiData.data];
      
      const newPrs: ProcurementRequest[] = prDataArray.map((prData: any, index: number) => {
        const itemData = isBatch ? data[index] : data;
        return {
          id: prData.id, poNo: prData.po_no, ...itemData,
          requestedBy: session.userName || 'Toolcrib Staff',
          status: 'Pending', requestDate: new Date(prData.request_date).toISOString().substring(0, 10),
        };
      });

      setProcurementRequests((prev) => [...newPrs, ...prev]);
      return { success: true, newPrs, newPr: newPrs[0] }; // newPr kept for backward compatibility if needed
    } catch (e: any) {
      console.error('Exception in createProcurementRequest:', e);
      return { success: false, message: e.message || 'Terjadi kesalahan sistem' };
    }
  };

  const updateProcurementStatus = async (prId: string, status: ProcurementRequest['status']) => {
    try {
      const res = await fetch('/api/procurement/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prId, status }),
      });
      const apiData = await res.json();
      
      if (!apiData.success) {
        console.error('Failed to update PR status API:', apiData.message);
        return { success: false, message: apiData.message };
      }
      
      setProcurementRequests((prev) => prev.map((pr) => pr.id === prId ? { ...pr, status } : pr));
      return { success: true };
    } catch (e: any) {
      console.error('Exception in updateProcurementStatus:', e);
      return { success: false, message: e.message };
    }
  };

  const addToProcurementCart = (tool: ToolItem, qty: number) => {
    setProcurementCart(prev => {
      if (!prev.find(t => t.id === tool.id)) return [...prev, tool];
      return prev;
    });
    setProcurementCartQtys(prev => ({ ...prev, [tool.id]: qty }));
  };

  const updateProcurementCartQty = (toolId: string, qty: number) => {
    if (qty <= 0) {
      setProcurementCart(prev => prev.filter(t => t.id !== toolId));
      setProcurementCartQtys(prev => { const n = { ...prev }; delete n[toolId]; return n; });
      return;
    }
    setProcurementCartQtys(prev => ({ ...prev, [toolId]: qty }));
  };

  const clearProcurementCart = () => {
    setProcurementCart([]);
    setProcurementCartQtys({});
  };

  return (
    <ProcurementContext.Provider value={{
      procurementRequests, setProcurementRequests,
      createProcurementRequest, updateProcurementStatus,
      procurementCart, procurementCartQtys,
      addToProcurementCart, updateProcurementCartQty, clearProcurementCart
    }}>
      {children}
    </ProcurementContext.Provider>
  );
};

export const useProcurementStore = () => {
  const context = useContext(ProcurementContext);
  if (!context) throw new Error('useProcurementStore must be used within ProcurementProvider');
  return context;
};
