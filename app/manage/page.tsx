import { redirect } from "next/navigation";
import ClientWrapper from "@/components/wrappers/client-wrapper";
import CourseFormMinimal from "@/components/courses/course-form-minimal";
import { getCurrentUser } from "@/lib/firebase/server";

export default async function ManagePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <ClientWrapper initialUser={user}>
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Gestión de cursos</h1>
            <a href="/courses" className="text-blue-600 hover:underline">
              Ver catálogo
            </a>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Crear nuevo curso</h2>
            <CourseFormMinimal userId={user.uid} />
          </div>
        </div>
      </div>
    </ClientWrapper>
  );
}
