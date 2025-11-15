import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { withAuthRetry } from "./auth"
import type { Database } from "./database.types"

const publicRoutes = [
  "/",
  "/auth/login",
  "/auth/register",
  "/api/test-gemini",
  "/_next",
  "/favicon.ico",
]

const adminRoutes = [
  "/manage",
  "/admin/courses",
  "/admin/content"
]

// In-memory cache with expiration
const cache = new Map<string, { value: any; expires: number }>()
const CACHE_TTL = 10000 // 10 seconds

const getFromCache = (key: string) => {
  const item = cache.get(key)
  if (!item) return null
  if (Date.now() > item.expires) {
    cache.delete(key)
    return null
  }
  return item.value
}

const setInCache = (key: string, value: any) => {
  cache.set(key, {
    value,
    expires: Date.now() + CACHE_TTL,
  })
}

const getAuthState = async (request: NextRequest) => {
  const cacheKey = request.cookies.get("supabase-auth-token")?.value
  if (cacheKey) {
    const cached = getFromCache(cacheKey)
    if (cached) return cached
  }

  // Create a response to modify
  const response = NextResponse.next()

  // Create the Supabase client using SSR helper
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(c => ({ name: c.name, value: c.value }))
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => response.cookies.set({ name, value, ...options }))
        },
      },
    }
  )

  // Get session with retry
  const { data: { session }, error: sessionError } = await withAuthRetry(() => 
    supabase.auth.getSession()
  )

  if (sessionError) {
    console.error("Session error:", sessionError)
    // Do not redirect here; let public routes load and protect only later
    return { response, session: null }
  }

  // Cache successful result
  if (cacheKey && session) {
    setInCache(cacheKey, { response, session })
  }

  return { response, session }
}

export async function updateSession(request: NextRequest) {
  try {
    const { response, session } = await getAuthState(request)

    // Check for auth code in URL
    const requestUrl = new URL(request.url)
  const authCode = requestUrl.searchParams.get("code")
  // Don't default here; we'll decide after exchanging code based on user role
  const next = requestUrl.searchParams.get("next") || null

    // Handle OAuth callback
    if (authCode) {
      try {
        const supabase = createServerClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return request.cookies.getAll().map(c => ({ name: c.name, value: c.value }))
              },
              setAll(cookies) {
                cookies.forEach(({ name, value, options }) => response.cookies.set({ name, value, ...options }))
              },
            },
          }
        )
        await supabase.auth.exchangeCodeForSession(authCode)

        // After session is created, decide default redirect when `next` is not provided
        let destination = next
        if (!destination) {
          const { data: { user } } = await supabase.auth.getUser()
          const isAdmin = !!user?.email?.includes("@alumno.buap.mx")
          destination = isAdmin ? "/manage" : "/dashboard"
        }
        return NextResponse.redirect(new URL(destination, request.url))
      } catch (error) {
        console.error("Auth code exchange error:", error)
        return NextResponse.redirect(new URL("/auth/login", request.url))
      }
    }

    // Check if the route is public
    const isPublicRoute = publicRoutes.some(
      (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route)
    )

    // Check if the route is admin-only
    const isAdminRoute = adminRoutes.some(
      (route) => request.nextUrl.pathname.startsWith(route)
    )

    // Redirect to login if accessing protected route without session
    if (!isPublicRoute && !session) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("next", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Redirect to dashboard if accessing admin route without proper permissions
  if (isAdminRoute && (!session?.user?.email?.includes("@alumno.buap.mx"))) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Return the response with updated cookies
    return response
  } catch (error) {
    console.error("Middleware error:", error)
  // On error, allow the request to proceed (public routes will still load)
  return NextResponse.next()
  }
}
