'use client';

import React, { createContext, useContext, useState } from 'react';
import type { Department, AppUser } from '@/src/types';

// ============================================================
// Auth Store — Session, Login, Logout
// ============================================================

export type UserRole = 'NONE' | 'USER' | 'TOOLCRIB' | 'PROCUREMENT';

export interface UserSession {
  role: UserRole;
  department?: Department;
  userName?: string;
  employeeId?: string;
  isVerified?: boolean;
  access_token?: string;
}

export interface AuthContextType {
  session: UserSession;
  loginUserStep1: (deptId: string, pass: string, departments: Department[]) => Promise<{ success: boolean; message?: string }>;
  loginUserStep2: (userId: string, users: AppUser[], password?: string) => Promise<{ success: boolean; message?: string }>;
  loginStaff: (role: 'TOOLCRIB' | 'PROCUREMENT', employeeId: string, pass: string, users: AppUser[]) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession>({ role: 'NONE' });

  const loginUserStep1 = async (deptId: string, pass: string, departments: Department[]) => {
    try {
      // Kita hanya butuh dept untuk dipass ke API secara tidak langsung (lewat employeeId + pass di step 2)
      // Namun API butuh EmployeeId, sehingga step 1 dan step 2 sebenarnya digabung di backend.
      // Untuk tidak merombak arsitektur terlalu jauh, kita simpan credentials sementara.
      const dept = departments.find((d) => d.id === deptId || d.code === deptId);
      if (!dept) return { success: false, message: 'Departemen tidak ditemukan.' };
      
      // Kita kembalikan true agar UI lanjut ke step 2.
      // Proses login sesungguhnya (ke API) akan terjadi di loginUserStep2!
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const loginUserStep2 = async (userId: string, users: AppUser[], password?: string) => {
    // Karena di UI, UserLogin.tsx mengirimkan user.id. Kita cari user-nya untuk dapatkan employeeId.
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, message: 'User tidak ditemukan' };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: user.employeeId, password, isStaff: false }),
      });
      const data = await res.json();
      
      if (!data.success) {
        return { success: false, message: data.message };
      }

      // IMPORT SUPABASE CLIENT AND SET SESSION
      const { supabase } = await import('../supabase');
      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      setSession((prev) => ({
        ...prev,
        role: 'USER',
        department: data.user.department,
        userName: data.user.name,
        employeeId: data.user.employeeId,
        isVerified: true,
        access_token: data.session?.access_token,
      }));
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const loginStaff = async (role: 'TOOLCRIB' | 'PROCUREMENT', employeeId: string, pass: string, users: AppUser[]) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, password: pass, isStaff: true }),
      });
      const data = await res.json();

      if (!data.success) {
        return { success: false, message: data.message };
      }

      // IMPORT SUPABASE CLIENT AND SET SESSION
      const { supabase } = await import('../supabase');
      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      setSession({ role, userName: data.user.name, employeeId: data.user.employeeId, isVerified: true });
      return { success: true };
    } catch (e: any) {
      return { success: false, message: 'Gagal menghubungi server.' };
    }
  };

  const logout = () => {
    setSession({ role: 'NONE' });
  };

  return (
    <AuthContext.Provider value={{ session, loginUserStep1, loginUserStep2, loginStaff, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthStore = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthStore must be used within AuthProvider');
  return context;
};
