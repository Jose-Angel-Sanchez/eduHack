import { redirect, notFound } from "next/navigation";
import LearningInterface from "@/components/learn/learning-interface";
import { getCurrentUser } from "@/lib/firebase/server";

interface LearnPageProps {
  params: {
    id: string;
  };
}

export default async function LearnPage({ params }: LearnPageProps) {
  // Check authentication
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // TODO: Fetch course details from Firestore
  // For now, show a placeholder
  const course = null;
  const userProgress = null.single();

  if (!userProgress) {
    redirect(`/courses/${course.id}`);
  }

  // Fetch linked content (via course_content -> content)
  const { data: linkedContent } = await supabase
    .from("course_content")
    .select(
      "content:content(id, title, type, file_url, file_path, description, transcription, duration, created_at)"
    )
    .eq("course_id", course.id);

  const contentItems = (linkedContent || [])
    .map((row: any) => row.content)
    .filter(Boolean)
    .sort(
      (a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <LearningInterface
        course={course}
        userProgress={userProgress}
        userId={user.id}
        contentItems={contentItems}
      />
    </div>
  );
}
