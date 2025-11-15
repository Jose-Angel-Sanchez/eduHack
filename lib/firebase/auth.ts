"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./config";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  username: string;
  isAdmin: boolean;
  createdAt: Date;
}

// Registrar nuevo usuario
export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  username: string
) {
  try {
    // Verificar si el username ya existe
    const usernameDoc = await getDoc(doc(db, "usernames", username));
    if (usernameDoc.exists()) {
      throw new Error("Este nombre de usuario ya está en uso");
    }

    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Actualizar perfil con el nombre
    await updateProfile(user, {
      displayName: fullName,
    });

    // Determinar si es admin basado en el email
    const isAdmin = email.includes("@alumno.buap.mx");

    // Crear documento de perfil en Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      fullName,
      username,
      isAdmin,
      createdAt: new Date(),
    };

    await setDoc(doc(db, "users", user.uid), userProfile);

    // Reservar el username
    await setDoc(doc(db, "usernames", username), {
      uid: user.uid,
      createdAt: new Date(),
    });

    return { success: true, user };
  } catch (error: any) {
    console.error("Error registrando usuario:", error);
    throw error;
  }
}

// Iniciar sesión
export async function loginUser(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Obtener perfil del usuario
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data() as UserProfile;

    return {
      success: true,
      user,
      isAdmin: userData?.isAdmin || email.includes("@alumno.buap.mx"),
    };
  } catch (error: any) {
    console.error("Error iniciando sesión:", error);
    throw error;
  }
}

// Cerrar sesión
export async function logoutUser() {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error("Error cerrando sesión:", error);
    throw error;
  }
}

// Obtener perfil de usuario
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    return null;
  }
}

// Escuchar cambios de autenticación
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
