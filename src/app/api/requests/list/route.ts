import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET() {
  try {
    const { data, error } = await adminClient
      .from('user_requests')
      .select('*')
      .not('request_no', 'ilike', 'REQ-SEED-%')
      .order('request_date', { ascending: false });

    if (error) {
      console.error("Supabase Admin Select Error:", error);
      return NextResponse.json({ success: false, message: `DB Select Error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error("Requests API Exception:", error);
    return NextResponse.json({ success: false, message: `System Error: ${error.message}` }, { status: 500 });
  }
}
