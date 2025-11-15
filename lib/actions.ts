"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuth } from "@/lib/firebase/server";

/**
 * Crea una cookie de sesión con el token de Firebase
 */
export async function createSessionCookie(idToken: string) {
  try {
    const auth = await getAdminAuth();
    if (!auth) throw new Error("Firebase Admin no configurado");
    const expiresInMs = 1000 * 60 * 60 * 24 * 5; // 5 días
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: expiresInMs });
    const cookieStore = await cookies();
    cookieStore.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expiresInMs / 1000,
      path: "/",
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error creando cookie de sesión:", error);
    return { success: false, error: error.message || "Error al crear sesión" };
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/auth/login");
}
