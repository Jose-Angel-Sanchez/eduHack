import { getCurrentUser } from "@/lib/firebase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, Brain, Award, Users } from "lucide-react";
import { HomePageClient } from "@/components/home/home-page";

export default async function HomePage() {
  // Check if user is already logged in
  const user = await getCurrentUser();

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return <HomePageClient />;
}
