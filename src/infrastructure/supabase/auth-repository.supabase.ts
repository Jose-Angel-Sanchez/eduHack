import { getSupabase } from './client'
import { AuthRepository } from '../../domain/repositories/auth-repository'
import { UserSession } from '../../domain/entities/user-session'
import { Profile } from '../../domain/entities/profile'
import { ProfileRepository } from '../../domain/repositories/auth-repository'
import { createAdminClient } from '../../../lib/supabase/admin'
import type { Database } from '../../../lib/supabase/database.types'

function isAdminEmail(email?: string | null) {
  return !!email && email.includes('@alumno.buap.mx')
}

export class SupabaseAuthRepository implements AuthRepository {
  async signIn(email: string, password: string): Promise<UserSession> {
    const supabase = await getSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    const user = data.user || data.session?.user
    if (!user) throw new Error('AUTH_NO_USER')
    return new UserSession({
      userId: user.id,
      email: user.email || email,
      isAdmin: isAdminEmail(user.email),
      accessToken: data.session?.access_token || null,
      expiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
    })
  }

  async signUp(input: { email: string; password: string; fullName?: string; username?: string }): Promise<{ userId: string; email: string }> {
    const supabase = await getSupabase()
    const meta = { full_name: input.fullName || '', username: input.username || input.email.split('@')[0] }
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { emailRedirectTo: `${baseUrl}/dashboard`, data: meta }
    })
    if (error) {
      // Fallback: attempt manual profile insertion if ambiguous DB error
      if (/Database error saving new user/i.test(error.message) && (data as any).user?.id) {
        try {
          const admin = createAdminClient()
          if (admin) {
            let desired = meta.username
            let attempt = await admin.from('profiles').insert({
              id: (data as any).user.id,
              email: input.email,
              full_name: meta.full_name,
              username: desired,
              avatar_url: ''
            })
            if (attempt.error && /duplicate|unique/i.test(attempt.error.message)) {
              desired = `${desired}_${Math.random().toString(36).slice(2,6)}`
              attempt = await admin.from('profiles').insert({
                id: (data as any).user.id,
                email: input.email,
                full_name: meta.full_name,
                username: desired,
                avatar_url: ''
              })
            }
            if (!attempt.error) {
              return { userId: (data as any).user.id, email: input.email }
            }
          }
        } catch (e) {
          console.error('Manual profile fallback failed', e)
        }
      }
      throw new Error(error.message)
    }
    if (!(data as any).user) throw new Error('SIGNUP_NO_USER')
    return { userId: (data as any).user.id, email: (data as any).user.email! }
  }

  async signOut(): Promise<void> {
    const supabase = await getSupabase()
    await supabase.auth.signOut()
  }

  async getSession(): Promise<UserSession | null> {
    const supabase = await getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    const user = session.user
    return new UserSession({
      userId: user.id,
      email: user.email || '',
      isAdmin: isAdminEmail(user.email),
      accessToken: session.access_token,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
    })
  }
}

export class SupabaseProfileRepository implements ProfileRepository {
  async getById(id: string): Promise<Profile | null> {
    const supabase = await getSupabase()
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (error) return null
    const row: any = data
    return new Profile({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      username: row.username,
      avatarUrl: row.avatar_url,
      learningLevel: row.learning_level,
      preferredLanguage: row.preferred_language,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  }
  async getByUsername(username: string): Promise<Profile | null> {
    const supabase = await getSupabase()
    const { data, error } = await supabase.from('profiles').select('*').eq('username', username).single()
    if (error) return null
    const row: any = data
    return new Profile({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      username: row.username,
      avatarUrl: row.avatar_url,
      learningLevel: row.learning_level,
      preferredLanguage: row.preferred_language,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  }
}
