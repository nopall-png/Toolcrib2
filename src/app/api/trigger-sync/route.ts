import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://localhost:8001/api/sync-chroma", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
