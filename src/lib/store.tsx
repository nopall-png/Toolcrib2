'use client';

// ============================================================
// store.tsx — Combined Provider & Backward-Compatible Facade
// ============================================================
// File ini menjadi "lem" yang menyatukan semua Context modular
// menjadi satu `useAppStore()` hook yang familiar.
//
// SEMUA komponen existing TIDAK PERLU DIUBAH import-nya.
// Mereka tetap memanggil `useAppStore()` seperti biasa.
// ============================================================

import React from 'react';
import type { ProcurementRequest } from '@/src/types';

// Re-export types so existing `import { ... } from './mock'` 
// paths can eventually be migrated to `from '@/src/types'`
export type {
  Department, ToolItem, UserRequest, UserRequestItem,
  ProcurementRequest, AppUser, Approver
} from '@/src/types';
export { INITIAL_APPROVERS } from '@/src/types';

// Import modular stores
import { AuthProvider, useAuthStore, type UserRole, type UserSession } from './stores/authStore';
import { DataProvider, useDataStore } from './stores/dataStore';
import { CartProvider, useCartStore } from './stores/cartStore';
import { ProcurementProvider, useProcurementStore } from './stores/procurementStore';

// Re-export types from stores
export type { UserRole, UserSession };

// ============================================================
// UI Store (Context)
// ============================================================
interface UiContextType {
  isSidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
}
const UiContext = React.createContext<UiContextType | undefined>(undefined);

export const UiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  return <UiContext.Provider value={{ isSidebarOpen, setSidebarOpen }}>{children}</UiContext.Provider>;
};

// ============================================================
// Combined Provider — wraps all context providers
// ============================================================
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UiProvider>
      <AuthProvider>
        <DataProvider>
          <CartProvider>
            <ProcurementProvider>
              {children}
            </ProcurementProvider>
          </CartProvider>
        </DataProvider>
      </AuthProvider>
    </UiProvider>
  );
};

