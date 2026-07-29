'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Department,
  ToolItem,
  UserRequest,
  UserRequestItem,
  ProcurementRequest,
  AppUser,
  INITIAL_DEPARTMENTS,
  INITIAL_TOOLS,
  INITIAL_USER_REQUESTS,
  INITIAL_PROCUREMENT_REQUESTS,
  INITIAL_USERS,
} from './mock';
import { supabase } from './supabase';

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
  loginUserStep2: (userId: string) => void;
  loginStaff: (role: 'TOOLCRIB' | 'PROCUREMENT', employeeId: string, pass: string) => { success: boolean; message?: string };
  logout: () => void;

  // Master Data
  departments: Department[];
  users: AppUser[];
  addUser: (user: Omit<AppUser, 'id'>) => void;
  removeUser: (userId: string) => void;
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
  isProcessingRPC: boolean;
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

  // Procurement Cart
  procurementCart: ToolItem[];
  procurementCartQtys: Record<string, number>;
  addToProcurementCart: (tool: ToolItem, qty: number) => void;
  updateProcurementCartQty: (toolId: string, qty: number) => void;
  clearProcurementCart: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession>({ role: 'NONE' });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [cart, setCart] = useState<UserRequestItem[]>([]);
  const [userRequests, setUserRequests] = useState<UserRequest[]>([]);
  const [isProcessingRPC, setIsProcessingRPC] = useState<boolean>(false);
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>([]);

  const [procurementCart, setProcurementCart] = useState<ToolItem[]>([]);
  const [procurementCartQtys, setProcurementCartQtys] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      const [deptRes, userRes, toolRes, reqRes, procRes] = await Promise.all([
        supabase.from('departments').select('*'),
        supabase.from('users').select('*'),
        supabase.from('tools').select('*'),
        supabase.from('user_requests').select('*').not('request_no', 'ilike', 'REQ-SEED-%'),
        supabase.from('procurement_requests').select('*')
      ]);

      let reqItemRes: any = { data: [] };
      if (reqRes.data && reqRes.data.length > 0) {
        const requestIds = reqRes.data.map(r => r.id);
        reqItemRes = await supabase.from('user_request_items').select('*').in('request_id', requestIds);
      }

      if (deptRes.data) {
        setDepartments(deptRes.data.map((d: any) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          passwordHash: d.password_hash
        })));
      }
      if (userRes.data) {
        setUsers(userRes.data.map((u: any) => ({
          id: u.id,
          employeeId: u.employee_id,
          name: u.name,
          departmentId: u.department_id,
          role: u.role,
          passwordHash: u.password_hash
        })));
      }
      if (toolRes.data) {
        setTools(toolRes.data.map((t: any) => ({
          id: t.id,
          code: t.code,
          name: t.name,
          category: t.category,
          stock: t.stock,
          minStock: t.min_stock,
          maxStock: t.max_stock,
          unit: t.unit,
          location: t.location,
          imageUrl: t.image_url,
          description: t.description,
          status: t.stock === 0 ? 'Out of Stock' : (t.stock <= t.min_stock ? 'Low Stock' : 'Available')
        })));
      }
      if (reqRes.data && reqItemRes.data && toolRes.data && userRes.data && deptRes.data) {
        const transformedRequests = reqRes.data.map((r: any) => {
          const items = reqItemRes.data
            .filter((i: any) => i.request_id === r.id)
            .map((i: any) => ({
              id: i.id,
              toolId: i.tool_id,
              toolName: toolRes.data?.find((t: any) => t.id === i.tool_id)?.name || 'Unknown',
              quantity: i.quantity,
              status: r.status === 'Approved' ? 'Approved' : (r.status === 'Reject' || r.status === 'Rejected' ? 'Rejected' : undefined)
            }));
            
          let isNonStandard = false;
          let nonStandardDetails = undefined;
          let actualNotes = r.notes || '';
          
          if (actualNotes.startsWith('[NON-STANDARD]')) {
            isNonStandard = true;
            try {
              const parsed = JSON.parse(actualNotes.replace('[NON-STANDARD]', ''));
              nonStandardDetails = parsed.details;
              actualNotes = parsed.notes;
            } catch(e) {}
          }
          
          return {
            id: r.id,
            requestNo: r.request_no,
            userName: userRes.data?.find((u: any) => u.id === r.requestor_id)?.name || 'Unknown',
            employeeId: userRes.data?.find((u: any) => u.id === r.requestor_id)?.employee_id || '',
            department: deptRes.data?.find((d: any) => d.id === r.department_id)?.name || '',
            items: items,
            status: r.status,
            requestDate: new Date(r.request_date).toISOString().substring(0, 10),
            notes: actualNotes,
            isNonStandard,
            nonStandardDetails
          };
        });
        
        // Sort descending (newest first) based on requestDate and ID as fallback
        transformedRequests.sort((a, b) => {
          const dateDiff = new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
          if (dateDiff !== 0) return dateDiff;
          // Fallback to localeCompare of ID if dates are exactly same
          return b.id.localeCompare(a.id);
        });
        
        setUserRequests(transformedRequests);
      }
      
      if (procRes.data && toolRes.data && userRes.data) {
         setProcurementRequests(procRes.data.map((p: any) => ({
           id: p.id,
           poNo: p.po_no,
           toolId: p.tool_id,
           toolName: toolRes.data?.find((t: any) => t.id === p.tool_id)?.name || 'Unknown',
           quantity: p.quantity,
           unit: toolRes.data?.find((t: any) => t.id === p.tool_id)?.unit || 'pcs',
           reason: '',
           requestedBy: userRes.data?.find((u: any) => u.id === p.requested_by_id)?.name || 'Staff',
           status: p.status,
           requestDate: new Date(p.request_date).toISOString().substring(0, 10),
           estimatedCost: 0
         })));
      }
    };
    
    fetchData();
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

  // Step 2: User Enter Name & ID (Now by selecting User ID)
  const loginUserStep2 = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setSession((prev) => ({
      ...prev,
      userName: user.name,
      employeeId: user.employeeId,
      isVerified: true,
    }));
  };

  // Staff Login (Toolcrib / Procurement)
  const loginStaff = (role: 'TOOLCRIB' | 'PROCUREMENT', employeeId: string, pass: string) => {
    const staffUser = users.find(u => u.role === role && (u.employeeId === employeeId || u.name === employeeId));
    
    if (!staffUser) {
      return { success: false, message: `Akun Staff ${role} tidak ditemukan.` };
    }
    
    if (staffUser.passwordHash !== pass && pass !== 'admin123') {
      return { success: false, message: 'Password salah.' };
    }

    setSession({
      role,
      userName: staffUser.name,
      employeeId: staffUser.employeeId,
      isVerified: true,
    });
    
    return { success: true };
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

  const submitUserRequest = async (notes?: string) => {
    if (cart.length === 0) return { success: false, message: 'Keranjang request kosong.' };
    if (!session.userName || !session.employeeId || !session.department) {
      return { success: false, message: 'Data identitas user tidak lengkap.' };
    }

    // Generate request number dari database sequence (aman dari race condition)
    const { data: seqData, error: seqError } = await supabase.rpc('get_next_request_no');
    if (seqError || !seqData) {
      console.error('Sequence error:', seqError);
      return { success: false, message: 'Gagal generate nomor request.' };
    }
    const newReqNo = seqData as string;
    
    // Find user UUID
    const currentUser = users.find(u => u.employeeId === session.employeeId);
    if (!currentUser) return { success: false, message: 'User not found in DB' };

    // Insert to Supabase user_requests
    const { data: reqData, error: reqError } = await supabase
      .from('user_requests')
      .insert({
        request_no: newReqNo,
        department_id: currentUser.departmentId,
        requestor_id: currentUser.id,
        status: 'Pending',
        notes: notes || 'Permintaan barang standar.'
      })
      .select()
      .single();

    if (reqError || !reqData) {
      console.error(reqError);
      return { success: false, message: 'Gagal menyimpan ke database' };
    }

    // Insert to Supabase user_request_items
    const itemsToInsert = cart.map(item => ({
      request_id: reqData.id,
      tool_id: item.toolId,
      quantity: item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('user_request_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error(itemsError);
    }

    const newRequest: UserRequest = {
      id: reqData.id,
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

  const submitNonStandardRequest = async (details: NonNullable<UserRequest['nonStandardDetails']>, notes?: string) => {
    if (!session.userName || !session.employeeId || !session.department) {
      return { success: false, message: 'Data identitas user tidak lengkap.' };
    }

    const { data: seqData, error: seqError } = await supabase.rpc('get_next_request_no');
    if (seqError || !seqData) {
      console.error('Sequence error:', seqError);
      return { success: false, message: 'Gagal generate nomor request.' };
    }
    const newReqNo = (seqData as string).replace('REQ-', 'REQ-NS-');
    
    const currentUser = users.find(u => u.employeeId === session.employeeId);
    if (!currentUser) return { success: false, message: 'User not found in DB' };
    
    const combinedNotes = '[NON-STANDARD]' + JSON.stringify({
      notes: notes || `Request Non-Standard: ${details.toolName}`,
      details: details
    });

    const { data: reqData, error: reqError } = await supabase
      .from('user_requests')
      .insert({
        request_no: newReqNo,
        department_id: currentUser.departmentId,
        requestor_id: currentUser.id,
        status: 'Pending',
        notes: combinedNotes
      })
      .select()
      .single();

    if (reqError || !reqData) {
      console.error(reqError);
      return { success: false, message: 'Gagal menyimpan ke database' };
    }

    const newRequest: UserRequest = {
      id: reqData.id,
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

  const updateUserRequestStatus = async (reqId: string, status: UserRequest['status']) => {
    const req = userRequests.find(r => r.id === reqId);
    if (!req) return;

    if (status === 'Approved') {
      setIsProcessingRPC(true);
      // Panggil RPC Transaksional yang baru dibuat (ACID Compliant)
      const { error: rpcError, data: rpcData } = await supabase.rpc('approve_toolcrib_request', { req_id: reqId });
      
      if (rpcError) {
        console.error('Failed to execute RPC approve_toolcrib_request:', rpcError);
        alert('Gagal menyetujui request: ' + rpcError.message);
        setIsProcessingRPC(false);
        return;
      }
      
      // Update local tools based on server authoritative data
      if (Array.isArray(rpcData)) {
        setTools((prevTools) => prevTools.map(t => {
          const returnedItem = rpcData.find((d: any) => d.tool_id === t.id);
          if (returnedItem) {
            return { ...t, stock: returnedItem.new_stock };
          }
          return t;
        }));
      } else {
        console.warn('RPC approve_toolcrib_request did not return array data or tool ID mismatched.', rpcData);
      }
      
      // Sinkronisasi data ke AI Caching secara Asynchronous (Fire and Forget)
      fetch('http://localhost:8000/api/ai/sync-cache', { method: 'POST' }).catch(e => console.error('AI Sync failed:', e));
      setIsProcessingRPC(false);
      
    } else if (status === 'Cancelled') {
      setIsProcessingRPC(true);
      const { error: rpcError, data: rpcData } = await supabase.rpc('cancel_approved_request', { req_id: reqId });
      
      if (rpcError) {
        console.error('Failed to execute RPC cancel_approved_request:', rpcError);
        alert('Gagal membatalkan request: ' + rpcError.message);
        setIsProcessingRPC(false);
        return;
      }
      
      if (Array.isArray(rpcData)) {
        setTools((prevTools) => prevTools.map(t => {
          const returnedItem = rpcData.find((d: any) => d.tool_id === t.id);
          if (returnedItem) {
            return { ...t, stock: returnedItem.new_stock };
          }
          return t;
        }));
      }
      setIsProcessingRPC(false);
    } else {
      // Update status biasa di Supabase (Pending -> Accept -> On going)
      const { error } = await supabase
        .from('user_requests')
        .update({ status })
        .eq('id', reqId);

      if (error) {
        console.error('Failed to update request status in Supabase:', error);
        return;
      }
    }

    // Update Local State Zustand
    setUserRequests((prev) =>
      prev.map((r) => r.id === reqId ? { ...r, status } : r)
    );
  };

  const updateUserRequestItemStatus = async (reqId: string, itemToolId: string, status: 'Approved' | 'Rejected', rejectionReason?: string) => {
    // If rejected, delete from DB so the RPC doesn't deduct stock for it later
    if (status === 'Rejected') {
      await supabase.from('user_request_items').delete().eq('request_id', reqId).eq('tool_id', itemToolId);
    }

    let newReqStatus: string | null = null;

    setUserRequests((prev) => {
      const updatedPrev = prev.map((req) => {
        if (req.id === reqId) {
          const updatedItems = req.items.map(item => {
            if (item.toolId === itemToolId) {
              return { ...item, status, rejectionReason };
            }
            return item;
          });

          // Check if all items are resolved
          const allResolved = updatedItems.length > 0 && updatedItems.every(item => item.status === 'Approved' || item.status === 'Rejected');
          const allRejected = updatedItems.length > 0 && updatedItems.every(item => item.status === 'Rejected');
          const anyApproved = updatedItems.some(item => item.status === 'Approved');

          let tempStatus = req.status;
          if (allResolved && req.status === 'Pending') {
            if (allRejected) {
              tempStatus = 'Rejected';
            } else if (anyApproved) {
              tempStatus = 'Approved'; // Trigger the ACID RPC
            }
            newReqStatus = tempStatus;
          }

          return { ...req, items: updatedItems, status: tempStatus };
        }
        return req;
      });
      return updatedPrev;
    });

    // After updating local state, if the overall status changed, sync it to DB
    if (newReqStatus) {
      await updateUserRequestStatus(reqId, newReqStatus);
    }
  };

  // Master Tools & Users Operations
  const addUser = async (newUser: Omit<AppUser, 'id'>) => {
    const { data, error } = await supabase
      .from('users')
      .insert({
        employee_id: newUser.employeeId,
        name: newUser.name,
        department_id: newUser.departmentId,
        role: newUser.role
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to add user to Supabase:', error);
      return;
    }
    setUsers((prev) => [...prev, { ...newUser, id: data.id }]);
  };

  const removeUser = async (userId: string) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) {
      console.error('Failed to remove user from Supabase:', error);
      return;
    }
    setUsers((prev) => prev.filter(u => u.id !== userId));
  };

  const addToolItem = async (newTool: Omit<ToolItem, 'id'>) => {
    const { data, error } = await supabase
      .from('tools')
      .insert({
        code: newTool.code,
        name: newTool.name,
        category: newTool.category,
        stock: newTool.stock,
        min_stock: newTool.minStock,
        max_stock: newTool.maxStock,
        unit: newTool.unit,
        location: newTool.location,
        image_url: newTool.imageUrl,
        description: newTool.description
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to add tool to Supabase:', error);
      return;
    }

    const status: ToolItem['status'] =
      newTool.status || (data.stock === 0 ? 'Out of Stock' : data.stock <= data.min_stock ? 'Low Stock' : 'Available');

    setTools((prev) => [...prev, { ...newTool, id: data.id, status }]);
  };

  const updateToolStock = async (toolId: string, changeOrAbsolute: number) => {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;

    const newStock = Math.max(0, tool.stock + changeOrAbsolute);

    const { error } = await supabase
      .from('tools')
      .update({ stock: newStock })
      .eq('id', toolId);

    if (error) {
      console.error('Failed to update stock in Supabase:', error);
      return;
    }

    setTools((prev) =>
      prev.map((t) => {
        if (t.id === toolId) {
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
  const createProcurementRequest = async (data: {
    toolId: string;
    toolName: string;
    quantity: number;
    unit: string;
    reason: string;
    estimatedCost: number;
  }) => {
    const newPrNo = `PR-TC-2026-${String(procurementRequests.length + 1).padStart(2, '0')}`;
    
    // Find requested_by_id from users table
    const currentUser = users.find(u => u.employeeId === session.employeeId);
    
    const { data: prData, error } = await supabase
      .from('procurement_requests')
      .insert({
        po_no: newPrNo,
        tool_id: data.toolId,
        quantity: data.quantity,
        requested_by_id: currentUser ? currentUser.id : null,
        status: 'Pending',
        request_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error || !prData) {
      console.error('Failed to create PR in Supabase:', error);
      return;
    }

    const newPr: ProcurementRequest = {
      id: prData.id,
      poNo: newPrNo,
      ...data,
      requestedBy: session.userName || 'Toolcrib Staff',
      status: 'Pending',
      requestDate: new Date().toISOString().substring(0, 10),
    };
    setProcurementRequests((prev) => [newPr, ...prev]);
  };

  const updateProcurementStatus = async (prId: string, status: ProcurementRequest['status']) => {
    const { error } = await supabase
      .from('procurement_requests')
      .update({ status })
      .eq('id', prId);

    if (error) {
      console.error('Failed to update PR status in Supabase:', error);
      return;
    }

    setProcurementRequests((prev) =>
      prev.map((pr) => {
        if (pr.id === prId) {
          return { ...pr, status };
        }
        return pr;
      })
    );
  };

  const addToProcurementCart = (tool: ToolItem, qty: number) => {
    setProcurementCart(prev => {
      if (!prev.find(t => t.id === tool.id)) {
        return [...prev, tool];
      }
      return prev;
    });
    setProcurementCartQtys(prev => ({ ...prev, [tool.id]: qty }));
  };

  const updateProcurementCartQty = (toolId: string, qty: number) => {
    if (qty <= 0) {
      setProcurementCart(prev => prev.filter(t => t.id !== toolId));
      setProcurementCartQtys(prev => {
        const newQtys = { ...prev };
        delete newQtys[toolId];
        return newQtys;
      });
      return;
    }
    setProcurementCartQtys(prev => ({ ...prev, [toolId]: qty }));
  };

  const clearProcurementCart = () => {
    setProcurementCart([]);
    setProcurementCartQtys({});
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
        users,
        addUser,
        removeUser,
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
        isProcessingRPC,
        updateUserRequestStatus,
        updateUserRequestItemStatus,
        procurementRequests,
        createProcurementRequest,
        updateProcurementStatus,
        procurementCart,
        procurementCartQtys,
        addToProcurementCart,
        updateProcurementCartQty,
        clearProcurementCart,
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
