# Dashboard Logística — Progreso Frontend + Fix CORS

> Continuación desde el MD de planificación del frontend (pasos 1–15).
> Esta sesión cubre la ejecución completa y los fixes necesarios para dejar el login funcionando.

---

## Lo que se hizo

### 1. Creación del proyecto Angular 21

```bash
# Desde dashboard-logistica/
ng new frontend --routing --style=scss --standalone --skip-git --ssr=false
```

Angular 21 genera una estructura diferente a versiones anteriores:
- El componente raíz se llama `app.ts` (no `app.component.ts`)
- Usa **Material 3** con `mat.theme()` en lugar de `mat.define-light-theme()`
- El builder es Vite (`@angular/build:application`)
- **No incluye `zone.js` por defecto** — hay que agregarlo manualmente

---

### 2. Dependencias instaladas

```bash
ng add @angular/material   # Material 3 (tema, typography, animations)
npm install ng2-charts chart.js
npm install zone.js         # Necesario — Angular 21 no lo incluye por defecto
npm install @angular/animations
```

**Nota importante:** `@angular/animations` tampoco venía incluido y era requerido por `provideAnimationsAsync()`.

---

### 3. Estructura de carpetas creada

```
src/app/
├── core/
│   ├── guards/          → auth.guard.ts
│   ├── interceptors/    → auth.interceptor.ts
│   ├── services/        → auth.service.ts
│   ├── validators/      (.gitkeep)
│   └── models/          (.gitkeep)
├── shared/
│   ├── components/      (.gitkeep)
│   ├── validators/      (.gitkeep)
│   ├── directives/      (.gitkeep)
│   ├── pipes/           (.gitkeep)
│   └── models/          (.gitkeep)
├── features/
│   ├── auth/
│   │   ├── login/       → login.component.ts
│   │   └── auth.routes.ts
│   ├── dashboard/       → dashboard.component.ts, dashboard.routes.ts
│   ├── products/        → products.component.ts, products.routes.ts
│   ├── orders/          → orders.component.ts, orders.routes.ts
│   └── users/           → users.component.ts, users.routes.ts
└── layout/
    ├── sidebar/         → sidebar.component.ts
    ├── navbar/          → navbar.component.ts
    └── main-layout/     → main-layout.component.ts
```

---

### 4. Archivos creados/modificados

| Archivo | Descripción |
|---------|-------------|
| `src/styles.scss` | Tema Material 3 con variables CSS para sidebar/navbar |
| `src/main.ts` | Bootstrap de la app |
| `src/app/app.ts` | Componente raíz simplificado a `<router-outlet />` |
| `src/app/app.config.ts` | Providers: router, HttpClient con interceptor, animaciones |
| `src/app/app.routes.ts` | Rutas lazy-loaded con authGuard en layout principal |
| `src/app/layout/main-layout/` | Shell: sidebar + navbar + router-outlet |
| `src/app/layout/sidebar/` | Sidebar oscura con navegación y RouterLinkActive |
| `src/app/layout/navbar/` | Navbar blanca con menú de usuario |
| `src/app/core/services/auth.service.ts` | JWT con Angular signals, localStorage |
| `src/app/core/interceptors/auth.interceptor.ts` | Inyecta Bearer token en cada request |
| `src/app/core/guards/auth.guard.ts` | Redirige a /auth/login si no hay token |
| `src/app/features/auth/login/` | Formulario reactivo Material con toggle de password |
| `src/app/features/dashboard/` | Placeholder |
| `src/app/features/products/` | Placeholder |
| `src/app/features/orders/` | Placeholder |
| `src/app/features/users/` | Placeholder |

---

### 5. Fixes aplicados durante la ejecución

#### Fix 1 — Tema SCSS incompatible con Material 3
**Problema:** El plan original usaba `mat.define-palette()` y `mat.define-light-theme()` que son API de Material 2. Angular Material 21 usa Material 3 con una API diferente.

