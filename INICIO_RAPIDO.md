# 🚀 Inicio Rápido - Firebase Authentication

## ⚡ Configuración Mínima (2 minutos)

### 1. Habilitar Authentication en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `digieduhack-b82cc`
3. Ve a **Authentication** en el menú lateral
4. Clic en **Comenzar** (si es la primera vez)
5. En la pestaña **Sign-in method**:
   - Habilita **Correo electrónico/contraseña**
   - Guarda los cambios

### 2. Crear Firestore Database

1. En el mismo proyecto de Firebase Console
2. Ve a **Firestore Database** en el menú lateral
3. Clic en **Crear base de datos**
4. Selecciona **Iniciar en modo de prueba** (para desarrollo)
5. Elige la región más cercana (ej: `us-central`)
6. Clic en **Habilitar**

### 3. Configurar Reglas de Firestore (Opcional por ahora)

En la pestaña **Reglas** de Firestore, pega esto:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /usernames/{username} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Variables de Entorno (Opcional)

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Firebase Admin (OPCIONAL - no necesario para login/registro)
FIREBASE_PROJECT_ID=digieduhack-b82cc
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Si tienes Supabase configurado, elimina o comenta estas líneas:
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**Nota:** Las credenciales del cliente de Firebase ya están configuradas en `lib/firebase/config.ts`

### 5. Ejecutar el Proyecto

```bash
npm run dev
```

Abre [http://localhost:3000/auth/register](http://localhost:3000/auth/register)

## ✅ Probar el Sistema

1. **Registrarse**: Ve a `/auth/register` y crea una cuenta
2. **Iniciar Sesión**: Ve a `/auth/login` y entra con tus credenciales
3. **Verificar en Firebase**: Ve a Firebase Console > Authentication > Users

¡Deberías ver tu usuario creado!

## 📋 ¿Qué funciona ahora?

- ✅ Registro de usuarios
- ✅ Inicio de sesión
- ✅ Almacenamiento de perfiles en Firestore
- ✅ Verificación de username único
- ✅ Detección de admin (@alumno.buap.mx)
- ✅ Redirección automática después de login

## ⚠️ Nota

Algunas páginas (dashboard, cursos, etc.) todavía pueden usar Supabase. Si ves errores en esas páginas, es normal - necesitan ser migradas a Firebase.

## 🆘 Problemas Comunes

### "Firebase Admin not configured"

- **Solución**: Esto es normal. El login/registro funcionan sin Firebase Admin.
- Si quieres eliminarlo, ignora la advertencia en la consola.

### "Supabase errors"

- **Solución**: Elimina o comenta las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` de tu `.env.local`

### "Cannot find module firebase/app"

- **Solución**: Ejecuta `npm install firebase`

## 📚 Más Información

- Ver `FIREBASE_MIGRATION.md` para documentación completa
- Ver `MIGRACION_ESTADO.md` para el estado actual de la migración
