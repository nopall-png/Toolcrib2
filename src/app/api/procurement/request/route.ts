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
    const { toolId, quantity, requestedById } = await request.json();

    if (!toolId || !quantity) {
      return NextResponse.json({ success: false, message: 'Data request tidak lengkap.' }, { status: 400 });
    }

    // Ambil total request untuk generate PO Number (PR-TC-2026-XX)
    const { count } = await adminClient
      .from('procurement_requests')
      .select('*', { count: 'exact', head: true });
      
    const currentCount = count || 0;
    const newPrNo = `PR-TC-2026-${String(currentCount + 1).padStart(2, '0')}`;

    // Insert ke tabel menggunakan admin client (bypass RLS)
    const { data: prData, error } = await adminClient
      .from('procurement_requests')
      .insert({
        po_no: newPrNo, 
        tool_id: toolId, 
        quantity: quantity,
        requested_by_id: requestedById || null,
        status: 'Pending', 
        request_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase Admin Insert Error:", error);
      return NextResponse.json({ success: false, message: `DB Insert Error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: prData
    });

  } catch (error: any) {
    console.error("Procurement API Exception:", error);
    return NextResponse.json({ success: false, message: `System Error: ${error.message}` }, { status: 500 });
  }
}
