// ============================================================
// Toolcrib2 — Centralized Type Definitions
// ============================================================
// Semua interface/type yang digunakan di seluruh aplikasi.
// Sebelumnya tersebar di mock.ts, sekarang terpusat di sini.
// ============================================================

export interface Department {
  id: string;
  code: string;
  name: string;
  passwordHash: string;
}

export interface ToolItem {
  id: string;
  sku?: string;
  code: string;
  name: string;
  category: 'Power Tools' | 'Hand Tools' | 'Measuring Tools' | 'Safety & PPE' | 'Consumables' | 'Molding & Dies' | string;
  subcategory?: string;
  brand?: string;
  model?: string;
  partNumber?: string;
  technicalSpec?: string;
  material?: string;
  dimension?: string;
  weight?: string;
  unit: string;
  stock: number;
  minStock: number;
  maxStock: number;
  warehouse?: string;
  rack?: string;
  bin?: string;
  location: string;
  supplier?: string;
  leadTimeDays?: number;
  supplierRating?: number;
  supplierEmail?: string;
  purchaseDate?: string;
  unitPrice?: number;
  totalValue?: number;
  department?: string;
  calibrationDate?: string;
  expiryDate?: string;
  status: 'Available' | 'Low Stock' | 'Out of Stock' | string;
  condition?: string;
  inspectionDate?: string;
  imageUrl: string;
  description?: string;
  lastRestocked?: string;
}

export interface UserRequestItem {
  toolId: string;
  toolCode?: string;
  toolName: string;
  quantity: number;
  unit?: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
}

export interface UserRequest {
  id: string;
  requestNo: string;
  userName: string;
  employeeId: string;
  department: string;
  items: UserRequestItem[];
  status: 'Pending' | 'Approved' | 'Issued' | 'Returned' | 'Rejected' | 'Cancelled';
  requestDate: string;
  notes?: string;
  isNonStandard?: boolean;
  nonStandardDetails?: {
    approver: string;
    toolName: string;
    vendorName: string;
    price: number;
    contact: string;
    dimensions: string;
    imageUrl: string;
  };
}

export interface ProcurementRequest {
  id: string;
  poNo: string;
  toolId: string;
  toolName: string;
  quantity: number;
  unit: string;
  reason: string;
  requestedBy: string;
  status: 'Pending' | 'Accept' | 'On going' | 'Sudah sampai' | 'Reject';
  requestDate: string;
  estimatedCost: number;
  isNonStandard?: boolean;
  notes?: {
    toolName?: string;
    vendorName?: string;
    price?: number;
    contact?: string;
    dimensions?: string;
    imageUrl?: string;
    approver?: string;
  };
  sourceRequestId?: string;
}

export interface Approver {
  id: string;
  name: string;
  role: string;
  department: string;
}

export interface AppUser {
  id: string;
  name: string;
  employeeId: string;
  departmentId: string;
  role?: string;
  passwordHash?: string;
}

// Re-export approvers mock data (masih dipakai di beberapa komponen)
export const INITIAL_APPROVERS: Approver[] = [
  { id: 'app-1', name: 'Andi Pratama', role: 'Production Manager', department: 'Production & Molding' },
  { id: 'app-2', name: 'Rina Wijaya', role: 'Maintenance SPV', department: 'Maintenance & Engineering' },
  { id: 'app-3', name: 'Budi Santoso', role: 'Plant Head', department: 'Management' },
];
