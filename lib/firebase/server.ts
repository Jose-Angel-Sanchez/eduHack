import { cookies } from "next/headers";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App | null = null;
let adminAuth: Auth | null = null;

// Debug: Mostrar las variables de entorno (sin mostrar la clave completa)
console.log("\n🔍 Verificando variables de entorno Firebase Admin:");
console.log(
  "- FIREBASE_PROJECT_ID:",
  process.env.FIREBASE_PROJECT_ID ? "✅" : "❌"
);
console.log(
  "- FIREBASE_CLIENT_EMAIL:",
  process.env.FIREBASE_CLIENT_EMAIL ? "✅" : "❌"
);
console.log(
  "- FIREBASE_PRIVATE_KEY:",
  process.env.FIREBASE_PRIVATE_KEY ? "✅" : "❌"
);

// Verificar si Firebase Admin está configurado
const isAdminConfigured =
  typeof process.env.FIREBASE_PROJECT_ID === "string" &&
  process.env.FIREBASE_PROJECT_ID.length > 0 &&
  typeof process.env.FIREBASE_CLIENT_EMAIL === "string" &&
  process.env.FIREBASE_CLIENT_EMAIL.length > 0 &&
  typeof process.env.FIREBASE_PRIVATE_KEY === "string" &&
  process.env.FIREBASE_PRIVATE_KEY.length > 0;

// Inicializar Firebase Admin (solo en el servidor y si está configurado)
if (isAdminConfigured && getApps().length === 0) {
  try {
    console.log("🔧 Intentando inicializar Firebase Admin...");
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      }),
    });
    adminAuth = getAuth(adminApp);
    console.log("✅ Firebase Admin inicializado correctamente");
  } catch (error) {
    console.error("❌ Error inicializando Firebase Admin:", error);
  }
} else {
  if (!isAdminConfigured) {
    console.warn("⚠️ isAdminConfigured = false");
  }
  if (getApps().length > 0) {
    console.log("ℹ️ Firebase Admin ya estaba inicializado");
    adminAuth = getAuth();
  }
}

/**
 * Obtiene el usuario autenticado desde las cookies en el servidor
 * Nota: Requiere Firebase Admin SDK configurado
 */
export async function getCurrentUser() {
  // Si Firebase Admin no está configurado, retornar null
  if (!adminAuth) {
    console.warn(
      "⚠️ Firebase Admin no está configurado. El usuario no puede ser verificado en el servidor."
    );
    return null;
  }

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
      return null;
    }

    // Verificar el token
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie.value);
    const user = await adminAuth.getUser(decodedToken.uid);

    return user;
  } catch (error) {
    console.error("Error obteniendo usuario actual:", error);
    return null;
  }
}

/**
 * Verifica si Firebase Admin está configurado correctamente
 */
export function isFirebaseConfigured() {
  return isAdminConfigured;
}

export { adminAuth as auth };
