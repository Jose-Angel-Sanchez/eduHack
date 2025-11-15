"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getFirebaseAuth } from "../../src/infrastructure/firebase/client"
import { getFirestore, doc, getDoc } from "firebase/firestore"

interface FirebaseUser {
  uid: string
  email?: string | null
  displayName?: string | null
}

interface AuthContextType {
  user: FirebaseUser | null
  profile: any | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {}
})

interface AuthProviderProps {
  children: React.ReactNode
  initialUser?: FirebaseUser | null
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(initialUser || null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(!initialUser)
  const auth = getFirebaseAuth()
  const db = getFirestore()

  const refreshSession = async () => {
    setLoading(true)
    try {
      const firebaseUser = auth.currentUser
      if (firebaseUser) {
        const basicUser: FirebaseUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName
        }
        setUser(basicUser)
        const ref = doc(db, 'profiles', firebaseUser.uid)
        const snap = await getDoc(ref)
        setProfile(snap.exists() ? snap.data() : null)
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch (e) {
      console.warn('Error refreshing session', e)
      setUser(null); setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const basicUser: FirebaseUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName
        }
        setUser(basicUser)
        try {
          const ref = doc(db, 'profiles', firebaseUser.uid)
          const snap = await getDoc(ref)
          setProfile(snap.exists() ? snap.data() : null)
        } catch (e) {
          console.warn('Error loading profile', e)
          setProfile(null)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [auth, db])

  const signOut = async () => {
    await auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = { user, profile, loading, signOut, refreshSession }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
