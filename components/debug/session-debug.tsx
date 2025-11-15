"use client"

import { useEffect, useState } from "react"
import { getFirebaseAuth } from "../../src/infrastructure/firebase/client"
import { getFirestoreDb } from "../../src/infrastructure/firebase/client"
import { doc, getDoc } from "firebase/firestore"

export default function SessionDebug() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const checkSession = async () => {
      const auth = getFirebaseAuth()
      const db = getFirestoreDb()
      try {
        const currentUser = auth.currentUser
        let profile: any = null
        if (currentUser) {
          try {
            const snap = await getDoc(doc(db, 'profiles', currentUser.uid))
            profile = snap.exists() ? snap.data() : null
          } catch {}
        }
        setSessionInfo({
          session: currentUser ? {
            access_token: 'Firebase session',
            user_id: currentUser.uid,
            expires_at: 'Gestionado por Firebase'
          } : null,
          user: currentUser ? {
            id: currentUser.uid,
            email: currentUser.email,
            created_at: profile?.createdAt || '—'
          } : null,
          errors: {}
        })
      } catch (err) {
        setSessionInfo({
          session: null,
          user: null,
          errors: {
            general: err instanceof Error ? err.message : "Error desconocido"
          }
        })
      } finally {
        setLoading(false)
      }
    }
    
    checkSession()
  }, [])

  if (loading) {
    return (
      <div className="p-4 bg-blue-100 border border-blue-300 rounded">
        <p className="text-blue-800">🔄 Verificando sesión...</p>
      </div>
    )
  }

  const hasSession = !!sessionInfo?.session
  const hasUser = !!sessionInfo?.user

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h3 className="font-semibold mb-3 text-gray-800">🔍 Debug de Sesión Firebase</h3>
      
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        {/* Sesión */}
        <div className={`p-3 rounded ${hasSession ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
          <h4 className={`font-medium mb-2 ${hasSession ? 'text-green-800' : 'text-red-800'}`}>
            Sesión {hasSession ? '✅' : '❌'}
          </h4>
          {sessionInfo?.session ? (
            <div className="space-y-1">
              <p><strong>Token:</strong> {sessionInfo.session.access_token}</p>
              <p><strong>Usuario ID:</strong> <code className="bg-gray-200 px-1 rounded">{sessionInfo.session.user_id}</code></p>
              <p><strong>Expira:</strong> {sessionInfo.session.expires_at}</p>
            </div>
          ) : (
            <p className="text-red-700">No hay sesión activa</p>
          )}
        </div>

        {/* Usuario */}
        <div className={`p-3 rounded ${hasUser ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border`}>
          <h4 className={`font-medium mb-2 ${hasUser ? 'text-green-800' : 'text-red-800'}`}>
            Usuario {hasUser ? '✅' : '❌'}
          </h4>
          {sessionInfo?.user ? (
            <div className="space-y-1">
              <p><strong>ID:</strong> <code className="bg-gray-200 px-1 rounded">{sessionInfo.user.id}</code></p>
              <p><strong>Email:</strong> {sessionInfo.user.email}</p>
              <p><strong>Creado:</strong> {new Date(sessionInfo.user.created_at).toLocaleDateString()}</p>
            </div>
          ) : (
            <p className="text-red-700">No hay usuario autenticado</p>
          )}
        </div>
      </div>

      {/* Errores */}
      {(sessionInfo?.errors?.session || sessionInfo?.errors?.user || sessionInfo?.errors?.general) && (
        <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
          <h4 className="font-medium text-red-800 mb-2">⚠️ Errores encontrados:</h4>
          <div className="space-y-1 text-sm text-red-700">
            {sessionInfo.errors.session && <p><strong>Sesión:</strong> {sessionInfo.errors.session}</p>}
            {sessionInfo.errors.user && <p><strong>Usuario:</strong> {sessionInfo.errors.user}</p>}
            {sessionInfo.errors.general && <p><strong>General:</strong> {sessionInfo.errors.general}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
