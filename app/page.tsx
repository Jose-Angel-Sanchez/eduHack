import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, Brain, Award, Users } from "lucide-react"
import { HomePageClient } from "@/components/home/home-page"

export default async function HomePage() {
  // Check if user is already logged in
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard")
  }

  return <HomePageClient />
}
