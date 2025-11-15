'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, BookOpen, Users, Star, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getFirebaseAuth, getFirestoreDb } from "../../src/infrastructure/firebase/client"
import { collection, query, where, getDocs, addDoc, serverTimestamp, limit, updateDoc, doc } from "firebase/firestore"
// Migrated from Supabase to Firebase (Auth + Firestore)
import EnrollButton from "./enroll-button"

interface CourseCardProps {
  course: any
  user: any
}

export default function CourseCard({ course, user }: CourseCardProps) {
  const auth = getFirebaseAuth()
  const db = getFirestoreDb()
  const getDifficultyColor = (level: string) => {
    switch ((level || '').toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyLabel = (level: string) => {
    switch ((level || '').toLowerCase()) {
      case 'beginner':
        return 'Principiante'
      case 'intermediate':
        return 'Intermedio'
      case 'advanced':
        return 'Avanzado'
      default:
        return level
    }
  }
  const [localRating, setLocalRating] = useState<number>(0)
  const [isRating, setIsRating] = useState(false)
  const [showEnrolled, setShowEnrolled] = useState(false)
  const [enrolledUsers, setEnrolledUsers] = useState<Array<{ id: string; full_name: string; email: string }>>([])
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [ratings, setRatings] = useState<any[]>([])

  const getAverageRating = (list: any[]) => {
    if (!list || list.length === 0) return 0
    const sum = list.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0)
    return (sum / list.length).toFixed(1)
  }

  const isUserEnrolled = () => isEnrolled

  const handleRating = async (courseId: string, rating: number) => {
    if (isRating) return
    if (!auth.currentUser) return
    setIsRating(true)
    try {
      // Buscar rating existente del usuario
      const existingQ = query(
        collection(db, 'feedback'),
        where('courseId', '==', courseId),
        where('userId', '==', auth.currentUser.uid),
        limit(1)
      )
      const snap = await getDocs(existingQ)
      if (!snap.empty) {
        // Actualizar documento existente
        await updateDoc(doc(db, 'feedback', snap.docs[0].id), { rating, updatedAt: serverTimestamp() })
      } else {
        await addDoc(collection(db, 'feedback'), {
          courseId,
          userId: auth.currentUser.uid,
          rating,
          createdAt: serverTimestamp()
        })
      }
      setLocalRating(rating)
      // Refrescar listado de ratings
      await loadRatings()
    } catch (error) {
      console.error('Error rating course:', error)
    } finally {
      setIsRating(false)
    }
  }

  const loadRatings = async () => {
    try {
      const qRatings = query(collection(db, 'feedback'), where('courseId', '==', course.id))
      const snap = await getDocs(qRatings)
      const list = snap.docs.map(d => d.data())
      setRatings(list)
      if (auth.currentUser) {
        const own = list.find(r => r.userId === auth.currentUser!.uid)
        if (own) setLocalRating(own.rating || 0)
      }
    } catch (e) {
      console.warn('Error loading ratings:', e)
    }
  }

  const loadEnrollmentStatus = async () => {
    if (!auth.currentUser) return
    try {
      const qEnroll = query(
        collection(db, 'enrollments'),
        where('courseId', '==', course.id),
        where('userId', '==', auth.currentUser.uid),
        limit(1)
      )
      const snap = await getDocs(qEnroll)
      setIsEnrolled(!snap.empty)
    } catch (e) {
      console.warn('Error checking enrollment:', e)
    }
  }

  // Load enrolled users' profiles when toggled open
  useEffect(() => {
    // Cargar estado inicial (ratings y enrollment)
    loadRatings()
    loadEnrollmentStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id])

  useEffect(() => {
    const loadEnrolledProfiles = async () => {
      if (!showEnrolled) return
      try {
        // Obtener hasta N matriculados para listado (ampliar con paginación futura)
        const qEnroll = query(collection(db, 'enrollments'), where('courseId', '==', course.id))
        const snap = await getDocs(qEnroll)
        const userIds = snap.docs.map(d => (d.data() as any).userId)
        if (userIds.length === 0) {
          setEnrolledUsers([])
          return
        }
        // Cargar perfiles
        const qProfiles = query(collection(db, 'profiles'), where('id', 'in', userIds.slice(0, 10)))
        const pSnap = await getDocs(qProfiles)
        const list = pSnap.docs.map(d => d.data() as any)
        setEnrolledUsers(list.map(p => ({ id: p.id, full_name: p.full_name || '', email: p.email || '' })))
      } catch (e) {
        console.warn('Error loading enrolled profiles:', e)
      }
    }
    loadEnrolledProfiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEnrolled])

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge className={getDifficultyColor(course.difficulty_level)}>
            {getDifficultyLabel(course.difficulty_level)}
          </Badge>
          <Badge variant="secondary">{course.category}</Badge>
        </div>
        <CardTitle className="text-xl">{course.title}</CardTitle>
        <CardDescription className="text-sm text-gray-600 line-clamp-3">{course.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>
              {Math.floor(course.estimated_duration / 60)}h {course.estimated_duration % 60}m
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <BookOpen className="h-4 w-4" />
            <span>{(course.sections?.length ?? course.content?.modules?.length ?? 0)} módulos</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <button
            type="button"
            onClick={() => setShowEnrolled(v => !v)}
            className="flex items-center space-x-1 hover:text-gray-700"
            aria-expanded={showEnrolled}
          >
            <Users className="h-4 w-4" />
            <span>{course.enrollments?.length || 0} estudiantes</span>
            {showEnrolled ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </button>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="ml-1">{getAverageRating(ratings)}</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(course.id, star)}
                  disabled={isRating}
                  className="focus:outline-none transition-colors duration-200"
                  aria-label={`Calificar ${star} estrellas`}
                  title={isUserEnrolled() ? `Calificar ${star}` : 'Inscríbete para calificar'}
                >
                  <Star 
                    className={`h-4 w-4 ${
                      localRating >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {showEnrolled && (
          <div className="mb-3 rounded border p-2 bg-gray-50">
            <p className="text-xs font-medium text-gray-700 mb-1">Inscritos</p>
            {enrolledUsers.length === 0 ? (
              <p className="text-xs text-gray-500">Sin inscripciones</p>
            ) : (
              <ul className="max-h-28 overflow-auto text-xs text-gray-700 list-disc pl-4">
                {enrolledUsers.map((u) => (
                  <li key={u.id} title={u.email} className="truncate">
                    {u.full_name || u.email}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="space-y-2">
          <EnrollButton
            courseId={course.id}
            userId={auth.currentUser?.uid || user.id}
            isEnrolled={isUserEnrolled()}
          />
          <Link href={`/courses/${course.id}`}>
            <Button variant="outline" className="w-full">
              Ver detalles del curso
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
