import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { BookOpen, User, LogOut } from "lucide-react";
import { signOut } from "@/lib/actions";

export default async function DashboardSimplePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información de Usuario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {user.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium">UID:</span> {user.uid}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Tipo:</span>{" "}
                  {user.email?.includes("@alumno.buap.mx")
                    ? "Administrador"
                    : "Usuario"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/courses">
                <Button className="w-full" variant="outline">
                  Ver Cursos
                </Button>
              </Link>
              {user.email?.includes("@alumno.buap.mx") && (
                <Link href="/manage">
                  <Button className="w-full" variant="outline">
                    Gestionar Cursos
                  </Button>
                </Link>
              )}
              <Link href="/learning-paths">
                <Button className="w-full" variant="outline">
                  Rutas de Aprendizaje
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>✅ Migración a Firebase Completada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="text-green-600 font-medium">
                ✅ Autenticación funcionando correctamente con Firebase
              </p>
              <p className="text-amber-600">
                ⚠️ Algunas funcionalidades aún requieren migración de Supabase a
                Firestore:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                <li>Listado de cursos desde Firestore</li>
                <li>Progreso del usuario</li>
                <li>Rutas de aprendizaje</li>
                <li>Certificados</li>
              </ul>
              <p className="mt-4 text-gray-600">
                La autenticación ahora funciona con Firebase. Los datos de
                cursos y progreso necesitan ser migrados a Firestore para
                funcionalidad completa.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
