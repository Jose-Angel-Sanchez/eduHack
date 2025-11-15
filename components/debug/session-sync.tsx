"use client"

import { useEffect, useState } from "react"
import { getFirebaseAuth } from "../../src/infrastructure/firebase/client"
import { getFirestoreDb } from "../../src/infrastructure/firebase/client"
import { doc, getDoc } from "firebase/firestore"

export default function SessionSync() {
  const [syncStatus, setSyncStatus] = useState<string>("🔄 Sincronizando...")
  const [profile, setProfile] = useState<any | null>(null)
  
  useEffect(() => {
    const syncSession = async () => {
      try {
        setSyncStatus("🔄 Verificando sesión Firebase...")
        const auth = getFirebaseAuth()
        const user = auth.currentUser
        if (!user) {
          setSyncStatus("❌ No hay sesión activa")
          return
        }
        setSyncStatus("✅ Sesión activa, cargando perfil...")
        try {
          const db = getFirestoreDb()
          const snap = await getDoc(doc(db, 'profiles', user.uid))
          setProfile(snap.exists() ? snap.data() : null)
          setSyncStatus("✅ Perfil cargado")
        } catch (e) {
          setSyncStatus("⚠️ Sesión sin perfil (profiles/<uid> inexistente)")
        }
      } catch (error) {
        console.error("Error en sincronización Firebase:", error)
        setSyncStatus(`❌ Error: ${error instanceof Error ? error.message : 'Desconocido'}`)
      }
    }
    
    syncSession()
  }, [])
  
  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm space-y-2">
      <div><strong>🔄 Estado Sesión:</strong> {syncStatus}</div>
      {profile && (
        <div className="text-xs bg-white/60 p-2 rounded border">
          <strong>Perfil:</strong> {JSON.stringify(profile)}
        </div>
      )}
    </div>
  )
}
