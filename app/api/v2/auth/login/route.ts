import { NextResponse } from 'next/server'

// Deprecated Supabase login endpoint. Use /api/v3/auth/login (Firebase) instead.
export async function POST() {
  return NextResponse.json({ error: 'Deprecated endpoint. Use /api/v3/auth/login' }, { status: 410 })
}
