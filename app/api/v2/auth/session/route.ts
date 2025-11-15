import { NextResponse } from 'next/server'
// Deprecated Supabase session endpoint. Use /api/v3/auth/session (Firebase) instead.
export async function GET() {
  return NextResponse.json({ error: 'Deprecated endpoint. Use /api/v3/auth/session' }, { status: 410 })
}
