"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { createSessionCookie } from "@/lib/actions";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // Iniciar sesión con Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Obtener el token de ID
      const idToken = await user.getIdToken();

      // Crear cookie de sesión en el servidor
      await createSessionCookie(idToken);

      // Obtener perfil del usuario
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      const isAdmin = userData?.isAdmin || email.includes("@alumno.buap.mx");

      // Redirigir según el tipo de usuario
      const destination = isAdmin ? "/manage" : "/dashboard";
      router.push(destination);
      router.refresh();
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);

      // Manejar errores específicos de Firestore
      if (error.code === "unavailable" || error.message?.includes("offline")) {
        setError(
          "No se puede conectar con Firebase. Verifica tu conexión a internet."
        );
      } else if (error.message?.includes("Failed to get document")) {
        setError(
          "Error de conexión con Firestore. Asegúrate de que la base de datos esté habilitada."
        );
      } else if (error.code === "auth/user-not-found") {
        setError("Usuario no encontrado");
      } else if (error.code === "auth/wrong-password") {
        setError("Contraseña incorrecta");
      } else if (error.code === "auth/invalid-email") {
        setError("Correo electrónico inválido");
      } else if (error.code === "auth/invalid-credential") {
        setError("Credenciales inválidas");
      } else {
        setError(
          `Ocurrió un error: ${error.message || "Por favor intenta de nuevo."}`
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-2 text-center pb-6">
        <CardTitle className="text-3xl font-bold text-gray-900">
          Iniciar Sesión
        </CardTitle>
        <CardDescription className="text-gray-600 text-lg">
          Accede a tu plataforma de aprendizaje personalizada
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@ejemplo.com"
                  required
                  disabled={loading}
                  className="pl-10 h-12 border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  className="pl-10 pr-10 h-12 border-gray-300 focus:border-primary focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3 text-lg font-medium rounded-lg h-12"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{" "}
              <Link
                href="/auth/register"
                className="text-primary hover:text-primary-hover font-medium"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
