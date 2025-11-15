// Deprecated Supabase endpoint. Use /api/v3/courses instead.
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Deprecated endpoint. Use /api/v3/courses' }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({ error: 'Deprecated endpoint. Use /api/v3/courses' }, { status: 410 })
}
