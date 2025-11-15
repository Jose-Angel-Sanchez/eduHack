"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TestFirebasePage() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setIsSuccess(false);
    setStatus("🔍 Iniciando pruebas...\n\n");

    try {
      // Test 1: Verificar configuración
      setStatus((prev) => prev + "✅ Configuración de Firebase OK\n");
      setStatus(
        (prev) => prev + `📦 Project ID: ${db.app.options.projectId}\n`
      );
      setStatus(
        (prev) => prev + `🔑 Auth Domain: ${auth.app.options.authDomain}\n\n`
      );

      // Test 2: Probar lectura
      setStatus((prev) => prev + "🔍 Probando lectura de Firestore...\n");
      const testCollection = collection(db, "test");
      const snapshot = await getDocs(testCollection);
      setStatus(
        (prev) =>
          prev + `✅ Lectura OK (${snapshot.size} documentos encontrados)\n\n`
      );

      // Test 3: Probar escritura
      setStatus((prev) => prev + "🔍 Probando escritura en Firestore...\n");
      const docRef = await addDoc(collection(db, "test"), {
        timestamp: new Date(),
        test: true,
        message: "Test de conexión",
      });
      setStatus((prev) => prev + `✅ Escritura OK (ID: ${docRef.id})\n\n`);

      // Test 4: Limpiar
      setStatus((prev) => prev + "🧹 Limpiando documento de prueba...\n");
      await deleteDoc(doc(db, "test", docRef.id));
      setStatus((prev) => prev + "✅ Limpieza OK\n\n");

      setStatus((prev) => prev + "🎉 ¡TODAS LAS PRUEBAS PASARON!\n");
      setStatus(
        (prev) => prev + "✅ Firebase está funcionando correctamente\n"
      );
      setStatus((prev) => prev + "✅ Firestore está habilitado y accesible\n");
      setStatus(
        (prev) =>
          prev + "✅ Las reglas de seguridad permiten lectura/escritura\n\n"
      );
      setStatus(
        (prev) => prev + "👉 Puedes proceder con el registro de usuarios"
      );
      setIsSuccess(true);
    } catch (error: any) {
      console.error("❌ Error en pruebas:", error);
      setStatus((prev) => prev + `\n❌ ERROR DETECTADO\n`);
      setStatus((prev) => prev + `📝 Mensaje: ${error.message}\n`);
      setStatus(
        (prev) => prev + `📝 Código: ${error.code || "desconocido"}\n\n`
      );

      if (error.code === "permission-denied") {
        setStatus(
          (prev) =>
            prev +
            "⚠️ PROBLEMA: Las reglas de Firestore están bloqueando el acceso\n\n"
        );
        setStatus((prev) => prev + "🔧 SOLUCIÓN:\n");
        setStatus(
          (prev) =>
            prev +
            "1. Ve a Firebase Console: https://console.firebase.google.com/\n"
        );
        setStatus(
          (prev) => prev + "2. Selecciona tu proyecto: digieduhack-b82cc\n"
        );
        setStatus((prev) => prev + "3. Ve a Firestore Database > Reglas\n");
        setStatus((prev) => prev + "4. Pega estas reglas:\n\n");
        setStatus((prev) => prev + "rules_version = '2';\n");
        setStatus((prev) => prev + "service cloud.firestore {\n");
        setStatus(
          (prev) => prev + "  match /databases/{database}/documents {\n"
        );
        setStatus((prev) => prev + "    match /{document=**} {\n");
        setStatus((prev) => prev + "      allow read, write: if true;\n");
        setStatus((prev) => prev + "    }\n");
        setStatus((prev) => prev + "  }\n");
        setStatus((prev) => prev + "}\n\n");
        setStatus((prev) => prev + "5. Haz clic en 'Publicar'\n");
      } else if (error.code === "unavailable") {
        setStatus(
          (prev) => prev + "⚠️ PROBLEMA: No se puede conectar con Firestore\n\n"
        );
        setStatus((prev) => prev + "🔧 SOLUCIÓN:\n");
        setStatus(
          (prev) =>
            prev +
            "1. Ve a Firebase Console: https://console.firebase.google.com/\n"
        );
        setStatus(
          (prev) => prev + "2. Selecciona tu proyecto: digieduhack-b82cc\n"
        );
        setStatus((prev) => prev + "3. Ve a Firestore Database\n");
        setStatus(
          (prev) =>
            prev + "4. Si no está creado, haz clic en 'Crear base de datos'\n"
        );
        setStatus(
          (prev) => prev + "5. Selecciona 'Iniciar en modo de prueba'\n"
        );
        setStatus((prev) => prev + "6. Elige una región (ej: us-central)\n");
        setStatus((prev) => prev + "7. Haz clic en 'Habilitar'\n");
        setStatus((prev) => prev + "8. Espera 1-2 minutos y vuelve a probar\n");
      } else if (error.message?.includes("offline")) {
        setStatus((prev) => prev + "⚠️ PROBLEMA: Cliente offline\n\n");
        setStatus((prev) => prev + "🔧 POSIBLES CAUSAS:\n");
        setStatus(
          (prev) =>
            prev + "1. Firestore no está habilitado en Firebase Console\n"
        );
        setStatus(
          (prev) => prev + "2. Firewall o antivirus bloqueando la conexión\n"
        );
        setStatus((prev) => prev + "3. Problema de red temporal\n\n");
        setStatus(
          (prev) =>
            prev + "Intenta reiniciar el servidor (Ctrl+C y npm run dev)\n"
        );
      } else {
        setStatus((prev) => prev + "⚠️ Error desconocido. Verifica:\n");
        setStatus((prev) => prev + "1. Que Firestore esté habilitado\n");
        setStatus((prev) => prev + "2. Que las reglas permitan acceso\n");
        setStatus((prev) => prev + "3. Tu conexión a internet\n");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">🔍 Diagnóstico de Firebase</CardTitle>
          <CardDescription>
            Prueba la conexión con Firebase y Firestore para detectar problemas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={testConnection}
            disabled={loading}
            className="w-full"
          >
            {loading
              ? "⏳ Ejecutando pruebas..."
              : "🚀 Ejecutar Diagnóstico Completo"}
          </Button>

          {status && (
            <div
              className={`p-4 rounded-lg border ${
                isSuccess
                  ? "bg-green-50 border-green-500"
                  : "bg-blue-50 border-blue-500"
              }`}
            >
              <div className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                {status}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">ℹ️ Información</h3>
            <p className="text-sm text-gray-600">Esta herramienta verifica:</p>
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              <div>• Configuración de Firebase</div>
              <div>• Conexión con Firestore</div>
              <div>• Permisos de lectura</div>
              <div>• Permisos de escritura</div>
              <div>• Estado de las reglas de seguridad</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
