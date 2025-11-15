# Migración de Supabase a Firebase

## Pasos para configurar Firebase

### 1. Configurar Firebase Admin SDK

Para usar Firebase en el servidor (server actions), necesitas configurar Firebase Admin SDK:

1. Ve a la [Consola de Firebase](https://console.firebase.google.com/)
2. Selecciona tu proyecto `digieduhack-b82cc`
3. Ve a **Configuración del proyecto** (ícono de engranaje) > **Cuentas de servicio**
4. Haz clic en **Generar nueva clave privada**
5. Se descargará un archivo JSON con las credenciales

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
FIREBASE_PROJECT_ID=digieduhack-b82cc
FIREBASE_CLIENT_EMAIL=tu-email-de-servicio@digieduhack-b82cc.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTu-clave-privada-aquí\n-----END PRIVATE KEY-----\n"
```

**Importante:** Copia la clave privada del archivo JSON descargado y reemplaza `\n` con saltos de línea reales o déjala como está con `\n`.

### 3. Configurar Firestore Database

1. En la Consola de Firebase, ve a **Firestore Database**
2. Haz clic en **Crear base de datos**
3. Selecciona **Modo de producción** o **Modo de prueba** (recomendado para desarrollo)
4. Elige la región más cercana

### 4. Configurar reglas de seguridad de Firestore

Ve a la pestaña **Reglas** en Firestore y configura las siguientes reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para usuarios
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Reglas para usernames (solo lectura para verificar disponibilidad)
    match /usernames/{username} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }

    // Reglas para cursos (ejemplo)
    match /courses/{courseId} {
      allow read: if true; // Público
      allow write: if request.auth != null &&
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

### 5. Habilitar Authentication

1. En la Consola de Firebase, ve a **Authentication**
2. Haz clic en **Comenzar**
3. Habilita el proveedor **Correo electrónico/contraseña**

### 6. Estructura de datos en Firestore

El sistema crea automáticamente las siguientes colecciones:

#### Colección `users`

```javascript
{
  uid: string,
  email: string,
  fullName: string,
  username: string,
  isAdmin: boolean,
  createdAt: Timestamp
}
```

#### Colección `usernames`

```javascript
{
  uid: string,
  createdAt: Timestamp
}
```

### 7. Archivos modificados

Los siguientes archivos han sido modificados para usar Firebase:

- `lib/firebase/config.ts` - Configuración de Firebase
- `lib/firebase/auth.ts` - Funciones de autenticación del cliente
- `lib/actions.ts` - Server actions con Firebase Admin
- `components/auth/login-form-firebase.tsx` - Formulario de login
- `components/auth/register-form-firebase.tsx` - Formulario de registro
- `components/providers/auth-provider-firebase.tsx` - Provider de autenticación
- `app/auth/login/page.tsx` - Página de login
- `app/auth/register/page.tsx` - Página de registro

### 8. Migrar datos de Supabase (opcional)

Si tienes datos en Supabase que deseas migrar:

1. Exporta los datos desde Supabase
2. Crea un script de migración para importar a Firestore
3. Usa Firebase Admin SDK para insertar los datos

### 9. Ejecutar el proyecto

```bash
npm run dev
```

El sistema de autenticación ahora usa Firebase en lugar de Supabase.

## Diferencias principales

### Autenticación

- **Supabase:** Usa `createServerActionClient` con cookies
- **Firebase:** Usa Firebase Admin SDK con custom tokens

### Base de datos

- **Supabase:** SQL (PostgreSQL)
- **Firebase:** NoSQL (Firestore)

### Ventajas de Firebase

- Escalabilidad automática
- Integración nativa con Google Cloud
- Analytics incorporado
- Realtime database
- No requiere migraciones de base de datos

## Notas importantes

1. **Seguridad:** Nunca expongas las credenciales de Firebase Admin en el cliente
2. **Variables de entorno:** Asegúrate de agregar `.env.local` a `.gitignore`
3. **Reglas de Firestore:** Ajusta las reglas según tus necesidades de seguridad
4. **Índices:** Firestore puede requerir índices compuestos para consultas complejas
