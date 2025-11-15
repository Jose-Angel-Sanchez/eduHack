import { ProfileRepository } from '../../domain/repositories/auth-repository'
import { Profile } from '../../domain/entities/profile'
import { getFirestoreDb } from './client'
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore'

export class FirebaseProfileRepository implements ProfileRepository {
  async getById(id: string): Promise<Profile | null> {
    const db = getFirestoreDb()
    const ref = doc(db, 'profiles', id)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    const data: any = snap.data()
    return new Profile({
      id,
      email: data.email,
      fullName: data.fullName,
      username: data.username,
      avatarUrl: data.avatarUrl,
      learningLevel: data.learningLevel,
      preferredLanguage: data.preferredLanguage,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    })
  }
  async getByUsername(username: string): Promise<Profile | null> {
    const db = getFirestoreDb()
    const q = query(collection(db, 'profiles'), where('username', '==', username))
    const snaps = await getDocs(q)
    const first = snaps.docs[0]
    if (!first) return null
    const data: any = first.data()
    return new Profile({
      id: first.id,
      email: data.email,
      fullName: data.fullName,
      username: data.username,
      avatarUrl: data.avatarUrl,
      learningLevel: data.learningLevel,
      preferredLanguage: data.preferredLanguage,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    })
  }
}
