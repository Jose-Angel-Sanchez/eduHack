import { checkSuperUser } from "../../../lib/utils/checkSuperUser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ContentUploader from "@/components/admin/content-uploader"
import ContentList from "@/components/admin/content-list-improved"

export default async function AdminContentPage() {
  const user = await checkSuperUser()
  // Supabase eliminado: placeholder vacío hasta migrar a Firestore.
  const myCourses: any[] = []

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Contenido</h1>

        {/* Global uploader con dropdown para seleccionar entre tus cursos */}
        <Card>
          <CardHeader>
            <CardTitle>Subir contenido y asignar a curso(s)</CardTitle>
          </CardHeader>
          <CardContent>
            <ContentUploader
              userId={user.id}
              initialCourses={myCourses.map((c: any) => ({ id: c.id, title: c.title }))}
            />
          </CardContent>
        </Card>

        {/* Content library (owned by this user) */}
        <Card>
          <CardHeader>
            <CardTitle>Mi biblioteca de contenido</CardTitle>
          </CardHeader>
          <CardContent>
            <ContentList userId={user.id} />
          </CardContent>
        </Card>

        {myCourses.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No tienes cursos propios aún</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Crea un curso para comenzar a asociar contenido multimedia.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
