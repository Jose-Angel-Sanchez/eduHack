import { NextResponse } from 'next/server'
import { FirebaseAuthRepository } from '@infrastructure/firebase/firebase-auth-repository'
import { SignUpUseCase } from '@application/use-cases/auth/sign-up'
import { getFirestoreDb } from '@infrastructure/firebase/client'
import { doc, setDoc } from 'firebase/firestore'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const repo = new FirebaseAuthRepository()
    const useCase = new SignUpUseCase(repo)
    const result = await useCase.execute({
      email: body.email,
      password: body.password,
      fullName: body.fullName,
      username: body.username
    })
    // Create profile document
    const db = getFirestoreDb()
    await setDoc(doc(db, 'profiles', result.userId), {
      email: result.email,
      fullName: body.fullName || '',
      username: body.username || result.email.split('@')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    return NextResponse.json({ userId: result.userId, email: result.email }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
