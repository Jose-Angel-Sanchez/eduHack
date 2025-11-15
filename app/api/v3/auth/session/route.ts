import { NextResponse } from 'next/server'
import { adminAuth } from '@infrastructure/firebase/admin'

export async function GET(request: Request) {
  try {
    const cookieHeader = (request as any).headers.get('cookie') || ''
    const fbSession = /fbSession=([^;]+)/.exec(cookieHeader)?.[1]
    if (!fbSession) return NextResponse.json({ session: null })
    const decoded = await adminAuth.verifySessionCookie(fbSession, true)
    return NextResponse.json({
      userId: decoded.uid,
      email: decoded.email || '',
      isAdmin: !!decoded.email && decoded.email.endsWith('@alumno.buap.mx')
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}
