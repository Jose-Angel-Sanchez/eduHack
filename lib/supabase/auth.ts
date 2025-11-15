// Deprecated Supabase auth utilities after migration to Firebase.
export const withAuthRetry = async <T>(fn: () => Promise<T>): Promise<T> => fn();
export const getAuthUser = async () => ({ data: { user: null }, error: null });
export const getAuthSession = async () => ({ data: { session: null }, error: null });
export const getUserProfile = async () => ({ data: null, error: null });
export const getCurrentUserAndProfile = async () => ({ user: null, profile: null });
export const getDisplayName = () => "Usuario";
