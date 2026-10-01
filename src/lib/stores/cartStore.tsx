'use client';

import React, { createContext, useContext, useState } from 'react';
import type { ToolItem, UserRequestItem, UserRequest, AppUser } from '@/src/types';
import { supabase } from '../supabase';

// ============================================================
// Cart Store — Cart operations & request submission
// ============================================================

export interface CartContextType {
  cart: UserRequestItem[];
  addToCart: (tool: ToolItem, qty?: number) => void;
  updateCartQuantity: (toolId: string, quantity: number) => void;
  removeFromCart: (toolId: string) => void;
  clearCart: () => void;
  submitUserRequest: (
    notes: string | undefined,
    session: { userName?: string; employeeId?: string; department?: { name: string; id?: string } },
    users: AppUser[],
    onSuccess: (newRequest: UserRequest) => void
  ) => Promise<{ success: boolean; message?: string }>;
  submitNonStandardRequest: (
    details: NonNullable<UserRequest['nonStandardDetails']>,
    notes: string | undefined,
    session: { userName?: string; employeeId?: string; department?: { name: string; id?: string } },
    users: AppUser[],
    onSuccess: (newRequest: UserRequest) => void
  ) => Promise<{ success: boolean; message?: string }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<UserRequestItem[]>([]);

  const addToCart = (tool: ToolItem, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.toolId === tool.id);
      if (existing) {
        return prev.map((item) =>
          item.toolId === tool.id ? { ...item, quantity: Math.min(tool.stock, item.quantity + qty) } : item
        );
      }
      return [...prev, {
        toolId: tool.id, toolCode: tool.code, toolName: tool.name,
        quantity: Math.min(tool.stock, qty), unit: tool.unit,
      }];
    });
  };

  const updateCartQuantity = (toolId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) return prev.filter((item) => item.toolId !== toolId);
      return prev.map((item) => item.toolId === toolId ? { ...item, quantity } : item);
    });
  };

  const removeFromCart = (toolId: string) => {
    setCart((prev) => prev.filter((item) => item.toolId !== toolId));
  };

  const clearCart = () => setCart([]);

  const submitUserRequest = async (
    notes: string | undefined,
    session: { userName?: string; employeeId?: string; department?: { name: string; id?: string } },
    users: AppUser[],
    onSuccess: (newRequest: UserRequest) => void
  ) => {
    if (cart.length === 0) return { success: false, message: 'Keranjang request kosong.' };
    if (!session.userName || !session.employeeId || !session.department) {
      return { success: false, message: 'Data identitas user tidak lengkap.' };
    }

    const { data: seqData, error: seqError } = await supabase.rpc('get_next_request_no');
    if (seqError || !seqData) return { success: false, message: 'Gagal generate nomor request.' };
    const newReqNo = seqData as string;

    const currentUser = users.find(u => u.employeeId === session.employeeId);
    if (!currentUser) return { success: false, message: 'User not found in DB' };

    const { data: reqData, error: reqError } = await supabase
      .from('user_requests')
      .insert({
        request_no: newReqNo, department_id: currentUser.departmentId,
        requestor_id: currentUser.id, status: 'Pending',
        notes: notes || 'Permintaan barang standar.'
      })
      .select().single();

    if (reqError || !reqData) return { success: false, message: 'Gagal menyimpan ke database' };

    const itemsToInsert = cart.map(item => ({
      request_id: reqData.id, tool_id: item.toolId, quantity: item.quantity
    }));
    await supabase.from('user_request_items').insert(itemsToInsert);

    const newRequest: UserRequest = {
      id: reqData.id, requestNo: newReqNo,
      userName: session.userName, employeeId: session.employeeId,
      department: session.department.name, items: [...cart],
      status: 'Pending',
      requestDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: notes || 'Permintaan barang standar.',
    };

    onSuccess(newRequest);
    setCart([]);
    return { success: true, message: `Request ${newReqNo} berhasil diajukan!` };
  };

  const submitNonStandardRequest = async (
    details: NonNullable<UserRequest['nonStandardDetails']>,
    notes: string | undefined,
    session: { userName?: string; employeeId?: string; department?: { name: string; id?: string } },
    users: AppUser[],
    onSuccess: (newRequest: UserRequest) => void
  ) => {
    if (!session.userName || !session.employeeId || !session.department) {
      return { success: false, message: 'Data identitas user tidak lengkap.' };
    }

    const { data: seqData, error: seqError } = await supabase.rpc('get_next_request_no');
    if (seqError || !seqData) return { success: false, message: 'Gagal generate nomor request.' };
    const newReqNo = (seqData as string).replace('REQ-', 'REQ-NS-');

    const currentUser = users.find(u => u.employeeId === session.employeeId);
    if (!currentUser) return { success: false, message: 'User not found in DB' };

    const combinedNotes = '[NON-STANDARD]' + JSON.stringify({ notes: notes || `Request Non-Standard: ${details.toolName}`, details });

    const { data: reqData, error: reqError } = await supabase
      .from('user_requests')
      .insert({
        request_no: newReqNo, department_id: currentUser.departmentId,
        requestor_id: currentUser.id, status: 'Pending', notes: combinedNotes
      })
      .select().single();

    if (reqError || !reqData) return { success: false, message: 'Gagal menyimpan ke database' };

    const newRequest: UserRequest = {
      id: reqData.id, requestNo: newReqNo,
      userName: session.userName, employeeId: session.employeeId,
      department: session.department.name, items: [],
      status: 'Pending',
      requestDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: notes || `Request Non-Standard: ${details.toolName}`,
      isNonStandard: true, nonStandardDetails: details,
    };

    onSuccess(newRequest);
    return { success: true, message: `Request Non-Standard ${newReqNo} berhasil diajukan!` };
  };

  return (
    <CartContext.Provider value={{
      cart, addToCart, updateCartQuantity, removeFromCart, clearCart,
      submitUserRequest, submitNonStandardRequest
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCartStore = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCartStore must be used within CartProvider');
  return context;
};
