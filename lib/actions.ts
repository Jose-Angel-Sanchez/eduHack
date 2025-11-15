"use server"

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

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    const emailAddr = data?.user?.email || data?.session?.user?.email || ""
    const isAdmin = !!emailAddr?.includes("@alumno.buap.mx")

    return { success: true, isAdmin }
  } catch (error) {
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
  }
}

export async function signOut() {
  const supabase = await getSupabaseServer()

  await supabase.auth.signOut()
  redirect("/auth/login")
}
