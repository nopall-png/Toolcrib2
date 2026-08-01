import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: Request) {
  try {
    // 1. Role Validation (Security Check)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Missing Authorization header.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    // Gunakan adminClient (atau anon client) khusus untuk verify token ini
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ success: false, message: `Unauthorized: Invalid token. Details: ${authError?.message || 'User not found'}` }, { status: 401 });
    }

    // Periksa role dengan query database aktual (TIDAK dari user_metadata yang bisa diubah user)
    const emailStr = user.email || '';
    const extractedEmployeeId = emailStr.split('@')[0];
    
    // Hindari wildcard injection pada ilike
    const safeEmployeeId = extractedEmployeeId.replace(/%/g, '\\%').replace(/_/g, '\\_');
    
    const { data: dbUser, error: dbError } = await adminClient
      .from('users')
      .select('role')
      .ilike('employee_id', safeEmployeeId)
      .single();

    if (dbError || !dbUser) {
      return NextResponse.json({ success: false, message: 'Forbidden: User tidak ditemukan di database.' }, { status: 403 });
    }

    if (!dbUser.role || dbUser.role.toUpperCase() !== 'TOOLCRIB') {
      return NextResponse.json({ success: false, message: 'Forbidden: Hanya Toolcrib yang dapat menyetujui request.' }, { status: 403 });
    }

    // 2. Parse Body
    const { reqId } = await request.json();
    if (!reqId) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap. reqId diperlukan.' }, { status: 400 });
    }

    // 3. Panggil RPC (Atomic operation)
    // RPC is SECURITY DEFINER, so we execute it via adminClient safely now that we checked the role
    const { data: rpcData, error: rpcError } = await adminClient.rpc('approve_nonstandard_request', { req_id: reqId });

    if (rpcError) {
      console.error("RPC approve_nonstandard_request Error:", rpcError);
      return NextResponse.json({ success: false, message: `System Error: ${rpcError.message}` }, { status: 500 });
    }

    if (!rpcData.success) {
      return NextResponse.json({ success: false, message: rpcData.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: rpcData.data,
      message: rpcData.message || 'Berhasil'
    });

  } catch (error: any) {
    console.error("NonStandard Approve API Exception:", error);
    return NextResponse.json({ success: false, message: `System Error: ${error.message}` }, { status: 500 });
  }
}
