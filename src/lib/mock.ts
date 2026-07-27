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
  status: 'Pending' | 'Approved' | 'Issued' | 'Rejected' | 'Returned';
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
  status: 'Pending Approval' | 'Approved' | 'Ordered' | 'Fulfilled' | 'Rejected';
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
}

// Initial Mock Data (PostgreSQL seed equivalents)

export const INITIAL_APPROVERS: Approver[] = [
  { id: 'app-1', name: 'Andi Pratama', role: 'Production Manager', department: 'Production & Molding' },
  { id: 'app-2', name: 'Rina Wijaya', role: 'Maintenance SPV', department: 'Maintenance & Engineering' },
  { id: 'app-3', name: 'Budi Santoso', role: 'Plant Head', department: 'Management' },
];

export const DUMMY_APPROVERS = INITIAL_APPROVERS;

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', code: 'PROD', name: 'Production & Molding', passwordHash: 'user123' },
  { id: 'dept-2', code: 'MAINT', name: 'Maintenance & Engineering', passwordHash: 'user123' },
  { id: 'dept-3', code: 'QC', name: 'Quality Control & Lab', passwordHash: 'user123' },
  { id: 'dept-4', code: 'LOG', name: 'Logistics & Warehouse', passwordHash: 'user123' },
  { id: 'dept-5', code: 'TOOL', name: 'Tooling & Die Repair', passwordHash: 'user123' },
];

export const INITIAL_USERS: AppUser[] = [
  { id: 'usr-1', name: 'Budi Santoso', employeeId: 'EMP-001', departmentId: 'dept-1' },
  { id: 'usr-2', name: 'Siti Aminah', employeeId: 'EMP-002', departmentId: 'dept-1' },
  { id: 'usr-3', name: 'Riko Fernando', employeeId: 'EMP-003', departmentId: 'dept-2' },
  { id: 'usr-4', name: 'Joko Anwar', employeeId: 'EMP-004', departmentId: 'dept-2' },
  { id: 'usr-5', name: 'Nina Wati', employeeId: 'EMP-005', departmentId: 'dept-3' },
];

export const INITIAL_TOOLS: ToolItem[] = [
  {
    id: 'tool-001',
    code: 'TL-MKT-01',
    name: 'Makita Cordless Drill 18V LXT',
    category: 'Power Tools',
    stock: 12,
    minStock: 5,
    maxStock: 25,
    unit: 'pcs',
    location: 'Rack A-01 (Bin 4)',
    status: 'Available',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=60',
    description: 'Heavy duty 18V brushless driver drill for molding assembly.',
    lastRestocked: '2026-07-10',
  },
  {
    id: 'tool-002',
    code: 'TL-FLK-02',
    name: 'Fluke 87V Digital Multimeter',
    category: 'Measuring Tools',
    stock: 4,
    minStock: 3,
    maxStock: 10,
    unit: 'pcs',
    location: 'Rack B-03 (Cabinet 1)',
    status: 'Available',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
    description: 'Industrial true-rms multimeter with temperature probe.',
    lastRestocked: '2026-06-25',
  },
  {
    id: 'tool-003',
    code: 'TL-BOS-03',
    name: 'Bosch Angle Grinder 4" GWS 700',
    category: 'Power Tools',
    stock: 2,
    minStock: 4,
    maxStock: 15,
    unit: 'pcs',
    location: 'Rack A-02 (Bin 1)',
    status: 'Low Stock',
    imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500&auto=format&fit=crop&q=60',
    description: 'Compact 700W angle grinder for steel trimming.',
    lastRestocked: '2026-05-14',
  },
  {
    id: 'tool-004',
    code: 'TL-MIT-04',
    name: 'Mitutoyo Vernier Caliper 0-150mm',
    category: 'Measuring Tools',
    stock: 18,
    minStock: 5,
    maxStock: 30,
    unit: 'pcs',
    location: 'Rack B-01 (Drawer 2)',
    status: 'Available',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60',
    description: 'High precision stainless steel caliper for quality inspection.',
    lastRestocked: '2026-07-01',
  },
  {
    id: 'tool-005',
    code: 'TL-PPE-05',
    name: '3M Anti-Impact Safety Glasses',
    category: 'Safety & PPE',
    stock: 45,
    minStock: 20,
    maxStock: 100,
    unit: 'pair',
    location: 'Rack D-01 (Box A)',
    status: 'Available',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
    description: 'Clear lens anti-scratch anti-fog protective eyewear.',
    lastRestocked: '2026-07-18',
  },
  {
    id: 'tool-006',
    code: 'TL-WRC-06',
    name: 'Stanley Socket Wrench Set 24pcs',
    category: 'Hand Tools',
    stock: 8,
    minStock: 3,
    maxStock: 15,
    unit: 'set',
    location: 'Rack C-02 (Bin 8)',
    status: 'Available',
    imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=500&auto=format&fit=crop&q=60',
    description: 'Metric chrome vanadium ratchet & socket kit.',
    lastRestocked: '2026-06-30',
  },
  {
    id: 'tool-007',
    code: 'TL-LUB-07',
    name: 'WD-40 Multi-Use Lubricant 400ml',
    category: 'Consumables',
    stock: 1,
    minStock: 10,
    maxStock: 50,
    unit: 'pcs',
    location: 'Rack D-03 (Shelf 2)',
    status: 'Low Stock',
    imageUrl: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=500&auto=format&fit=crop&q=60',
    description: 'Penetrating oil rust remover & spray lubricant.',
    lastRestocked: '2026-04-10',
  },
  {
    id: 'tool-008',
    code: 'TL-DIE-08',
    name: 'Precision Mold Alignment Pin Set',
    category: 'Molding & Dies',
    stock: 5,
    minStock: 2,
    maxStock: 12,
    unit: 'set',
    location: 'Rack M-01 (Special Bin)',
    status: 'Available',
    imageUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=500&auto=format&fit=crop&q=60',
    description: 'Hardened steel guide pins for plastic injection molds.',
    lastRestocked: '2026-07-05',
  },
];

