import { AuthRepository } from '../../domain/repositories/auth-repository'
import { UserSession } from '../../domain/entities/user-session'
import { getFirebaseAuth } from './client'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'

function isAdminEmail(email?: string | null) {
  return !!email && email.endsWith('@alumno.buap.mx')
}

export class FirebaseAuthRepository implements AuthRepository {
  async signIn(email: string, password: string): Promise<UserSession> {
    const auth = getFirebaseAuth()
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const user = cred.user
    const token = await user.getIdToken()
    return new UserSession({
      userId: user.uid,
      email: user.email || email,
      isAdmin: isAdminEmail(user.email),
      accessToken: token,
      expiresAt: null,
    })
  }
  async signUp(input: { email: string; password: string; fullName?: string; username?: string }): Promise<{ userId: string; email: string }> {
    const auth = getFirebaseAuth()
    const cred = await createUserWithEmailAndPassword(auth, input.email, input.password)
    // Profile doc creation handled separately
    return { userId: cred.user.uid, email: cred.user.email! }
  }
  async signOut(): Promise<void> {
    const auth = getFirebaseAuth()
    await signOut(auth)
  }
  async getSession(): Promise<UserSession | null> {
    const auth = getFirebaseAuth()
    const user = auth.currentUser
    if (!user) return null
    const token = await user.getIdToken()
    return new UserSession({
      userId: user.uid,
      email: user.email || '',
      isAdmin: isAdminEmail(user.email),
      accessToken: token,
      expiresAt: null,
    })
  }
}
