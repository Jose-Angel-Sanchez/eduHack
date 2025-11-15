import { UserSession } from '../entities/user-session'
import { Profile } from '../entities/profile'

export interface AuthRepository {
  signIn(email: string, password: string): Promise<UserSession>
  signUp(input: { email: string; password: string; fullName?: string; username?: string }): Promise<{ userId: string; email: string }>
  signOut(): Promise<void>
  getSession(): Promise<UserSession | null>
}

export interface ProfileRepository {
  getById(id: string): Promise<Profile | null>
  getByUsername(username: string): Promise<Profile | null>
}
