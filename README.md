# Marketing Hub

SaaS base para gestionar marketing de pequeños negocios: restaurantes, cafés, barberías, locales de ropa y otros negocios locales.

## Estado actual

El repositorio tiene dos capas:

1. **Frontend MVP** en `index.html`: dashboard, publicidad, contenido, CRM, reseñas, promociones, analytics, tareas, reportes, configuración y responsive UI.
2. **Backend foundation** en Node.js + Express + PostgreSQL: autenticación real, sesiones persistidas, usuarios, empresas/workspaces y aislamiento por `business_id`.

El frontend visual todavía conserva datos demo en `localStorage`. La migración de cada módulo del frontend hacia la API/PostgreSQL se hará de forma progresiva, sin romper el MVP visual.

## Backend

Endpoints base:

- `GET /health` — health check de aplicación + PostgreSQL.
- `GET /api/auth/csrf` — obtiene token CSRF para requests mutantes.
- `POST /api/auth/register` — crea usuario + empresa + membership owner.
- `POST /api/auth/login` — inicia sesión con cookie HttpOnly persistida en PostgreSQL.
- `POST /api/auth/logout` — cierra la sesión.
- `GET /api/auth/me` — usuario y workspace actual.
- `GET /api/workspace` — workspace actual.
- `PATCH /api/workspace` — actualiza datos básicos del negocio.

Seguridad base incluida:

- Contraseñas con bcrypt.
- Sesiones almacenadas en PostgreSQL.
- Cookies HttpOnly + SameSite y Secure en producción.
- Helmet.
- Rate limiting para autenticación.
- CSRF para requests mutantes.
- Límites de tamaño de body.
- Secretos únicamente mediante variables de entorno.
- Consultas de workspace limitadas por membership del usuario.

## Desarrollo local

Requisitos: Node.js 20+ y Docker.

```bash
docker compose up --build
```

Luego abrir:

```text
http://localhost:3000
```

El entorno Docker crea PostgreSQL y ejecuta la aplicación. `SEED_DEMO=true` genera el usuario demo para pruebas locales.

También podés ejecutar la app sin Docker si tenés PostgreSQL disponible:

```bash
npm install
npm start
```

Usá `.env.example` como base para configurar las variables.

## Producción

Antes de lanzar a clientes reales hay que configurar:

- PostgreSQL administrado.
- `SESSION_SECRET` largo y aleatorio.
- `NODE_ENV=production`.
- `SEED_DEMO=false`.
- HTTPS y dominio.
- Secret manager del proveedor de hosting.
- Backup y observabilidad de PostgreSQL.

El `Dockerfile` deja preparado el servicio para un hosting compatible con Node/Docker.

## Integraciones reales

Todavía no se deben considerar conectadas Meta/Instagram, Google Business, WhatsApp, OpenAI ni billing. Esas integraciones requieren OAuth, credenciales, webhooks, permisos y pruebas con cuentas reales.

Los tokens de proveedores deben permanecer siempre en backend/secret manager y nunca en el JavaScript del navegador.

## Roadmap inmediato

### Fase 1 — Base SaaS

- [x] Backend Express
- [x] PostgreSQL
- [x] Usuarios
- [x] Empresas/workspaces
- [x] Memberships
- [x] Autenticación real
- [x] Sesiones persistidas
- [x] Seguridad base
- [x] Docker local
- [x] CI de sintaxis
- [ ] Conectar login del frontend a `/api/auth/*`
- [ ] Reemplazar `localStorage` de campañas/clientes/contenido/reseñas/promociones

### Fase 2 — Datos reales

- [ ] Google Business Profile
- [ ] Meta / Instagram / Facebook
- [ ] Meta Ads
- [ ] Dashboard con datos reales

### Fase 3 — Inteligencia

- [ ] OpenAI vía backend
- [ ] Recomendaciones basadas en métricas reales
- [ ] Generador de contenido contextual
- [ ] Reportes mensuales automáticos

### Fase 4 — Omnicanal y negocio

- [ ] Google Ads
- [ ] WhatsApp Business
- [ ] POS / Shopify / WooCommerce
- [ ] Atribución de ventas
- [ ] Billing y planes

## Arquitectura objetivo

```text
                  MARKETING HUB
                        |
                    Frontend
                        |
                  Backend / API
                        |
          +-------------+-------------+
          |             |             |
      PostgreSQL    Integrations      AI
          |             |             |
      Businesses     Google/Meta   OpenAI
      Users          WhatsApp
      CRM            POS/E-commerce
      Campaigns
```

## Repositorio

`ignamaher-ops/marketing-hub`