**Fix:** Reemplazar por `mat.theme()` con paletas predefinidas de M3:
```scss
// ❌ Material 2 (no funciona en Angular 21)
$primary: mat.define-palette(mat.$indigo-palette, 700);
$theme: mat.define-light-theme((...));
@include mat.all-component-themes($theme);

// ✅ Material 3
@include mat.theme((
  color: (primary: mat.$azure-palette, tertiary: mat.$blue-palette),
  typography: Roboto,
  density: 0,
));
```

#### Fix 2 — `this.TOKEN_KEY` no disponible en inicialización de campo
**Problema:** Los campos `_token` y `_user` del `AuthService` se inicializaban usando `this.TOKEN_KEY`, pero en JavaScript los campos de clase se evalúan en orden y `this.TOKEN_KEY` aún no existe en ese momento.

**Fix:** Usar strings literales directamente:
```typescript
// ❌ Falla silenciosamente
private _token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));

// ✅ Correcto
private _token = signal<string | null>(localStorage.getItem('auth_token'));
```

#### Fix 3 — Zone.js no incluido en Angular 21
**Problema:** `ng new` en Angular 21 no agrega `zone.js` por defecto. El browser mostraba pantalla en blanco con el error:
```
NG0908: In this configuration Angular requires Zone.js
```

**Fix:** Instalar `zone.js` y declararlo como polyfill en `angular.json` (no con import en `main.ts`, que Vite no puede resolver):
```bash
npm install zone.js
```
```json
// angular.json → projects.frontend.architect.build.options
"polyfills": ["zone.js"]
```

#### Fix 4 — CORS bloqueaba el login desde el frontend
**Problema:** El browser hace un preflight `OPTIONS` antes del `POST /auth/login`. El backend Go con chi no tenía middleware CORS, respondía `405 Method Not Allowed` al OPTIONS y el browser bloqueaba el request.

**Fix:** Agregar `github.com/go-chi/cors` al backend:
```bash
# Desde backend/
go get github.com/go-chi/cors
```
```go
// main.go
import "github.com/go-chi/cors"

r.Use(cors.Handler(cors.Options{
    AllowedOrigins: []string{"http://localhost:4200"},
    AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
    AllowedHeaders: []string{"Authorization", "Content-Type"},
    MaxAge:         300,
}))
```

---

### 6. Aclaración sobre encriptación de contraseñas

El flujo de autenticación es correcto tal como está:

1. Frontend envía `{ email, password }` en texto plano por HTTP
2. Backend recibe la contraseña y ejecuta `bcrypt.CompareHashAndPassword(hash_db, password_plano)`
3. bcrypt verifica internamente contra el hash almacenado

**No se debe hashear en el cliente.** Hacerlo no agrega seguridad y rompería la comparación bcrypt. En producción, HTTPS protege el tránsito.

---

### 7. Credenciales de prueba

Según el seed (`database/seed.sql`), todos los usuarios tienen la misma contraseña:

| Email | Password | Rol |
|-------|----------|-----|
| `admin@dashboard.com` | `password` | admin |
| `carlos@dashboard.com` | `password` | repartidor |
| `maria@dashboard.com` | `password` | repartidor |
| `lucas@dashboard.com` | `password` | admin |

---

## Estado actual

| Componente | Estado |
|------------|--------|
| PostgreSQL | Corriendo (inicio manual con `pg_ctl`) |
| Backend Go | Corriendo en `http://localhost:8080` |
| Frontend Angular | Corriendo en `http://localhost:4200` |
| Login | Funcionando — redirige a `/dashboard` |
| Layout (sidebar + navbar) | Funcionando |
| Dashboard / Products / Orders / Users | Placeholders — pendiente implementar |

---

## Próximos pasos

- Implementar el dashboard con KPIs y gráficos (Chart.js / ng2-charts)
- CRUD completo de Productos con tabla Material + paginación
- CRUD completo de Órdenes con filtros por estado
- Gestión de Usuarios (solo admin)
- Conectar navbar con el usuario logueado (nombre, rol, logout real)
