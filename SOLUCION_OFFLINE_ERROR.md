# ⚠️ Solución: FirebaseError "Failed to get document because the client is offline"

## 🔍 Causa del Problema

Este error ocurre cuando:

1. **Firestore Database no está creada** en Firebase Console
2. **La red está bloqueada** o hay problemas de conectividad
3. **Las reglas de Firestore** están bloqueando el acceso

## ✅ Solución Paso a Paso

### 1. Verificar que Firestore esté creado

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `digieduhack-b82cc`
3. En el menú lateral, busca **Firestore Database**
4. Si ves "Comenzar" o "Create database":
   - Haz clic en **Crear base de datos**
   - Selecciona **Iniciar en modo de prueba** (importante!)
   - Elige la región (ej: `us-central1`)
   - Haz clic en **Habilitar**
5. Espera 1-2 minutos a que se active

### 2. Configurar Reglas de Firestore (Modo de Prueba)

En Firestore Database, ve a la pestaña **Reglas** y pega esto:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // MODO DE PRUEBA - Permite todo (solo para desarrollo)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Importante**: Estas reglas son solo para desarrollo. Para producción, usa:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /usernames/{username} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

Haz clic en **Publicar** para guardar las reglas.

### 3. Verificar la Conexión de Red

Abre la consola del navegador (F12) y verifica:

1. **Red**: Ve a la pestaña "Network" y asegúrate de que no esté en modo offline
2. **Consola**: Busca errores relacionados con CORS o bloqueos de red
3. **Application/Storage**: Verifica que IndexedDB esté disponible

### 4. Limpiar Caché y Reintentar

En el navegador:

1. Abre DevTools (F12)
2. Haz clic derecho en el botón de recargar
3. Selecciona "Vaciar caché y volver a cargar de manera forzada"

O simplemente:

```bash
# Reinicia el servidor de desarrollo
Ctrl+C
npm run dev
```

### 5. Verificar Estado en Firebase Console

En Firestore Database deberías ver:

- ✅ Estado: "Activo" o "Active"
- ✅ Región configurada
- ✅ Puede crear colecciones de prueba

### 6. Probar Manualmente

En Firebase Console > Firestore Database:

1. Crea una colección de prueba llamada "test"
2. Agrega un documento con ID "test1"
3. Agrega un campo: `name: "test"`
4. Si funciona, Firestore está configurado correctamente

## 🧪 Probar la Conexión

Abre la consola del navegador (F12) en tu app y ejecuta:

```javascript
import { db } from "@/lib/firebase/config";
import { collection, getDocs } from "firebase/firestore";

// Intentar leer colecciones
getDocs(collection(db, "users"))
  .then((snap) =>
    console.log("✅ Firestore conectado:", snap.size, "documentos")
  )
  .catch((err) => console.error("❌ Error:", err));
```

## 🔧 Cambios Realizados en el Código

He actualizado:

1. **`lib/firebase/config.ts`**:

   - Configuración mejorada de caché
   - Manejo de errores de inicialización

2. **Formularios de autenticación**:
   - Mensajes de error más descriptivos
   - Detección específica de problemas de conexión

## 📋 Checklist Rápido

- [ ] Firestore Database creado en Firebase Console
- [ ] Reglas de Firestore configuradas (modo prueba o personalizadas)
- [ ] Authentication Email/Password habilitado
- [ ] Servidor de desarrollo reiniciado
- [ ] Caché del navegador limpiado
- [ ] Red no bloqueada (verifica firewall/antivirus)

## 🆘 Si el Error Persiste

1. **Verifica las reglas de Firestore** - Asegúrate de que permitan escritura
2. **Revisa la consola de Firebase** - Busca errores en el proyecto
3. **Intenta desde otro navegador** - Puede ser un problema de caché local
4. **Verifica tu conexión** - Intenta acceder a otros servicios de Google

## ✨ Una Vez Funcionando

Deberías poder:

- ✅ Registrar nuevos usuarios
- ✅ Ver usuarios en Firebase Console > Authentication
- ✅ Ver documentos en Firebase Console > Firestore Database
- ✅ Iniciar sesión sin errores

El error más común es simplemente **no haber creado la base de datos Firestore**. ¡Asegúrate de completar el paso 1!
