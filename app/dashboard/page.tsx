import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, GraduationCap, Map, User } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/lib/actions";
import { getCurrentUser } from "@/lib/firebase/server";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const isAdmin = user.email?.includes("@alumno.buap.mx");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Bienvenido, {user.email}</p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </form>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Tu Perfil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo de cuenta</p>
                  <p className="font-medium">
                    {isAdmin ? "Administrador" : "Estudiante"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5" />
                Cursos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/courses">
                <Button className="w-full">Ver Cursos Disponibles</Button>
              </Link>
              {isAdmin && (
                <Link href="/manage">
                  <Button className="w-full" variant="outline">
                    Gestionar Mis Cursos
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Map className="w-5 h-5" />
                Rutas de Aprendizaje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/learning-paths">
                <Button className="w-full" variant="outline">
                  Ver Rutas
                </Button>
              </Link>
              <Link href="/learning-paths/create">
                <Button className="w-full" variant="outline">
                  Crear Nueva Ruta
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Estado de la Migración a Firebase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-green-600">✅</div>
                <div>
                  <p className="font-medium text-green-900">
                    Autenticación Migrada
                  </p>
                  <p className="text-sm text-gray-600">
                    El sistema de login y registro ahora funciona completamente
                    con Firebase Authentication.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 text-amber-600">⚠️</div>
                <div>
                  <p className="font-medium text-amber-900">
                    Datos en Migración
                  </p>
                  <p className="text-sm text-gray-600">
                    Las siguientes funcionalidades requieren migración de datos:
                  </p>
                  <div className="mt-2 text-sm text-gray-600 space-y-1 ml-4">
                    <div>• Cursos y contenido</div>
                    <div>• Progreso de usuario</div>
                    <div>• Rutas de aprendizaje</div>
                    <div>• Certificados</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  <b>Próximos pasos:</b> Los datos de cursos deben ser creados
                  nuevamente en Firestore o migrados desde Supabase. La
                  estructura de autenticación ya está completamente funcional.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
