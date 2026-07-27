'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Department,
  ToolItem,
  UserRequest,
  UserRequestItem,
  ProcurementRequest,
  INITIAL_DEPARTMENTS,
  INITIAL_TOOLS,
  INITIAL_USER_REQUESTS,
  INITIAL_PROCUREMENT_REQUESTS,
} from './mock';

export type UserRole = 'NONE' | 'USER' | 'TOOLCRIB' | 'PROCUREMENT';

export interface UserSession {
  role: UserRole;
  department?: Department;
  userName?: string;
  employeeId?: string;
  isVerified?: boolean; // Step 2 verification complete
}

interface AppContextType {
  // Session
  session: UserSession;
  loginUserStep1: (deptId: string, pass: string) => { success: boolean; message?: string };
  loginUserStep2: (name: string, empId: string) => void;
  loginStaff: (role: 'TOOLCRIB' | 'PROCUREMENT') => void;
  logout: () => void;

  // Master Data
  departments: Department[];
  tools: ToolItem[];
  addToolItem: (tool: Omit<ToolItem, 'id'>) => void;
  updateToolStock: (toolId: string, newStock: number) => void;

  // Cart & User Requests
  cart: UserRequestItem[];
  addToCart: (tool: ToolItem, qty?: number) => void;
  updateCartQuantity: (toolId: string, quantity: number) => void;
  removeFromCart: (toolId: string) => void;
  clearCart: () => void;
  submitUserRequest: (notes?: string) => { success: boolean; message?: string };
  submitNonStandardRequest: (details: NonNullable<UserRequest['nonStandardDetails']>, notes?: string) => { success: boolean; message?: string };
  userRequests: UserRequest[];
  updateUserRequestStatus: (reqId: string, status: UserRequest['status']) => void;
  updateUserRequestItemStatus: (reqId: string, itemToolId: string, status: 'Approved' | 'Rejected', rejectionReason?: string) => void;

