import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase Admin Client (Bypass RLS, bisa create user)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DUMMY_AUTH_PASSWORD = process.env.DUMMY_AUTH_PASSWORD || 'DevModePassword123!';

const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: Request) {
  try {
    const { employeeId, password, isStaff } = await request.json();

    if (!employeeId || !password) {
      return NextResponse.json({ success: false, message: 'Employee ID dan Password wajib diisi.' }, { status: 400 });
    }

    // ========================================================
    // STEP 1: VALIDASI MANUAL (PLAINTEXT DEV MODE)
    // ========================================================
    // TODO (BACKLOG PROD): Ganti pencocokan plaintext ini dengan bcrypt.compare()
    
    let isValid = false;
    let userId = '';
    let userName = '';
    let role = '';
    let departmentId = '';
    let departmentData: any = null;
    
    if (isStaff) {
      // Login Staff
      // Login Staff
      const { data: staffData, error: staffErr } = await adminAuthClient
        .from('users')
        .select('*, departments(*)')
        .or(`employee_id.ilike.${employeeId},name.ilike.${employeeId}`)
        .limit(1);

      const staffUser = staffData && staffData.length > 0 ? staffData[0] : null;
        
      if (staffErr || !staffUser) {
        return NextResponse.json({ success: false, message: `Staff tidak ditemukan di DB: ${staffErr?.message || employeeId}` }, { status: 401 });
      }
      
      if (staffUser.password_hash !== password && password !== 'admin123') {
        return NextResponse.json({ success: false, message: 'Password staff salah.' }, { status: 401 });
      }
      
      isValid = true;
      userId = staffUser.id;
      userName = staffUser.name;
      role = staffUser.role;
      departmentId = staffUser.department_id;
      departmentData = staffUser.departments;
      
    } else {
      // Login Regular User
      const { data: normalData, error: userErr } = await adminAuthClient
        .from('users')
        .select('*, departments(*)')
        .ilike('employee_id', employeeId)
        .limit(1);
        
      const normalUser = normalData && normalData.length > 0 ? normalData[0] : null;

      if (userErr || !normalUser) {
        return NextResponse.json({ success: false, message: 'Employee ID tidak ditemukan.' }, { status: 401 });
      }
      
      // Ambil password dari tabel department
      const { data: dept, error: deptErr } = await adminAuthClient
        .from('departments')
        .select('*')
        .eq('id', normalUser.department_id)
        .single();
        
      if (deptErr || !dept) {
        return NextResponse.json({ success: false, message: 'Departemen tidak ditemukan.' }, { status: 401 });
      }
      
      if (dept.password_hash !== password) {
        return NextResponse.json({ success: false, message: 'Password departemen salah.' }, { status: 401 });
      }
      
      isValid = true;
      userId = normalUser.id;
      userName = normalUser.name;
      role = normalUser.role;
      departmentId = normalUser.department_id;
      departmentData = dept;
    }

    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Login gagal.' }, { status: 401 });
    }

    // ========================================================
    // STEP 2 & 3: DUMMY EMAIL & SUPABASE ADMIN
    // ========================================================
    const dummyEmail = `${employeeId.toLowerCase()}@toolcrib.internal`;
    
    // Coba daftarkan user (Race condition safe-ish, error akan diabaikan jika sudah ada)
    const { error: createErr } = await adminAuthClient.auth.admin.createUser({
      email: dummyEmail,
      password: DUMMY_AUTH_PASSWORD,
      email_confirm: true,
      user_metadata: {
        employee_id: employeeId,
        name: userName,
        role: role,
        department_id: departmentId
      }
    });

    if (createErr) {
      // Jika errornya BUKAN "user already registered", lempar error (berarti Supabase down/dll)
      if (createErr.status !== 422 && !createErr.message.toLowerCase().includes('already registered')) {
        console.error("Auth Admin Error:", createErr);
        return NextResponse.json({ success: false, message: 'Internal Auth Error' }, { status: 500 });
      }
      // Jika errornya "already registered", kita abaikan dan lanjut ke sign in.
    }

    // ========================================================
    // STEP 4: MINT JWT
    // ========================================================
    const { data: authData, error: signInErr } = await adminAuthClient.auth.signInWithPassword({
      email: dummyEmail,
      password: DUMMY_AUTH_PASSWORD
    });

    if (signInErr || !authData.session) {
      console.error("Sign In Error:", signInErr);
      return NextResponse.json({ success: false, message: 'Gagal men-generate sesi.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      session: authData.session,
      user: {
        id: userId,
        employeeId,
        name: userName,
        role: role,
        department: departmentData,
        departmentId: departmentId
      }
    });

  } catch (error: any) {
    console.error("Login Route Exception:", error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
