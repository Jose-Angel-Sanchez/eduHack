# 🔑 Cómo Configurar Firebase Admin (OPCIONAL)

## ⚠️ IMPORTANTE

**Firebase Admin NO es necesario para que funcione el login y registro.**
Solo se necesita si quieres verificar usuarios en el servidor.

## ¿Cuándo necesitas Firebase Admin?

- ✅ **NO lo necesitas** para: Login, Registro, Autenticación del cliente
- ⚠️ **Sí lo necesitas** para: Verificar usuarios en páginas de servidor, operaciones admin

## 📋 Pasos para Obtener las Credenciales

### 1. Accede a Firebase Console

Ve a: https://console.firebase.google.com/project/digieduhack-b82cc/settings/serviceaccounts/adminsdk

O manualmente:

1. Abre https://console.firebase.google.com/
2. Selecciona tu proyecto: `digieduhack-b82cc`
3. Haz clic en el ícono de engranaje ⚙️ (arriba izquierda)
4. Selecciona "Configuración del proyecto"
5. Ve a la pestaña "Cuentas de servicio"

### 2. Genera una Clave Privada

1. En la página de Cuentas de servicio
2. Asegúrate de estar en "Firebase Admin SDK"
3. Haz clic en el botón **"Generar nueva clave privada"**
4. Confirma haciendo clic en **"Generar clave"**
5. Se descargará un archivo JSON (ej: `digieduhack-b82cc-firebase-adminsdk-xxxxx.json`)

### 3. Extrae las Credenciales del Archivo JSON

Abre el archivo JSON descargado. Verás algo como:

```json
{
  "type": "service_account",
  "project_id": "digieduhack-b82cc",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBAD...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@digieduhack-b82cc.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

### 4. Crea el Archivo .env.local

En la raíz de tu proyecto, crea un archivo llamado `.env.local`:

```env
FIREBASE_PROJECT_ID=digieduhack-b82cc
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@digieduhack-b82cc.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...(copia todo)...-----END PRIVATE KEY-----\n"
```

**IMPORTANTE sobre la clave privada:**

- Debe estar entre comillas dobles `"..."`
- Debe incluir `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`
- Los `\n` deben mantenerse (representan saltos de línea)
- Copia toda la clave tal cual está en el JSON

### 5. Verifica que Funcione

Reinicia tu servidor de desarrollo:

```bash
# Detén el servidor (Ctrl+C)
npm run dev
```

Ahora no deberías ver el mensaje "Firebase Admin no está configurado".

## 🔒 Seguridad

1. **NUNCA subas `.env.local` a Git**

   - Ya está en `.gitignore` por defecto
   - Contiene credenciales sensibles

2. **No compartas la clave privada**

   - Es como una contraseña de administrador
   - Con ella se puede acceder completamente a tu proyecto

3. **Para producción**
   - Usa variables de entorno en tu plataforma de hosting
   - Vercel, Netlify, etc. tienen secciones para esto

## ✅ Verificación Rápida

Si configuraste correctamente, al iniciar el servidor verás:

```
✅ Firebase Admin inicializado correctamente
```

Si no está configurado, verás:

```
⚠️ Firebase Admin no está configurado
```

**Pero recuerda:** Incluso sin Firebase Admin, el login y registro funcionan perfectamente.

## 📝 Ejemplo Completo de .env.local

```env
# Firebase Admin (opcional)
FIREBASE_PROJECT_ID=digieduhack-b82cc
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@digieduhack-b82cc.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...toda tu clave aquí...
...puede ocupar varias líneas...
-----END PRIVATE KEY-----
"

# Otras configuraciones
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Comenta o elimina variables de Supabase
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 🆘 Problemas Comunes

### "Invalid service account"

- Verifica que copiaste la clave completa
- Asegúrate de que las comillas estén bien puestas
- Revisa que no haya espacios extras

### "Firebase Admin no inicializa"

- Verifica que el `project_id` sea correcto
- Asegúrate de que el email sea el correcto
- Reinicia el servidor después de crear `.env.local`

### "El login funciona pero el servidor da error"

- Esto es normal si no configuraste Firebase Admin
- El login funciona 100% sin Admin
- Admin solo se necesita para verificación de servidor