export const INITIAL_USER_REQUESTS: UserRequest[] = [
  // 3 Pengajuan Selesai (Completed)
  {
    id: 'req-101',
    requestNo: 'REQ-2026-001',
    userName: 'User Testing',
    employeeId: 'EMP-001',
    department: 'Production & Molding',
    items: [
      { toolId: 'tool-001', toolCode: 'TL-MKT-01', toolName: 'Makita Cordless Drill 18V LXT', quantity: 1, unit: 'pcs', status: 'Approved' },
      { toolId: 'tool-006', toolCode: 'TL-WRC-06', toolName: 'Stanley Socket Wrench Set 24pcs', quantity: 1, unit: 'set', status: 'Approved' }
    ],
    status: 'Issued',
    requestDate: '2026-07-21 08:30',
    notes: 'Perbaikan Line Mold 3 yang mogok.'
  },
  {
    id: 'req-102',
    requestNo: 'REQ-2026-002',
    userName: 'User Testing',
    employeeId: 'EMP-001',
    department: 'Production & Molding',
    items: [
      { toolId: 'tool-004', toolCode: 'TL-MIT-04', toolName: 'Mitutoyo Vernier Caliper 0-150mm', quantity: 1, unit: 'pcs', status: 'Approved' }
    ],
    status: 'Returned',
    requestDate: '2026-07-15 09:15',
    notes: 'Sudah selesai kalibrasi harian.'
  },
  {
    id: 'req-103',
    requestNo: 'REQ-2026-003',
    userName: 'User Testing',
    employeeId: 'EMP-001',
    department: 'Production & Molding',
    isNonStandard: true,
    nonStandardDetails: {
      toolName: 'Digital Multimeter Fluke 115',
      imageUrl: 'https://images.unsplash.com/photo-1581092335878-2d9fd86aecf3?w=500&auto=format&fit=crop&q=60',
      vendorName: 'PT Kawan Lama',
      price: 2500000,
      contact: '081234567890',
      dimensions: 'Standard',
      approver: 'Andi Pratama'
    },
    items: [],
    status: 'Rejected',
    requestDate: '2026-07-10 14:00',
    notes: 'Budget tidak mencukupi untuk pembelian bulan ini.'
  },

  // 3 Pengajuan Sedang Berjalan (On Going)
  {
    id: 'req-104',
    requestNo: 'REQ-2026-004',
    userName: 'User Testing',
    employeeId: 'EMP-001',
    department: 'Production & Molding',
    items: [
      { toolId: 'tool-005', toolCode: 'TL-PPE-05', toolName: '3M Anti-Impact Safety Glasses', quantity: 2, unit: 'pair', status: 'Pending' },
      { toolId: 'tool-008', toolCode: 'TL-DIE-08', toolName: 'Precision Mold Alignment Pin Set', quantity: 1, unit: 'set', status: 'Pending' }
    ],
    status: 'Pending',
    requestDate: '2026-07-25 10:00',
    notes: 'Safety pengganti operator shift pagi.'
  },
  {
    id: 'req-105',
    requestNo: 'REQ-2026-005',
    userName: 'User Testing',
    employeeId: 'EMP-001',
    department: 'Production & Molding',
    items: [
      { toolId: 'tool-003', toolCode: 'TL-BOS-03', toolName: 'Bosch Angle Grinder 4" GWS 700', quantity: 1, unit: 'pcs', status: 'Approved' }
    ],
    status: 'Approved',
    requestDate: '2026-07-24 13:45',
    notes: 'Persiapan pemotongan material besi.'
  },
  {
    id: 'req-106',
    requestNo: 'REQ-2026-006',
    userName: 'User Testing',
    employeeId: 'EMP-001',
    department: 'Production & Molding',
    isNonStandard: true,
    nonStandardDetails: {
      toolName: 'Heavy Duty Impact Wrench 3/4 inch',
      imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=500&auto=format&fit=crop&q=60',
      vendorName: 'Krisbow Indonesia',
      price: 4500000,
      contact: 'sales@krisbow.com',
      dimensions: '3/4 inch Drive',
      approver: 'Andi Pratama'
    },
    items: [],
    status: 'Pending',
    requestDate: '2026-07-26 08:15',
    notes: 'Pengajuan tool baru untuk overhaul mesin 2.'
  }
];

export const INITIAL_PROCUREMENT_REQUESTS: ProcurementRequest[] = [
  {
    id: 'pr-501',
    poNo: 'PR-TC-2026-01',
    toolId: 'tool-007',
    toolName: 'WD-40 Multi-Use Lubricant 400ml',
    quantity: 24,
    unit: 'pcs',
    reason: 'Stok menipis sisa 1 botol, kebutuhan tinggi di molding line.',
    requestedBy: 'Toolcrib Supervisor',
    status: 'Pending Approval',
    requestDate: '2026-07-20',
    estimatedCost: 1440000
  },
  {
    id: 'pr-502',
    poNo: 'PR-TC-2026-02',
    toolId: 'tool-003',
    toolName: 'Bosch Angle Grinder 4" GWS 700',
    quantity: 5,
    unit: 'pcs',
    reason: 'Buffer stok pengganti mesin grinder yang aus.',
    requestedBy: 'Toolcrib Staff',
    status: 'Approved',
    requestDate: '2026-07-19',
    estimatedCost: 3250000
  }
];
