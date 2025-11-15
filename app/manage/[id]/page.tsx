import ClientWrapper from "@/components/wrappers/client-wrapper";
import EditCourseClient from "@/components/courses/edit-course-client";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/server";

async function getCourse(id: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  // TODO: Fetch course from Firestore
  // For now, return a placeholder
  return {
    id,
    title: "",
    description: "",
    category: "",
    difficulty_level: "beginner",
    estimated_duration: 0,
    created_by: user.uid,
  };
}

export default async function ManageEditCoursePage({
  params,
}: {
  params: { id: string };
}) {
  const course = await getCourse(params.id);
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <ClientWrapper initialUser={user}>
      <div className="max-w-2xl mx-auto p-6 bg-white border rounded">
        <h1 className="text-xl font-semibold mb-4">Editar curso</h1>
        <EditCourseClient course={course} />
      </div>
    </ClientWrapper>
  );
}
