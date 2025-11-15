import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, Users, Star } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import ClientWrapper from "@/components/wrappers/client-wrapper";
import CoursesListMinimal from "@/components/courses/courses-list-minimal";
import CourseCard from "@/components/courses/course-card";
import { getCurrentUser } from "@/lib/firebase/server";

export default async function CoursesPage() {
  // Check authentication
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const isAdmin = !!user.email?.includes("@alumno.buap.mx");

  // If super user, render management-style list with edit/delete
  if (isAdmin) {
    return (
      <ClientWrapper initialUser={user}>
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900">Mis cursos</h1>
                <p className="text-gray-600">
                  Administra, edita o elimina tus cursos
                </p>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CoursesListMinimal userId={user.uid} />
          </div>
        </div>
      </ClientWrapper>
    );
  }

  // TODO: Migrate courses listing to Firebase/Firestore
  // For now, show a simple message
  const courses: any[] = [];

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case "beginner":
        return "Principiante";
      case "intermediate":
        return "Intermedio";
      case "advanced":
        return "Avanzado";
      default:
        return level;
    }
  };

  const getAverageRating = (ratings: any[]) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    return (sum / ratings.length).toFixed(1);
  };

  // Rating and enrollment handlers are implemented inside CourseCard (client component)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Catálogo de Cursos
              </h1>
              <p className="text-gray-600 mt-2">
                Descubre cursos diseñados para tu nivel y objetivos
              </p>
            </div>
            {/* Acciones ahora en el navbar (hamburguesa en mobile) */}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-4 mb-8">
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-primary hover:text-white"
          >
            Todos
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-primary hover:text-white"
          >
            Programación
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-primary hover:text-white"
          >
            Diseño
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-primary hover:text-white"
          >
            Marketing
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-primary hover:text-white"
          >
            Tecnología
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-primary hover:text-white"
          >
            Gestión
          </Badge>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course: any) => (
            <CourseCard key={course.id} course={course} user={user} />
          ))}
        </div>

        {!courses ||
          (courses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay cursos disponibles
              </h3>
              <p className="text-gray-600">
                Los cursos aparecerán aquí una vez que estén disponibles.
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
