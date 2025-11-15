"use server";

<<<<<<< HEAD
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { Database } from "./supabase/database.types"

async function getSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(c => ({ name: c.name, value: c.value }))
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => cookieStore.set({ name, value, ...options }))
        },
      },
    }
  )
}

export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = await getSupabaseServer()
=======
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

// Las funciones de signIn y signUp ahora se manejan en el cliente con Firebase Auth
// Ver: components/auth/login-form-firebase.tsx y register-form-firebase.tsx
>>>>>>> b24e64e0cf6a0f7a4f44a2424d8e8f7959c01082

/**
 * Crea una cookie de sesión con el token de Firebase
 */
export async function createSessionCookie(idToken: string) {
  try {
    const cookieStore = await cookies();

    // Guardar el token en una cookie
    cookieStore.set("session", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 5, // 5 días
      path: "/",
    });

    return { success: true };
  } catch (error) {
<<<<<<< HEAD
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const fullName = formData.get("fullName")
  const username = formData.get("username")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  if (!username) {
    return { error: "Username is required" }
  }

  const supabase = await getSupabaseServer()

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")

    const desiredUsername = (username?.toString() || "").trim()
    const userMeta = {
      full_name: fullName?.toString() || "",
      username: desiredUsername,
    }

    // Attempt 1: try with requested username
    let { error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo: `${/^https?:\/\//i.test(baseUrl) ? baseUrl : `http://${baseUrl}`}/dashboard`,
        data: userMeta,
      },
    })

    // If DB failed to save profile (likely username conflict), retry with a unique suffix once
    if (error && /Database error saving new user|duplicate key value/i.test(error.message)) {
      const uniqueUsername = `${desiredUsername}_${Math.random().toString(36).slice(2, 6)}`
      const retryMeta = { ...userMeta, username: uniqueUsername }
      const retry = await supabase.auth.signUp({
        email: email.toString(),
        password: password.toString(),
        options: {
          emailRedirectTo: `${/^https?:\/\//i.test(baseUrl) ? baseUrl : `http://${baseUrl}`}/dashboard`,
          data: retryMeta,
        },
      })
      if (retry.error) {
        return { error: retry.error.message }
      }
      return { success: "¡Revisa tu correo para confirmar tu cuenta! Tu usuario se ajustó automáticamente por disponibilidad." }
    }

    if (error) return { error: error.message }

    return { success: "¡Revisa tu correo para confirmar tu cuenta y comenzar a aprender!" }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
=======
    console.error("Error creando cookie de sesión:", error);
    return { success: false, error: "Error al crear sesión" };
>>>>>>> b24e64e0cf6a0f7a4f44a2424d8e8f7959c01082
  }
}

export async function signOut() {
<<<<<<< HEAD
  const supabase = await getSupabaseServer()
=======
  const cookieStore = await cookies();
>>>>>>> b24e64e0cf6a0f7a4f44a2424d8e8f7959c01082

  // Eliminar todas las cookies de sesión
  cookieStore.delete("session");

  redirect("/auth/login");
}