  // Procurement Requests
  procurementRequests: ProcurementRequest[];
  createProcurementRequest: (data: {
    toolId: string;
    toolName: string;
    quantity: number;
    unit: string;
    reason: string;
    estimatedCost: number;
  }) => void;
  updateProcurementStatus: (prId: string, status: ProcurementRequest['status']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession>({ role: 'NONE' });
  const [departments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [tools, setTools] = useState<ToolItem[]>(INITIAL_TOOLS);
  const [cart, setCart] = useState<UserRequestItem[]>([]);
  const [userRequests, setUserRequests] = useState<UserRequest[]>(INITIAL_USER_REQUESTS);
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>(INITIAL_PROCUREMENT_REQUESTS);

  // Recalculate status of tools dynamically based on minStock
  useEffect(() => {
    setTools((prev) =>
      prev.map((t) => {
        let status: ToolItem['status'] = 'Available';
        if (t.stock === 0) status = 'Out of Stock';
        else if (t.stock <= t.minStock) status = 'Low Stock';
        return { ...t, status };
      })
    );
  }, []);

  // Step 1: User Login with Department + Password
  const loginUserStep1 = (deptId: string, pass: string) => {
    const dept = departments.find((d) => d.id === deptId || d.code === deptId);
    if (!dept) {
      return { success: false, message: 'Departemen tidak ditemukan.' };
    }
    if (dept.passwordHash !== pass) {
      return { success: false, message: 'Password departemen salah.' };
    }

    setSession({
      role: 'USER',
      department: dept,
      isVerified: false,
    });
    return { success: true };
  };

  // Step 2: User Enter Name & ID
  const loginUserStep2 = (name: string, empId: string) => {
    setSession((prev) => ({
      ...prev,
      userName: name,
      employeeId: empId,
      isVerified: true,
    }));
  };

  // Staff Login (Toolcrib / Procurement)
  const loginStaff = (role: 'TOOLCRIB' | 'PROCUREMENT') => {
    setSession({
      role,
      userName: role === 'TOOLCRIB' ? 'Toolcrib Admin' : 'Procurement Officer',
      employeeId: role === 'TOOLCRIB' ? 'STAFF-TC-01' : 'STAFF-PR-01',
      isVerified: true,
    });
  };

  const logout = () => {
    setSession({ role: 'NONE' });
    setCart([]);
  };

  // Cart operations
  const addToCart = (tool: ToolItem, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.toolId === tool.id);
      if (existing) {
        return prev.map((item) =>
          item.toolId === tool.id ? { ...item, quantity: Math.min(tool.stock, item.quantity + qty) } : item
        );
      }
      return [
        ...prev,
        {
          toolId: tool.id,
          toolCode: tool.code,
          toolName: tool.name,
          quantity: Math.min(tool.stock, qty),
          unit: tool.unit,
        },
      ];
    });
  };

  const updateCartQuantity = (toolId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.toolId !== toolId);
      }
      return prev.map((item) =>
        item.toolId === toolId ? { ...item, quantity } : item
      );
    });
  };

  const removeFromCart = (toolId: string) => {
    setCart((prev) => prev.filter((item) => item.toolId !== toolId));
  };

  const clearCart = () => setCart([]);

  const submitUserRequest = (notes?: string) => {
    if (cart.length === 0) return { success: false, message: 'Keranjang request kosong.' };
    if (!session.userName || !session.employeeId || !session.department) {
      return { success: false, message: 'Data identitas user tidak lengkap.' };
    }

    const newReqNo = `REQ-2026-${String(userRequests.length + 1).padStart(3, '0')}`;
    const newRequest: UserRequest = {
      id: `req-${Date.now()}`,
      requestNo: newReqNo,
      userName: session.userName,
      employeeId: session.employeeId,
      department: session.department.name,
      items: [...cart],
      status: 'Pending',
      requestDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: notes || 'Permintaan barang standar.',
    };

    setUserRequests((prev) => [newRequest, ...prev]);
    setCart([]);
    return { success: true, message: `Request ${newReqNo} berhasil diajukan!` };
  };

  const submitNonStandardRequest = (details: NonNullable<UserRequest['nonStandardDetails']>, notes?: string) => {
    if (!session.userName || !session.employeeId || !session.department) {
      return { success: false, message: 'Data identitas user tidak lengkap.' };
    }

    const newReqNo = `REQ-NS-2026-${String(userRequests.length + 1).padStart(3, '0')}`;
    const newRequest: UserRequest = {
      id: `req-ns-${Date.now()}`,
      requestNo: newReqNo,
      userName: session.userName,
      employeeId: session.employeeId,
      department: session.department.name,
      items: [], // No standard items
      status: 'Pending',
      requestDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: notes || `Request Non-Standard: ${details.toolName}`,
      isNonStandard: true,
      nonStandardDetails: details,
    };

    setUserRequests((prev) => [newRequest, ...prev]);
    return { success: true, message: `Request Non-Standard ${newReqNo} berhasil diajukan!` };
  };

  const updateUserRequestStatus = (reqId: string, status: UserRequest['status']) => {
    setUserRequests((prev) =>
      prev.map((req) => {
        if (req.id === reqId) {
          // If issuing item, deduct stock from toolcrib
          if (status === 'Issued' && req.status !== 'Issued') {
            req.items.forEach((item) => {
              if (item.status === 'Approved' || !item.status) {
                updateToolStock(item.toolId, -item.quantity);
              }
            });
          }
          // If returning item, add stock back to toolcrib
          if (status === 'Returned' && req.status === 'Issued') {
            req.items.forEach((item) => {
              if (item.status === 'Approved' || !item.status) {
                updateToolStock(item.toolId, item.quantity);
              }
            });
          }
          return { ...req, status };
        }
        return req;
      })
    );
  };

  const updateUserRequestItemStatus = (reqId: string, itemToolId: string, status: 'Approved' | 'Rejected', rejectionReason?: string) => {
    setUserRequests((prev) =>
      prev.map((req) => {
        if (req.id === reqId) {
          const updatedItems = req.items.map(item => {
            if (item.toolId === itemToolId) {
              return { ...item, status, rejectionReason };
            }
            return item;
          });

          // Check if all items are resolved
          const allResolved = updatedItems.every(item => item.status === 'Approved' || item.status === 'Rejected');
          const allRejected = updatedItems.every(item => item.status === 'Rejected');
          const anyApproved = updatedItems.some(item => item.status === 'Approved');

          let newReqStatus = req.status;
          if (allResolved && req.status === 'Pending') {
            if (allRejected) {
              newReqStatus = 'Rejected';
            } else if (anyApproved) {
              newReqStatus = 'Approved';
            }
          }

          return { ...req, items: updatedItems, status: newReqStatus };
        }
        return req;
      })
    );
  };

  // Master Tools Operations
  const addToolItem = (newTool: Omit<ToolItem, 'id'>) => {
    const id = `tool-${Date.now().toString().slice(-4)}`;
    const status: ToolItem['status'] =
      newTool.status || (newTool.stock === 0 ? 'Out of Stock' : newTool.stock <= newTool.minStock ? 'Low Stock' : 'Available');

    setTools((prev) => [...prev, { ...newTool, id, status }]);
  };

  const updateToolStock = (toolId: string, changeOrAbsolute: number) => {
    setTools((prev) =>
      prev.map((t) => {
        if (t.id === toolId) {
          // Check if change is relative (e.g., -2 or +5) or absolute replacement
          const newStock = Math.max(0, t.stock + changeOrAbsolute);
          let status: ToolItem['status'] = 'Available';
          if (newStock === 0) status = 'Out of Stock';
          else if (newStock <= t.minStock) status = 'Low Stock';
          return { ...t, stock: newStock, status };
        }
        return t;
      })
    );
  };

  // Procurement Operations
  const createProcurementRequest = (data: {
    toolId: string;
    toolName: string;
    quantity: number;
    unit: string;
    reason: string;
    estimatedCost: number;
  }) => {
    const newPrNo = `PR-TC-2026-${String(procurementRequests.length + 1).padStart(2, '0')}`;
    const newPr: ProcurementRequest = {
      id: `pr-${Date.now()}`,
      poNo: newPrNo,
      ...data,
      requestedBy: session.userName || 'Toolcrib Staff',
      status: 'Pending Approval',
      requestDate: new Date().toISOString().substring(0, 10),
    };
    setProcurementRequests((prev) => [newPr, ...prev]);
  };

  const updateProcurementStatus = (prId: string, status: ProcurementRequest['status']) => {
    setProcurementRequests((prev) =>
      prev.map((pr) => {
        if (pr.id === prId) {
          return { ...pr, status };
        }
        return pr;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        session,
        loginUserStep1,
        loginUserStep2,
        loginStaff,
        logout,
        departments,
        tools,
        addToolItem,
        updateToolStock,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        submitUserRequest,
        submitNonStandardRequest,
        userRequests,
        updateUserRequestStatus,
        updateUserRequestItemStatus,
        procurementRequests,
        createProcurementRequest,
        updateProcurementStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
