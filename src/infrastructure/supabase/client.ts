import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '../../../lib/supabase/database.types'

export async function getSupabase() {
  const store = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return store.getAll().map(c => ({ name: c.name, value: c.value })) },
        setAll(cookies) { cookies.forEach(({ name, value, options }) => store.set({ name, value, ...options })) },
      }
    }
  )
}
