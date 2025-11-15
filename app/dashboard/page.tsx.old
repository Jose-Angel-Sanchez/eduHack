import { getCurrentUserAndProfile, getDisplayName } from "@/lib/supabase/auth"
import { withAuthRetry } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, Award, Play, Plus, Target } from "lucide-react"
import Link from "next/link"
import { signOut } from "@/lib/actions"
import ProgressAnalytics from "@/components/dashboard/progress-analytics"
import LearningRecommendations from "@/components/dashboard/learning-recommendations"

export default async function DashboardPage() {
  const supabase = createClient()

  let state = {
    userProgress: [] as any[],
    recentCourses: [] as any[],
    profile: null as any,
    user: null as any,
    displayName: "Usuario",
    completedCourses: 0,
    inProgressCourses: 0,
    totalTimeSpent: 0,
    averageProgress: 0,
  }
  
  try {
    const userAndProfile = await getCurrentUserAndProfile(supabase as any)
    state.user = userAndProfile.user
    state.profile = userAndProfile.profile

    // Get user's enrolled courses with progress with retry
  const progressResult: any = await withAuthRetry(() =>
      ((supabase.from("user_progress") as any).select(`
        *,
        courses (
          id,
          title,
          description,
          category,
          difficulty_level,
          estimated_duration
        )
      `) as any)
        .eq("user_id", state.user.id)
        .order("last_accessed", { ascending: false })
    )
    state.userProgress = progressResult.data || []

    // Get recent courses for recommendations with retry
  const coursesResult: any = await withAuthRetry(() =>
      ((supabase.from("courses") as any).select("*") as any)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6)
    )
    state.recentCourses = coursesResult.data || []

    // Calculate metrics
    state.completedCourses = state.userProgress?.filter((p: any) => p.status === "completed").length || 0
    state.inProgressCourses = state.userProgress?.filter((p: any) => p.status === "in_progress").length || 0
    state.totalTimeSpent = state.userProgress?.reduce((total: number, p: any) => total + (p.time_spent || 0), 0) || 0
    state.averageProgress = state.userProgress?.length > 0
      ? Math.round(state.userProgress.reduce((sum: number, p: any) => sum + p.progress_percentage, 0) / state.userProgress.length)
      : 0

    state.displayName = getDisplayName(state.user, state.profile)

  } catch (error) {
    console.error("Authentication error:", error)
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">¡Hola, {state.displayName}!</h1>
                <p className="text-gray-600 mt-1">Continúa tu viaje de aprendizaje</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
  <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos Completados</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.completedCourses}</div>
              <p className="text-xs text-muted-foreground">
                {state.completedCourses > 0 ? `+${Math.round(state.completedCourses * 0.2)} este mes` : "Completa tu primero"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.inProgressCourses}</div>
              <p className="text-xs text-muted-foreground">Progreso promedio: {state.averageProgress}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Total</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.floor(state.totalTimeSpent / 60)}h</div>
              <p className="text-xs text-muted-foreground">{Math.round(state.totalTimeSpent % 60)}min adicionales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.averageProgress}%</div>
              <p className="text-xs text-muted-foreground">Progreso promedio acumulado</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Continue Learning */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Continúa Aprendiendo</h2>

              {state.userProgress && state.userProgress.length > 0 ? (
                <div className="space-y-4">
                  {state.userProgress.slice(0, 3).map((progress: any) => (
                    <Card key={progress.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{progress.courses?.title}</h3>
                            <p className="text-gray-600 text-sm mb-4">{progress.courses?.description}</p>
                            <div className="flex items-center space-x-4 mb-4">
                              <Badge variant="secondary">{progress.courses?.category}</Badge>
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                {Math.floor((progress.courses?.estimated_duration || 0) / 60)}h
                              </div>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Progreso</span>
                              <span className="text-sm text-gray-500">{progress.progress_percentage}%</span>
                            </div>
                            <Progress value={progress.progress_percentage} className="h-2" />
                          </div>
                          <div className="ml-6">
                            <Link href={`/learn/${progress.course_id}`}>
                              <Button className="bg-primary hover:bg-primary-hover text-white">
                                <Play className="h-4 w-4 mr-2" />
                                Continuar
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">¡Comienza tu primer curso!</h3>
                    <p className="text-gray-600 mb-4">Explora nuestro catálogo y encuentra el curso perfecto para ti</p>
                    <Link href="/courses">
                      <Button className="bg-primary hover:bg-primary-hover text-white">Explorar Cursos</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            <ProgressAnalytics userProgress={state.userProgress || []} profile={state.profile} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <LearningRecommendations
              userProgress={state.userProgress || []}
              profile={state.profile}
              courses={state.recentCourses || []}
            />

            {/* Learning Goals (real, simple metrics) */}
            <Card>
              <CardHeader>
                <CardTitle>Objetivos de Aprendizaje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Cursos en progreso</span>
                      <span>{state.inProgressCourses}</span>
                    </div>
                    <Progress value={Math.min(100, (state.inProgressCourses / Math.max(1, (state.inProgressCourses + state.completedCourses))) * 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progreso general</span>
                      <span>{state.averageProgress}%</span>
                    </div>
                    <Progress value={state.averageProgress} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Cursos este año</span>
                      <span>{state.completedCourses}/5 cursos</span>
                    </div>
                    <Progress value={(state.completedCourses / 5) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
