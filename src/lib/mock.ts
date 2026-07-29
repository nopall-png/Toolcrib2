// PostgreSQL-ready TypeScript schemas & mock data for Toolcrib System

export interface Department {
  id: string;
  code: string;
  name: string;
  passwordHash: string; // for mock demo: simple string comparison
}

export interface ToolItem {
  id: string;
  sku?: string;
  code: string; // Item ID (ITM-00099)
  name: string; // Item Name
  category: 'Power Tools' | 'Hand Tools' | 'Measuring Tools' | 'Safety & PPE' | 'Consumables' | 'Molding & Dies' | string;
  subcategory?: string;
  brand?: string;
  model?: string;
  partNumber?: string;
  technicalSpec?: string;
  material?: string;
  dimension?: string;
  weight?: string;
  unit: string; // PCS, SET, BOX, etc.
  stock: number; // Stock Quantity
  minStock: number;
  maxStock: number;
  warehouse?: string;
  rack?: string;
  bin?: string;
  location: string; // Rack & Bin location
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
  imageUrl: string; // WAJIB / Mandatory image URL or base64 data
  description?: string;
  lastRestocked?: string;
}

export interface UserRequestItem {
  toolId: string;
  toolCode: string;
  toolName: string;
  quantity: number;
  unit: string;
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
  status: 'Pending' | 'Accept' | 'On going' | 'Sudah sampai' | 'Reject';
  requestDate: string;
  notes?: string;
  
  // Non-Standard Request fields
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
  estimatedCost: number; // in IDR
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

// Initial Mock Data (PostgreSQL seed equivalents)

export const INITIAL_APPROVERS: Approver[] = [
  { id: 'app-1', name: 'Andi Pratama', role: 'Production Manager', department: 'Production & Molding' },
  { id: 'app-2', name: 'Rina Wijaya', role: 'Maintenance SPV', department: 'Maintenance & Engineering' },
  { id: 'app-3', name: 'Budi Santoso', role: 'Plant Head', department: 'Management' },
];

// Obsolete mock arrays removed. All data is now fetched directly from Supabase.
