import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
export const dynamic = "force-dynamic"
import { redirect } from "next/navigation"
import RegisterForm from "@/components/auth/register-form"

export default async function RegisterPage() {
  // If Supabase is not configured, show setup message directly
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Connect Supabase to get started</h1>
      </div>
    )
  }

  // Check if user is already logged in
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <RegisterForm />
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center bg-secondary text-white p-12">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold mb-6">¡Comienza tu viaje!</h1>
          <p className="text-xl mb-8 opacity-90">Únete a miles de estudiantes que aprenden de forma inteligente</p>
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Evaluación inicial personalizada</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Contenido adaptado a tu nivel</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Progreso en tiempo real</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
