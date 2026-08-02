// ============================================================
// mock.ts — BACKWARD COMPATIBILITY SHIM
// ============================================================
// File ini sekarang hanya me-re-export semua types dari
// lokasi terpusat `@/src/types/index.ts`.
//
// Alasan: Banyak komponen masih import dari sini.
// Daripada mengubah 20+ file sekaligus, kita redirect di sini.
// Komponen baru sebaiknya langsung import dari '@/src/types'.
// ============================================================

export type {
  Department,
  ToolItem,
  UserRequestItem,
  UserRequest,
  ProcurementRequest,
  Approver,
  AppUser,
} from '@/src/types';

export { INITIAL_APPROVERS } from '@/src/types';

// Obsolete mock arrays removed. All data is now fetched directly from Supabase.
// These empty exports prevent build errors for any residual imports.
export const INITIAL_DEPARTMENTS: any[] = [];
export const INITIAL_TOOLS: any[] = [];
export const INITIAL_USER_REQUESTS: any[] = [];
export const INITIAL_PROCUREMENT_REQUESTS: any[] = [];
export const INITIAL_USERS: any[] = [];
