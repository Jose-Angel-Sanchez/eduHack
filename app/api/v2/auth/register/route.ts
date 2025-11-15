import { NextResponse } from 'next/server'
// Deprecated Supabase register endpoint. Use /api/v3/auth/register (Firebase) instead.
export async function POST() {
  return NextResponse.json({ error: 'Deprecated endpoint. Use /api/v3/auth/register' }, { status: 410 })
}
