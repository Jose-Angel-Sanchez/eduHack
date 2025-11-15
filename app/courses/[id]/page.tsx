import { getCurrentUser } from "@/lib/firebase/server"
import { getFirestoreDb } from "@/src/infrastructure/firebase/client"
import { doc, getDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Clock, BookOpen, Users, Star, Play, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import EnrollButton from "@/components/courses/enroll-button"

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  const { id } = await params
  let course: any = null
  try {
    const db = getFirestoreDb()
    const snap = await getDoc(doc(db, 'courses', id))
    if (snap.exists()) course = { id: snap.id, ...snap.data() }
  } catch (e) {
    console.error('Error loading course', e)
  }
  if (!course || course.isActive === false) notFound()
  // Enrollment & progress migration pending – placeholder values
  const userProgress: any = null

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case "beginner":
        return "Principiante"
      case "intermediate":
        return "Intermedio"
      case "advanced":
        return "Avanzado"
      default:
        return level
    }
  }

  const isEnrolled = !!userProgress
  const progressPercentage = userProgress?.progress_percentage || 0
  const enrolledCount = (course.enrollments?.length || 0)
  const ratingsArr = (course.ratings || [])
  const averageRating = ratingsArr.length
    ? (ratingsArr.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / ratingsArr.length).toFixed(1)
    : '0.0'
  const modulesCount = (course.sections?.length || 0)
  const hasContent = modulesCount > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Navegación en navbar (hamburguesa en mobile) */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Badge className={getDifficultyColor(course.difficultyLevel)}>
                  {getDifficultyLabel(course.difficultyLevel)}
                </Badge>
                <Badge variant="secondary">{course.category}</Badge>
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>
              <p className="text-lg text-gray-600 mb-6">{course.description}</p>

              <div className="flex items-center space-x-6 text-sm text-gray-500 mb-6">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {Math.floor((course.estimatedDuration || 0) / 60)}h {(course.estimatedDuration || 0) % 60}m
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{modulesCount} módulos</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{enrolledCount} estudiantes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{averageRating} ({ratingsArr.length} reseñas)</span>
                </div>
              </div>

              {isEnrolled && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Tu progreso</span>
                    <span className="text-sm text-gray-500">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              )}
            </div>

            {/* Enrollment Card or details-only when no content */}
            <div className="lg:col-span-1">
              <Card className="lg:sticky lg:top-6">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {hasContent ? (isEnrolled ? "Continuar Aprendiendo" : "Comenzar Curso") : "Detalles del curso"}
                  </CardTitle>
                  <CardDescription>
                    {hasContent
                      ? (isEnrolled ? `Has completado ${progressPercentage}% del curso` : "Únete a miles de estudiantes")
                      : "Este curso aún no tiene contenido publicado."}
                  </CardDescription>
                </CardHeader>
                {hasContent && (
                  <CardContent>
                    <EnrollButton courseId={course.id} isEnrolled={isEnrolled} userId={user.uid} />
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Learning Objectives */}
            <Card>
              <CardHeader>
                <CardTitle>Lo que aprenderás</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {course.learning_objectives?.map((objective: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Requisitos previos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.prerequisites.map((prerequisite: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{prerequisite}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Course Modules */}
            <Card>
              <CardHeader>
                <CardTitle>Contenido del curso</CardTitle>
                <CardDescription>
                  {modulesCount} módulos • {Math.floor(course.estimated_duration / 60)} horas de
                  contenido
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(course.sections?.length ? course.sections : course.content?.modules || []).map((module: any, moduleIndex: number) => (
                    <div key={module.id || moduleIndex} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-3">
                        Módulo {moduleIndex + 1}: {module.title || module.name || `Sección ${moduleIndex + 1}`}
                      </h3>
                      {module.lessons?.length ? (
                        <div className="space-y-2">
                          {module.lessons?.map((lesson: any, lessonIndex: number) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                            >
                              <div className="flex items-center space-x-3">
                                <Play className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{lesson.title}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>{lesson.duration}min</span>
                                <Badge variant="outline" className="text-xs">
                                  {lesson.type === "video"
                                    ? "Video"
                                    : lesson.type === "interactive"
                                      ? "Interactivo"
                                      : "Ejercicio"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Aún no hay lecciones en esta sección.</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Course Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estadísticas del curso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estudiantes inscritos</span>
                    <span className="font-semibold">{enrolledCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Calificación promedio</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{averageRating}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tasa de finalización</span>
                    <span className="font-semibold">87%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
