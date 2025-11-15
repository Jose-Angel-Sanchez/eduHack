import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set('fbSession', '', { path: '/', maxAge: 0 })
  return res
}
