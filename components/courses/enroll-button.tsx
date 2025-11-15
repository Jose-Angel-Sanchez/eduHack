"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { getFirebaseAuth, getFirestoreDb } from "../../src/infrastructure/firebase/client"
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { Loader2, Play, BookOpen } from "lucide-react"
import { toast } from "sonner"

interface EnrollButtonProps {
  courseId: string
  isEnrolled: boolean
  userId: string
}

export default function EnrollButton({ courseId, isEnrolled, userId }: EnrollButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const auth = getFirebaseAuth()
  const db = getFirestoreDb()

  const handleEnroll = async () => {
    if (!userId || !courseId) {
      toast.error("Error: faltan datos requeridos")
      return
    }
    setLoading(true)

    try {
      // Obtener usuario actual Firebase si no viene por prop
      const uid = userId || auth.currentUser?.uid
      if (!uid) {
        toast.error("Necesitas iniciar sesión")
        return
      }

      // Verificar si ya existe inscripción
      const q = query(
        collection(db, "enrollments"),
        where("userId", "==", uid),
        where("courseId", "==", courseId),
        limit(1)
      )
      const existing = await getDocs(q)
      if (!existing.empty) {
        toast.info("Ya estás inscrito en este curso")
        return
      }

      // Crear inscripción
      await addDoc(collection(db, "enrollments"), {
        userId: uid,
        courseId,
        createdAt: serverTimestamp()
      })

      toast.success("¡Inscripción exitosa!")
      router.refresh()
    } catch (error) {
      console.warn("Error enrolling in course:", error)
      toast.error("Error inesperado al inscribirse")
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    // Navigate to course learning interface
    router.push(`/learn/${courseId}`)
  }

  if (isEnrolled) {
    return (
      <Button onClick={handleContinue} className="w-full bg-primary hover:bg-primary-hover text-white" size="lg">
        <Play className="h-4 w-4 mr-2" />
        Continuar Curso
      </Button>
    )
  }

  return (
    <Button
      onClick={handleEnroll}
      disabled={loading}
      className="w-full bg-secondary hover:bg-secondary-hover text-white"
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Inscribiendo...
        </>
      ) : (
        <>
          <BookOpen className="h-4 w-4 mr-2" />
          Inscribirse Gratis
        </>
      )}
    </Button>
  )
}
