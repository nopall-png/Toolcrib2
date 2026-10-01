'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Department, ToolItem, AppUser, UserRequest, UserRequestItem, ProcurementRequest } from '@/src/types';
import { supabase } from '../supabase';

// ============================================================
// Data Store — Fetch & manage master data (departments, users, tools, requests)
// ============================================================

export interface DataContextType {
  isLoading: boolean;
  departments: Department[];
  users: AppUser[];
  tools: ToolItem[];
  setTools: React.Dispatch<React.SetStateAction<ToolItem[]>>;
  userRequests: UserRequest[];
  setUserRequests: React.Dispatch<React.SetStateAction<UserRequest[]>>;
  procurementRequests: ProcurementRequest[];
  setProcurementRequests: React.Dispatch<React.SetStateAction<ProcurementRequest[]>>;
  addUser: (user: Omit<AppUser, 'id'>) => void;
  removeUser: (userId: string) => void;
  addToolItem: (tool: Omit<ToolItem, 'id'>) => Promise<{success: boolean, error?: string}>;
  updateToolStock: (toolId: string, changeOrAbsolute: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [userRequests, setUserRequests] = useState<UserRequest[]>([]);
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [deptRes, userRes, toolRes, reqRes, procRes] = await Promise.all([
        supabase.from('departments').select('*'),
        supabase.from('users').select('*'),
        supabase.from('tools').select('*'),
        fetch('/api/requests/list', { cache: 'no-store' }).then(res => res.json()).catch(e => ({ success: false, data: [], error: e.message })),
        fetch('/api/procurement/list', { cache: 'no-store' }).then(res => res.json()).catch(e => ({ success: false, data: [], error: e.message }))
      ]);

      console.log('procRes:', procRes);
      console.log('reqRes:', reqRes);

      let reqItemRes: any = { data: [] };
      if (reqRes.data && reqRes.data.length > 0) {
        const requestIds = reqRes.data.map((r: any) => r.id);
        reqItemRes = await supabase.from('user_request_items').select('*').in('request_id', requestIds);
      }

      if (deptRes.data) {
        setDepartments(deptRes.data.map((d: any) => ({
          id: d.id, code: d.code, name: d.name, passwordHash: d.password_hash
        })));
      }
      if (userRes.data) {
        setUsers(userRes.data.map((u: any) => ({
          id: u.id, employeeId: u.employee_id, name: u.name,
          departmentId: u.department_id, role: u.role, passwordHash: u.password_hash
        })));
      }
      let parsedTools: ToolItem[] = [];
      if (toolRes.data) {
        parsedTools = toolRes.data.map((t: any) => ({
          id: t.id, code: t.code, name: t.name, category: t.category,
          stock: t.stock, minStock: t.min_stock, maxStock: t.max_stock,
          unit: t.unit, location: t.location, imageUrl: t.image_url,
          description: t.description, unitPrice: Number(t.unit_price) || 0,
          status: t.stock === 0 ? 'Out of Stock' : (t.stock <= t.min_stock ? 'Low Stock' : 'Available')
        }));
        setTools(parsedTools);
      }
      if (reqRes.data && reqItemRes.data && toolRes.data && userRes.data && deptRes.data) {
        const transformedRequests = reqRes.data.map((r: any) => {
          const items = reqItemRes.data
            .filter((i: any) => i.request_id === r.id)
            .map((i: any) => ({
              id: i.id, toolId: i.tool_id,
              toolCode: parsedTools.find((t: any) => t.id === i.tool_id)?.code || '',
              toolName: parsedTools.find((t: any) => t.id === i.tool_id)?.name || 'Unknown',
              quantity: i.quantity,
              unit: parsedTools.find((t: any) => t.id === i.tool_id)?.unit || 'pcs',
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
            id: r.id, requestNo: r.request_no,
            userName: userRes.data?.find((u: any) => u.id === r.requestor_id)?.name || 'Unknown',
            employeeId: userRes.data?.find((u: any) => u.id === r.requestor_id)?.employee_id || '',
            department: deptRes.data?.find((d: any) => d.id === r.department_id)?.name || '',
            items, status: r.status,
            requestDate: new Date(r.request_date).toISOString().substring(0, 10),
            notes: actualNotes, isNonStandard, nonStandardDetails
          };
        });

        transformedRequests.sort((a: any, b: any) => {
          const dateDiff = new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
          if (dateDiff !== 0) return dateDiff;
          return b.id.localeCompare(a.id);
        });

        // Hide recovered DB testing data from UI, but keep them for Predictive AI
        const displayRequests = transformedRequests.filter((r: any) => !r.requestNo.startsWith('REQ-RECOVERED-'));
        setUserRequests(displayRequests);
      }

      if (procRes && procRes.success && Array.isArray(procRes.data)) {
        const usersData = userRes?.data || [];
        
        let mappedProcRequests = procRes.data.map((p: any) => {
          let reqDateStr = '';
          try {
            reqDateStr = p.request_date ? new Date(p.request_date).toISOString().substring(0, 10) : '';
          } catch (e) {
            reqDateStr = 'Invalid Date';
          }
          
          const isNonStandard = p.notes?.isNonStandard === true;
          const notes = p.notes || {};
          
          return {
            id: p.id, 
            poNo: p.po_no, 
            toolId: p.tool_id || '',
            toolName: isNonStandard ? (notes.toolName || 'Unknown') : (parsedTools.find((t: ToolItem) => t.id === p.tool_id)?.name || 'Unknown'),
            quantity: p.quantity,
            unit: isNonStandard ? 'pcs' : (parsedTools.find((t: ToolItem) => t.id === p.tool_id)?.unit || 'pcs'),
            reason: isNonStandard ? `Vendor: ${notes.vendorName || ''} • Kontak: ${notes.contact || ''}` : '', 
            requestedBy: usersData.find((u: any) => u.id === p.requested_by_id)?.name || 'Unknown',
            status: p.status,
            requestDate: reqDateStr,
            estimatedCost: isNonStandard ? Number(notes.price || 0) : (Number(parsedTools.find((t: ToolItem) => t.id === p.tool_id)?.unitPrice || 0) * Number(p.quantity || 0)),
            isNonStandard: isNonStandard,
            notes: notes,
            sourceRequestId: p.source_request_id
          };
        });

        setProcurementRequests(mappedProcRequests);
      } else {
        console.error('Procurement Fetch Failed or data is invalid:', procRes);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  // --- User CRUD ---
  const addUser = async (newUser: Omit<AppUser, 'id'>) => {
    const { data, error } = await supabase
      .from('users')
      .insert({ employee_id: newUser.employeeId, name: newUser.name, department_id: newUser.departmentId, role: newUser.role })
      .select().single();
    if (error || !data) { console.error('Failed to add user:', error); return; }
    setUsers((prev) => [...prev, { ...newUser, id: data.id }]);
  };

  const removeUser = async (userId: string) => {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) { console.error('Failed to remove user:', error); return; }
    setUsers((prev) => prev.filter(u => u.id !== userId));
  };

  // --- Tool CRUD ---
  const addToolItem = async (newTool: Omit<ToolItem, 'id'>): Promise<{success: boolean, error?: string}> => {
    const { data, error } = await supabase
      .from('tools')
      .insert({
        code: newTool.code, name: newTool.name, category: newTool.category,
        stock: newTool.stock, min_stock: newTool.minStock, max_stock: newTool.maxStock,
        unit: newTool.unit, location: newTool.location, image_url: newTool.imageUrl, 
        description: newTool.description, unit_price: newTool.unitPrice || 0
      })
      .select().single();
    if (error || !data) { 
      const errStr = JSON.stringify(error || {});
      console.error('Failed to add tool, error details:', errStr); 
      return { success: false, error: error?.message || 'Database insert failed' }; 
    }
    const status: ToolItem['status'] = newTool.status || (data.stock === 0 ? 'Out of Stock' : data.stock <= data.min_stock ? 'Low Stock' : 'Available');
    setTools((prev) => [...prev, { ...newTool, id: data.id, status }]);

    // Fire-and-forget: Sync AI Chatbot ChromaDB with new tool
    fetch('http://localhost:8001/api/sync-chroma', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_codes: [newTool.code] })
    }).catch(err => console.error('[AI Sync] Failed to sync new tool:', err));

    return { success: true };
  };

  const updateToolStock = async (toolId: string, changeOrAbsolute: number) => {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;
    const newStock = Math.max(0, tool.stock + changeOrAbsolute);
    const { error } = await supabase.from('tools').update({ stock: newStock }).eq('id', toolId);
    if (error) { console.error('Failed to update stock:', error); return; }
    setTools((prev) => prev.map((t) => {
      if (t.id === toolId) {
        let status: ToolItem['status'] = 'Available';
        if (newStock === 0) status = 'Out of Stock';
        else if (newStock <= t.minStock) status = 'Low Stock';
        return { ...t, stock: newStock, status };
      }
      return t;
    }));

    // Fire-and-forget: Sync AI Chatbot ChromaDB with updated stock
    fetch('http://localhost:8001/api/sync-chroma', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_codes: [tool.code] })
    }).catch(err => console.error('[AI Sync] Failed to sync stock update:', err));
  };

  return (
    <DataContext.Provider value={{
      isLoading, departments, users, tools, setTools,
      userRequests, setUserRequests,
      procurementRequests, setProcurementRequests,
      addUser, removeUser, addToolItem, updateToolStock
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataStore = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useDataStore must be used within DataProvider');
  return context;
};
