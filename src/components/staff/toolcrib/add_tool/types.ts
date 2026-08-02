export type EntryMode = 'restock' | 'new_tool';

export interface ItemFormState {
  sku: string;
  code: string;
  category: string;
  subcategory: string;
  name: string;
  brand: string;
  model: string;
  partNumber: string;
  technicalSpec: string;
  material: string;
  dimension: string;
  weight: string;
  unit: string;
  stock: number;
  minStock: number;
  maxStock: number;
  warehouse: string;
  rack: string;
  bin: string;
  supplier: string;
  leadTimeDays: number;
  supplierRating: number;
  supplierEmail: string;
  purchaseDate: string;
  unitPrice: number;
  department: string;
  calibrationDate: string;
  expiryDate: string;
  status: string;
  condition: string;
  inspectionDate: string;
  imageUrl: string;
}

export interface RestockItemState {
  toolId: string;
  quantityAdded: number;
  notes?: string;
}

export const createDefaultItemForm = (index: number): ItemFormState => ({
  sku: '',
  code: '',
  category: 'Measuring Tools',
  subcategory: 'ToolCrib',
  name: '',
  brand: 'Mitutoyo',
  model: 'MIT-198',
  partNumber: 'PN-5098',
  technicalSpec: 'Industrial grade precision tool',
  material: 'Stainless Steel',
  dimension: '110 x 58 x 25 mm',
  weight: '0.18 kg',
  unit: 'PCS',
  stock: 28,
  minStock: 10,
  maxStock: 100,
  warehouse: 'ToolCrib Main Warehouse',
  rack: 'R-4',
  bin: 'B-9',
  supplier: 'PT Precision Tools Indonesia',
  leadTimeDays: 10,
  supplierRating: 4.9,
  supplierEmail: 'support@precisiontools.co.id',
  purchaseDate: new Date().toISOString().substring(0, 10),
  unitPrice: 790000,
  department: 'Maintenance',
  calibrationDate: '2026-12-31',
  expiryDate: '',
  status: 'Active',
  condition: 'Good',
  inspectionDate: new Date().toISOString().substring(0, 10),
  imageUrl: '',
});
