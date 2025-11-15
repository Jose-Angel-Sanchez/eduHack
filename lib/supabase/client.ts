// Supabase client deprecated - migrated to Firebase. Placeholder exports.
export const isSupabaseConfigured = false
export function createClient() {
  throw new Error('Supabase deprecated: use Firebase client in src/infrastructure/firebase')
}
export const supabaseClient = () => { throw new Error('Supabase deprecated') }
