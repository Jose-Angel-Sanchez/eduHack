import { cookies } from "next/headers";

// Lazy dynamic import of firebase-admin only when needed (no top-level await)
type App = any;
type Auth = any;
let initializeApp: any, getApps: any, cert: any, getAuth: any;
let adminApp: App | null = null;
let adminAuth: Auth | null = null;

const isAdminConfigured =
  !!process.env.FIREBASE_PROJECT_ID &&
  !!process.env.FIREBASE_CLIENT_EMAIL &&
  !!process.env.FIREBASE_PRIVATE_KEY;

async function loadAdmin() {
  if (!isAdminConfigured) return;
  if (adminAuth) return; // already initialized
  try {
    if (!initializeApp) {
      const appMod = await import("firebase-admin/app");
      initializeApp = appMod.initializeApp;
      getApps = appMod.getApps;
      cert = appMod.cert;
      const authMod = await import("firebase-admin/auth");
      getAuth = authMod.getAuth;
    }
    if (getApps && getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        }),
      });
      adminAuth = getAuth(adminApp);
    } else if (getAuth) {
      adminAuth = getAuth();
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("Firebase Admin init failed:", e);
    }
  }
}

/**
 * Obtiene el usuario autenticado desde las cookies en el servidor
 * Nota: Requiere Firebase Admin SDK configurado
 */
export async function getCurrentUser() {
  if (!adminAuth) await loadAdmin();
  if (!adminAuth) return null;
  try {
    // Print raw cookie header for debugging
    if (process.env.NODE_ENV === "development") {
      const rawHeader = (typeof globalThis?.process !== "undefined" && globalThis?.process?.env?.NEXT_RUNTIME === "node")
        ? (globalThis?.process?.env?.COOKIE_HEADER || "(no COOKIE_HEADER env)")
        : "(not node runtime)";
      console.log("[DEBUG] Raw cookie header:", rawHeader);
    }
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (process.env.NODE_ENV === "development") {
      console.log("[DEBUG] Parsed session cookie:", sessionCookie);
    }
    if (!sessionCookie?.value) return null;
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie.value);
    return await adminAuth.getUser(decodedToken.uid);
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("getCurrentUser failed (expected if no valid session)");
      console.warn("[DEBUG] Error:", e);
    }
    return null;
  }
}

/**
 * Verifica si Firebase Admin está configurado correctamente
 */
export function isFirebaseConfigured() {
  return isAdminConfigured;
}

export async function getAdminAuth(): Promise<Auth | null> {
  if (!adminAuth) await loadAdmin();
  return adminAuth;
}
