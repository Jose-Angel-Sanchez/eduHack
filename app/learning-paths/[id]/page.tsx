import { getCurrentUser } from "@/lib/firebase/server"
import { getFirestoreDb } from "@/src/infrastructure/firebase/client"
import { doc, getDoc } from "firebase/firestore"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import RoadmapClient from "@/components/learning-paths/roadmap-client"
import { computeRoadmapPercent } from "@/lib/roadmap/progress"
import { Brain, Clock, BookOpen, ArrowLeft } from "lucide-react"

type LearningPathRow = Database["public"]["Tables"]["learning_paths"]["Row"]

export default async function LearningPathDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  // Firestore migration placeholder: fetch learning path doc
  let pathData: any = null
  try {
    const db = getFirestoreDb()
    const snap = await getDoc(doc(db, 'learning_paths', params.id))
    if (snap.exists()) pathData = { id: snap.id, ...snap.data() }
  } catch (e) {
    console.error('Error loading learning path from Firestore', e)
  }
  if (!pathData || pathData.userId !== user.uid) notFound()

  // Gemini-generated data lives in path.path_data
  const data = (pathData.pathData || {}) as any
  const title: string = pathData.title || data.title || 'Ruta de aprendizaje'
  const description: string = pathData.description || data.description || ''
  const difficulty: string = data.difficulty || '-'
  const estimatedDuration: number = data.estimatedDuration || 0
  const courses: Array<{ course: any; reason?: string }> = Array.isArray(data.courses) ? data.courses : []
  const roadmap = data.roadmap && Array.isArray(data.roadmap.weeks) ? data.roadmap : { weeks: [] }

  // Compute progress: prefer user_progress; fallback to roadmap percent
  // Progress: placeholder until Firestore progress docs implemented
  const progress = computeRoadmapPercent(roadmap)

  // Determine if user is SSO (can upload videos). If admin client missing, default to false
  const canUpload = false // Pending migration for SSO/admin flag

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <Link href="/learning-paths">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" /> Volver
              </Button>
            </Link>
            <Badge className="bg-blue-100 text-blue-800">{path.status}</Badge>
            {path.generated_by_ai && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Brain className="h-3 w-3" />
                <span>IA</span>
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">{title}</h1>
          {description && <p className="text-gray-600 mt-2 max-w-3xl">{description}</p>}
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-3">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{estimatedDuration} semanas</span>
            </div>
            <div className="flex items-center space-x-1">
              <BookOpen className="h-4 w-4" />
              <span>{courses.length} cursos</span>
            </div>
            <Badge variant="outline">{difficulty}</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Roadmap client with typing animation and no raw JSON display */}
            <RoadmapClient pathId={pathData.id} initialRoadmap={roadmap} courses={courses} />

            {canUpload && (
              <div className="flex items-center gap-2">
                <form
                  action={`/api/learning-paths/${path.id}/upload-video`}
                  method="post"
                  encType="multipart/form-data"
                  className="flex items-center gap-2"
                >
                  <input type="file" name="file" accept="video/*" className="text-sm" />
                  <input type="text" name="title" placeholder="Título del video" className="text-sm border px-2 py-1 rounded" />
                  <Button type="submit" variant="outline">Subir Video (Superusuario)</Button>
                </form>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Progreso</CardTitle>
                <CardDescription>Tu avance en esta ruta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Completado</span>
                  <span className="text-sm text-gray-800">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="mt-4 flex gap-2">
                  <Link href="/learning-paths">
                    <Button variant="outline" className="w-full">Volver a Mis Rutas</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
