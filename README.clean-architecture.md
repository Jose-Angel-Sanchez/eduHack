# Clean Architecture Transition

## Objetivo
Introducir una separación clara de capas (Domain, Application, Infrastructure, Interfaces) sin eliminar el código existente, permitiendo migración gradual.

## Nueva Estructura
```
src/
  domain/
    entities/
    repositories/
    errors/
  application/
    use-cases/
    dto/
  infrastructure/
    supabase/
  interfaces/
    api/
app/
  api/v2/ (nueva API que usa casos de uso)
```

## Capas
- Domain: Entidades puras y contratos. No depende de nada externo.
- Application: Casos de uso orquestan repositorios. Reglas de negocio combinadas.
- Infrastructure: Implementaciones concretas (Supabase, IA, etc.).
- Interfaces: Adaptadores externos (HTTP, UI, mappers) exponiendo casos de uso.

## Ejemplo Implementado
- Entidad `Course` y `Profile`.
- Repositorio `CourseRepository` (contrato) + implementación `SupabaseCourseRepository`.
- Casos de uso `CreateCourseUseCase`, `ListActiveCoursesUseCase`.
- Nueva ruta `GET/POST /api/v2/courses` usando la capa Application.

## Migración Incremental Sugerida
1. Identificar módulos críticos: auth, courses, learning paths, certificates.
2. Para cada módulo: crear entidad + repositorio contrato + casos de uso principales.
3. Crear implementaciones concrete en `infrastructure/` reutilizando lógica ya probada.
4. Exponer endpoints v2 paralelos y componentes que consuman la nueva API.
5. Gradualmente reemplazar imports directos de Supabase en componentes por hooks/servicios que llamen use cases.
6. Eliminar código legacy sólo cuando todo el consumo apunte a la nueva capa.

## Próximos Pasos
## Convenciones
## Autenticación (Nueva Capa)
Implementado:
- Entidad `UserSession`.
- Contratos `AuthRepository`, `ProfileRepository`.
- Implementaciones `SupabaseAuthRepository`, `SupabaseProfileRepository` con fallback de creación de perfil.
- Casos de uso: `SignInUseCase`, `SignUpUseCase`, `SignOutUseCase`, `GetSessionUseCase`.
- Endpoints v2: `POST /api/v2/auth/login`, `POST /api/v2/auth/register`, `GET /api/v2/auth/session`.

Estrategia de Migración UI:
1. Crear un adaptador/hook `useSession()` que consuma `GET /api/v2/auth/session`.
2. Reemplazar gradualmente lógica existente en componentes por el hook.
3. Mover `signIn`/`signUp` acciones server actuales para que deleguen al caso de uso (mantener compatibilidad mientras se actualizan formularios).
4. Consolidar errores y mensajes en una capa de traducción (adapter) evitando exposición de códigos internos.

Próximas Extensiones Auth:
- Caso de uso para refrescar sesión (si se habilita manual refresh en futuras versiones).
- Integrar roles más explícitos (admin, instructor, student) en entidad `UserSession`.
- Añadir auditoría (registro de eventos) como repositorio separado.

- Entidades usan `PascalCase` y encapsulan validaciones mínimas.
## Notas
Este documento guía una adopción progresiva; evita una refactorización masiva de un solo golpe que arriesgue estabilidad.
