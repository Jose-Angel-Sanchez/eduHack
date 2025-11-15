<<<<<<< HEAD
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cache } from "react"
import type { Database } from "./database.types"
=======
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { cache } from "react";
>>>>>>> b24e64e0cf6a0f7a4f44a2424d8e8f7959c01082

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

// Create a cached version of the Supabase client for Server Components
export const createClient = cache(async () => {
  if (!isSupabaseConfigured) {
    // Si Supabase no está configurado, retornamos un cliente mock
    // Esto permite que la app funcione solo con Firebase
    return null as any;
  }
<<<<<<< HEAD
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const store = await cookies()
          return store.getAll().map((c) => ({ name: c.name, value: c.value }))
        },
      },
    }
  )
})
=======
  // Await cookie store to comply with Next.js 15 requirements
  const cookieStore = await cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
});

export type Database = any;
>>>>>>> b24e64e0cf6a0f7a4f44a2424d8e8f7959c01082
