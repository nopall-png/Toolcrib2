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
    const body = await request.json();
    const isBatch = Array.isArray(body.items);
    
    const items = isBatch ? body.items : [{ toolId: body.toolId, quantity: body.quantity }];
    const requestedById = body.requestedById;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Data request tidak lengkap.' }, { status: 400 });
    }

    // Ambil total request untuk generate PO Number (PR-TC-2026-XX)
    const { count } = await adminClient
      .from('procurement_requests')
      .select('*', { count: 'exact', head: true });
      
    const currentCount = count || 0;
    const batchId = Date.now().toString().slice(-4);
    const newPrNoBase = `PR-TC-2026-${String(currentCount + 1).padStart(2, '0')}-${batchId}`;

    // Insert ke tabel menggunakan admin client (bypass RLS)
    // Append suffix to avoid unique constraint violation if inserting multiple
    const insertData = items.map((item: any, index: number) => ({
      po_no: `${newPrNoBase}-${index + 1}`,
      tool_id: item.toolId, 
      quantity: item.quantity,
      requested_by_id: requestedById || null,
      status: 'Pending', 
      request_date: new Date().toISOString()
    }));

    console.log("=== INSERT DATA ===", JSON.stringify(insertData, null, 2));
    const { data: prData, error } = await adminClient
      .from('procurement_requests')
      .insert(insertData)
      .select();

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
