# Marketing Hub

SaaS base para gestionar marketing de pequeños negocios. Esta versión reemplaza el login demo y el `localStorage` del prototipo por autenticación real, sesiones persistidas y PostgreSQL multi-tenant por empresa.

## Estado de esta versión

- Frontend web funcional: dashboard, campañas, contenido, clientes, reseñas, promociones y configuración.
- Backend Express 5.
- PostgreSQL con aislamiento por `business_id`.
- Registro e inicio de sesión con contraseñas hasheadas con bcrypt.
- Sesiones persistidas en PostgreSQL.
- Protección CSRF para formularios.
- Helmet, rate limiting del login, cookies HttpOnly/SameSite/Secure en producción y límites de body.
- Health check en `/health`.
- Docker + PostgreSQL local.
- CI de sintaxis con GitHub Actions.
- Configuración base para Render.

## Desarrollo local

1. Copiar `.env.example` a `.env`.
2. Ejecutar `docker compose up --build`.
3. Abrir `http://localhost:3000`.
4. Con `SEED_DEMO=true` se crea el usuario demo `demo@marketinghub.local` con contraseña `MarketingHubDemo!2026`.

En producción usar `SEED_DEMO=false` y secretos reales.

## Producción

Configurar `DATABASE_URL`, `SESSION_SECRET` de 32+ caracteres aleatorios, `NODE_ENV=production` y `SEED_DEMO=false`. `render.yaml` deja preparado el servicio web, pero todavía requiere crear/conectar PostgreSQL administrado y cargar los secretos del proveedor.

## Integraciones

Meta/Instagram, Google Business, WhatsApp, OpenAI y billing todavía requieren credenciales, OAuth/webhooks y pruebas con cuentas reales. No se consideran conectadas por el hecho de existir una interfaz. Los tokens deben permanecer en backend/secret manager.

## Próximo paso para lanzamiento

Completar y validar despliegue real + PostgreSQL administrado + dominio/HTTPS + OAuth de las fuentes principales + billing si el modelo comercial lo requiere + pruebas end-to-end con cuentas reales.
