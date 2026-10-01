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
    const { prId, status } = await request.json();

    if (!prId || !status) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap.' }, { status: 400 });
    }

    // Update tabel menggunakan admin client (bypass RLS)
    const { error } = await adminClient
      .from('procurement_requests')
      .update({ status })
      .eq('id', prId);

    if (error) {
      console.error("Supabase Admin Update Error:", error);
      return NextResponse.json({ success: false, message: `DB Update Error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true
    });

  } catch (error: any) {
    console.error("Procurement API Exception:", error);
    return NextResponse.json({ success: false, message: `System Error: ${error.message}` }, { status: 500 });
  }
}
