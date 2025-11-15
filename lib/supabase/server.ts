// Deprecated Supabase server client placeholder after migration to Firebase.
export const isSupabaseConfigured = false;

// Minimal placeholder that mimics the subset of Supabase API shape used in legacy code.
export const createClient = async () => {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null })
    },
    from: () => ({
      select: () => ({ data: null, error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      eq: () => ({ data: null, error: null }),
      single: () => ({ data: null, error: null })
    })
  } as any;
};

export type Database = any;
