"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/firebase/auth";
import { createSessionCookie } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db, auth } from "@/lib/firebase/config";
import { collection, getDocs, limit, query } from "firebase/firestore";

export function RegisterFormFirebase() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const router = useRouter();

  // Función para probar la conexión con Firestore
  const testFirestoreConnection = async () => {
    setTesting(true);
    setError("");

    try {
      console.log("🔍 Probando conexión con Firestore...");

      // Intentar leer la colección de usuarios
      const usersRef = collection(db, "users");
      const q = query(usersRef, limit(1));
      const snapshot = await getDocs(q);

      console.log("✅ Conexión exitosa con Firestore");
      console.log("📊 Documentos encontrados:", snapshot.size);

      setError(
        "✅ Conexión exitosa con Firestore! Puedes continuar con el registro."
      );
    } catch (err: any) {
      console.error("❌ Error de conexión:", err);

      if (err.code === "unavailable") {
        setError(
          "❌ No se puede conectar con Firestore. Posibles causas:\n" +
            "1. Firestore no está habilitado en Firebase Console\n" +
            "2. Las reglas de seguridad bloquean el acceso\n" +
            "3. Problema de red o firewall"
        );
      } else if (err.code === "permission-denied") {
        setError(
          "❌ Acceso denegado. Las reglas de Firestore están bloqueando el acceso.\n" +
            "Ve a Firebase Console > Firestore > Reglas y verifica que permita lectura/escritura."
        );
      } else {
        setError(
          `❌ Error: ${err.message}\nCódigo: ${err.code || "desconocido"}`
        );
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("📝 Iniciando registro...");
      const result = await registerUser(email, password, fullName, username);

      // Obtener el token del usuario recién creado
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken();
        await createSessionCookie(idToken);
      }

      console.log("✅ Registro exitoso");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Error inesperado:", err);

      // Manejar errores específicos
      if (err.message?.includes("username")) {
        setError(err.message);
      } else if (
        err.code === "unavailable" ||
        err.message?.includes("offline")
      ) {
        setError(
          "❌ No se puede conectar con Firebase. Ve a http://localhost:3000/test-firebase para diagnosticar el problema."
        );
      } else if (err.code === "permission-denied") {
        setError(
          "❌ Acceso denegado a Firestore. Verifica las reglas de seguridad en Firebase Console."
        );
      } else if (err.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado. Intenta iniciar sesión.");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError(
          err.message ||
            "Error al registrar usuario. Verifica tu conexión y que Firestore esté habilitado."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Crear Cuenta</CardTitle>
        <CardDescription>
          Regístrate para comenzar tu aprendizaje
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div
              className={`p-4 rounded-lg border ${
                error.startsWith("✅")
                  ? "bg-green-50 border-green-500 text-green-800"
                  : "bg-red-50 border-red-500 text-red-800"
              }`}
            >
              <div className="whitespace-pre-line text-sm">{error}</div>
            </div>
          )}

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={testFirestoreConnection}
              disabled={testing}
            >
              {testing
                ? "Probando conexión..."
                : "🔍 Probar Conexión con Firestore"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre Completo</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Juan Pérez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nombre de Usuario</Label>
            <Input
              id="username"
              type="text"
              placeholder="juanperez"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registrando..." : "Registrarse"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            ¿Ya tienes cuenta?{" "}
            <a href="/auth/login" className="text-primary hover:underline">
              Inicia sesión
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default RegisterFormFirebase;
