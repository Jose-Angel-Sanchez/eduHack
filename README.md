# Ellucian Hack - Firebase Migration

## Arquitectura Actual
- Frontend: Next.js 15 / React 19 (App Router, Server + Client Components).
- Autenticación: Firebase Auth (email/password) + Session Cookie (`fbSession`) vía Admin SDK.
- Persistencia: Firestore (colecciones: `profiles`, `courses`, `enrollments`, `feedback`, `progress`).
- Reglas: Ver `firestore.rules` para acceso granular.
- Casos de Uso: Capa `application` desacoplada de repositorios (`infrastructure/firebase`).

## Flujo Auth
1. Cliente envía credenciales a `POST /api/v3/auth/login`.
2. Se crea session cookie Firebase administrada (24h) y se setea `fbSession` (httpOnly).
3. Validaciones posteriores leen ese cookie vía Admin SDK (endpoint `session`).

## Colecciones Firestore (Campos Clave)
- `profiles`: `{ email, fullName, username, createdAt, updatedAt }`
- `courses`: `{ title, description, difficulty_level, category, estimated_duration, createdAt }`
- `enrollments`: `{ userId, courseId, createdAt }`
- `feedback`: `{ userId, courseId, rating, feedbackType, createdAt }`
- `progress`: `{ userId, courseId, moduleId, percent, updatedAt }`

## Reglas Firestore (Resumen)
- Perfiles lectura pública, escritura sólo dueño.
- Cursos escritura sólo rol admin (añadir `role` custom claim en producción).
- Enrollments creación/lectura propia.
- Feedback lectura pública, escritura/actualización propia.
- Progress lectura/escritura propia.

## Migración de Datos
Script: `scripts/migrate-supabase-to-firestore.mjs`
1. Exportar tablas de Supabase a JSON (`courses.json`, `profiles.json`, etc.).
2. Ejecutar:
```bash
node scripts/migrate-supabase-to-firestore.mjs exports/ --dry-run
node scripts/migrate-supabase-to-firestore.mjs exports/
```
3. Requiere `GOOGLE_APPLICATION_CREDENTIALS` apuntando al Service Account.

## Pasos Restantes
- Eliminar componentes y utilidades que aún usan `createClient()` (debug, admin, gestión de contenido).
- Añadir índices Firestore sugeridos.
- Añadir Cloud Function para certificados y post-registro opcional.
- Limpiar stubs Supabase (`lib/supabase/*`).

## Índices Sugeridos
Crear en Firebase Console: 
- `enrollments`: composite `userId, courseId`.
- `feedback`: composite `courseId, userId`.
- `progress`: composite `userId, courseId`.

## Eliminación Supabase
Tras refactor completo:
1. Borrar carpeta `lib/supabase/`.
2. Quitar variables antiguas del entorno.
3. Confirmar cero referencias `createClient(` en grep.

## Troubleshooting
- Error sesión: verificar cookies secure y dominio en local (usar localhost sin https para pruebas, ajustar secure=false temporal si es necesario).
- Falta claim admin: establecer custom claim vía Admin SDK antes de crear cursos.

## Próximos Enhancements
- Analítica de progreso agregada.
- Generación de certificados en Cloud Function.
- IA (Gemini) ya integrada: asegurar tokens seguros y límites por usuario.

---
Migración completa hacia Firebase: continuar depuración de restos Supabase y validar reglas con el emulador antes de producción.