// ============================================================
// useAppStore() — Backward-compatible facade hook
// ============================================================
// Menggabungkan semua store modular menjadi satu objek yang
// identik dengan interface AppContextType yang lama.
// Semua komponen existing tetap bisa pakai `useAppStore()`.
// ============================================================
export const useAppStore = () => {
  const auth = useAuthStore();
  const data = useDataStore();
  const cart = useCartStore();
  const procurement = useProcurementStore();
  
  const ui = React.useContext(UiContext);
  if (!ui) throw new Error('useAppStore must be used within AppProvider');
  
  const { isSidebarOpen, setSidebarOpen } = ui;

  // Bridge: login functions yang dulu menerima data dari state internal,
  // sekarang kita jembatani dengan meneruskan data dari dataStore.
  const loginUserStep1 = async (deptId: string, pass: string) => {
    return auth.loginUserStep1(deptId, pass, data.departments);
  };

  const loginUserStep2 = async (userId: string, pass?: string) => {
    return auth.loginUserStep2(userId, data.users, pass);
  };

  const loginStaff = async (role: 'TOOLCRIB' | 'PROCUREMENT', employeeId: string, pass: string) => {
    return auth.loginStaff(role, employeeId, pass, data.users);
  };

  const logout = () => {
    auth.logout();
    cart.clearCart();
  };

  // Bridge: submit functions
  const submitUserRequest = async (notes?: string) => {
    return cart.submitUserRequest(
      notes, auth.session, data.users,
      (newReq) => data.setUserRequests((prev) => [newReq, ...prev])
    );
  };

  const submitNonStandardRequest = async (details: any, notes?: string) => {
    return cart.submitNonStandardRequest(
      details, notes, auth.session, data.users,
      (newReq) => data.setUserRequests((prev) => [newReq, ...prev])
    );
  };

  const approveNonStandardRequest = async (reqId: string, token: string) => {
    try {
      const res = await fetch('/api/nonstandard/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reqId })
      });
      const dataJson = await res.json();
      if (!dataJson.success) {
        alert('Gagal approve non-standard request: ' + dataJson.message);
        return false;
      }
      
      // Update UserRequest status
      data.setUserRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: 'Approved' } : r));
      
      // Add ProcurementRequest if returned
      if (dataJson.data && dataJson.data.id) {
        // We need to map it to ProcurementRequest format
        const p = dataJson.data;
        const notes = p.notes || {};
        const newPr: ProcurementRequest = {
          id: p.id,
          poNo: p.po_no,
          toolId: p.tool_id || '',
          toolName: notes.toolName || 'Unknown',
          quantity: p.quantity,
          unit: 'pcs',
          reason: `Vendor: ${notes.vendorName || ''} • Kontak: ${notes.contact || ''}`,
          requestedBy: data.users.find((u: any) => u.id === p.requested_by_id)?.name || 'Unknown',
          status: p.status,
          requestDate: new Date(p.request_date).toISOString().substring(0, 10),
          estimatedCost: notes.price || 0,
          isNonStandard: notes.isNonStandard,
          notes: notes,
          sourceRequestId: p.source_request_id
        };
        data.setProcurementRequests(prev => {
          // Prevent duplicates in state if idempotency returned existing
          if (prev.some(existing => existing.id === newPr.id)) return prev;
          return [newPr, ...prev];
        });
      }
      
      return true;
    } catch (error: any) {
      console.error('approveNonStandardRequest error:', error);
      alert('Terjadi kesalahan sistem.');
      return false;
    }
  };

  // Bridge: request status updates (complex logic stays here for now)
  const updateUserRequestStatus = async (reqId: string, status: any) => {
    const { supabase } = await import('./supabase');
    const req = data.userRequests.find(r => r.id === reqId);
    if (!req) return;

    if (status === 'Approved') {
      const { error: rpcError, data: rpcData } = await supabase.rpc('approve_toolcrib_request', { req_id: reqId });
      if (rpcError) {
        console.error('Failed to execute RPC approve_toolcrib_request:', rpcError);
        alert('Gagal menyetujui request: ' + rpcError.message);
        return;
      }
      if (Array.isArray(rpcData)) {
        const affectedToolCodes: string[] = [];
        data.setTools((prevTools) => prevTools.map(t => {
          const returnedItem = rpcData.find((d: any) => d.tool_id === t.id);
          if (returnedItem) {
            affectedToolCodes.push(t.code);
            return { ...t, stock: returnedItem.new_stock };
          }
          return t;
        }));
        // Fire-and-forget: Sync AI Chatbot ChromaDB (stock decreased)
        if (affectedToolCodes.length > 0) {
          fetch('http://localhost:8001/api/sync-chroma', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool_codes: affectedToolCodes })
          }).catch(err => console.error('[AI Sync] Failed to sync after approve:', err));
        }
      }
      fetch('http://localhost:8000/api/ai/sync-cache', { method: 'POST' }).catch(() => {});
    } else if (status === 'Cancelled') {
      const { error: rpcError, data: rpcData } = await supabase.rpc('cancel_approved_request', { req_id: reqId });
      if (rpcError) {
        console.error('Failed to execute RPC cancel_approved_request:', rpcError);
        alert('Gagal membatalkan request: ' + rpcError.message);
        return;
      }
      if (Array.isArray(rpcData)) {
        const affectedToolCodes: string[] = [];
        data.setTools((prevTools) => prevTools.map(t => {
          const returnedItem = rpcData.find((d: any) => d.tool_id === t.id);
          if (returnedItem) {
            affectedToolCodes.push(t.code);
            return { ...t, stock: returnedItem.new_stock };
          }
          return t;
        }));
        // Fire-and-forget: Sync AI Chatbot ChromaDB (stock restored)
        if (affectedToolCodes.length > 0) {
          fetch('http://localhost:8001/api/sync-chroma', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool_codes: affectedToolCodes })
          }).catch(err => console.error('[AI Sync] Failed to sync after cancel:', err));
        }
      }
    } else {
      const { error } = await supabase.from('user_requests').update({ status }).eq('id', reqId);
      if (error) { console.error('Failed to update request status:', error); return; }
    }

    data.setUserRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status } : r));
  };

  const updateUserRequestItemStatus = async (reqId: string, itemToolId: string, status: 'Approved' | 'Rejected', rejectionReason?: string) => {
    const { supabase } = await import('./supabase');

    if (status === 'Rejected') {
      await supabase.from('user_request_items').delete().eq('request_id', reqId).eq('tool_id', itemToolId);
    }

    let newReqStatus: string | null = null;

    data.setUserRequests((prev) => {
      const updatedPrev = prev.map((req) => {
        if (req.id === reqId) {
          const updatedItems = req.items.map(item => {
            if (item.toolId === itemToolId) return { ...item, status, rejectionReason };
            return item;
          });
          const allResolved = updatedItems.length > 0 && updatedItems.every(item => item.status === 'Approved' || item.status === 'Rejected');
          const allRejected = updatedItems.length > 0 && updatedItems.every(item => item.status === 'Rejected');
          const anyApproved = updatedItems.some(item => item.status === 'Approved');

          let tempStatus = req.status;
          if (allResolved && req.status === 'Pending') {
            if (allRejected) tempStatus = 'Rejected';
            else if (anyApproved) tempStatus = 'Approved';
            newReqStatus = tempStatus;
          }
          return { ...req, items: updatedItems, status: tempStatus };
        }
        return req;
      });
      return updatedPrev;
    });

    if (newReqStatus) {
      await updateUserRequestStatus(reqId, newReqStatus);
    }
  };

  // Procurement bridges
  const createProcurementRequest = async (prData: any) => {
    const res = await procurement.createProcurementRequest(prData, auth.session, data.users);
    if (res && res.success && res.newPrs) {
      data.setProcurementRequests(prev => [...(res.newPrs || []), ...prev]);
    } else if (res && res.success && res.newPr) {
      // Fallback
      data.setProcurementRequests(prev => [res.newPr as ProcurementRequest, ...prev]);
    }
    return res;
  };

  const updateProcurementStatus = async (prId: string, status: any) => {
    const res = await procurement.updateProcurementStatus(prId, status);
    if (res && res.success) {
      data.setProcurementRequests(prev => prev.map(pr => pr.id === prId ? { ...pr, status } : pr));
      // Fire-and-forget AI Sync as requested
      if (status === 'Approved' || status === 'Cancelled') {
        fetch('http://localhost:8001/api/sync-chroma', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}) // Sync all to be safe, or could filter by tool_id if available
        }).catch(err => console.error('[AI Sync] Failed to sync after procurement status update:', err));
      }
    }
    return res;
  };

  return {
    // UI
    isSidebarOpen,
    setSidebarOpen,
    // Auth
    session: auth.session,
    loginUserStep1,
    loginUserStep2,
    loginStaff,
    logout,
    // Data
    isLoading: data.isLoading,
    departments: data.departments,
    users: data.users,
    tools: data.tools,
    addUser: data.addUser,
    removeUser: data.removeUser,
    addToolItem: data.addToolItem,
    updateToolStock: data.updateToolStock,
    // Cart
    cart: cart.cart,
    addToCart: cart.addToCart,
    updateCartQuantity: cart.updateCartQuantity,
    removeFromCart: cart.removeFromCart,
    clearCart: cart.clearCart,
    submitUserRequest,
    submitNonStandardRequest,
    // Requests
    userRequests: data.userRequests,
    isProcessingRPC: false, // Keep for backward compat
    updateUserRequestStatus,
    updateUserRequestItemStatus,
    approveNonStandardRequest,
    // Procurement
    procurementRequests: data.procurementRequests,
    createProcurementRequest,
    updateProcurementStatus,
    procurementCart: procurement.procurementCart,
    procurementCartQtys: procurement.procurementCartQtys,
    addToProcurementCart: procurement.addToProcurementCart,
    updateProcurementCartQty: procurement.updateProcurementCartQty,
    clearProcurementCart: procurement.clearProcurementCart,
  };
};
