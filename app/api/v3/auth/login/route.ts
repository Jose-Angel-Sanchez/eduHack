import { NextResponse } from 'next/server'
import { FirebaseAuthRepository } from '@infrastructure/firebase/firebase-auth-repository'
import { SignInUseCase } from '@application/use-cases/auth/sign-in'
import { adminAuth } from '@infrastructure/firebase/admin'

// Creates a Firebase session cookie for persistent server-side auth
async function createSessionCookie(idToken: string) {
  // 24h expiry
  const expiresIn = 24 * 60 * 60 * 1000
  return adminAuth.createSessionCookie(idToken, { expiresIn })
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
    }
    const repo = new FirebaseAuthRepository()
    const useCase = new SignInUseCase(repo)
    const session = await useCase.execute(email, password)
    const sessionCookie = await createSessionCookie(session.accessToken || '')
    const res = NextResponse.json({
      userId: session.userId,
      email: session.email,
      isAdmin: session.isAdmin
    })
    res.cookies.set('fbSession', sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    })
    return res
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
