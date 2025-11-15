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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const auth = getFirebaseAuth()
  const db = getFirestore()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const basicUser: FirebaseUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName
        }
        setUser(basicUser)
        // Cargar perfil Firestore
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

  const value = { user, profile, loading, signOut }

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
