"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

// Las funciones de signIn y signUp ahora se manejan en el cliente con Firebase Auth
// Ver: components/auth/login-form-firebase.tsx y register-form-firebase.tsx

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
    console.error("Error creando cookie de sesión:", error);
    return { success: false, error: "Error al crear sesión" };
  }
}

export async function signOut() {
  const cookieStore = await cookies();

  // Eliminar todas las cookies de sesión
  cookieStore.delete("session");

  redirect("/auth/login");
}
