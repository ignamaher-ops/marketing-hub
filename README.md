# Marketing Hub

SaaS base para gestionar el marketing de pequeños negocios: restaurantes, cafés, barberías, locales de ropa y otros negocios locales.

## Estado

Marketing Hub cuenta con frontend responsive, backend Node.js + Express, PostgreSQL, autenticación con sesiones persistidas, aislamiento por workspace y endpoints CRUD para campañas, clientes, contenido, reseñas y promociones.

El producto está preparado para evolucionar desde MVP hacia un SaaS comercial. Las integraciones externas (Meta, Google, WhatsApp, IA y billing) requieren OAuth, credenciales, webhooks y configuración del proveedor antes de considerarse conectadas.

## Stack

- Frontend: HTML/CSS/JavaScript + Chart.js.
- Backend: Node.js 20 + Express 5.
- Base de datos: PostgreSQL.
- Auth: bcrypt + sesiones PostgreSQL + cookies HttpOnly + CSRF.
- Seguridad: Helmet, rate limiting, límites de body y aislamiento por `business_id`.
- Deploy: Docker / Render.

## Desarrollo local

Requisitos: Node.js 20+ y Docker.

```bash
docker compose up --build
```

Abrí `http://localhost:3000`.

También podés ejecutar la app directamente con PostgreSQL disponible:

```bash
npm install
npm start
```

Usá `.env.example` como referencia y mantené los secretos fuera del repositorio.

## Cuenta demo local

Con `SEED_DEMO=true` se crea automáticamente una cuenta de demostración. Para producción, `SEED_DEMO=false` y los usuarios se registran desde la pantalla de acceso.

## Producción

El archivo `render.yaml` deja preparado un servicio Node con PostgreSQL administrado y variables de entorno. Antes de vender el producto hay que configurar dominio/HTTPS, backups, observabilidad y un proveedor de correo si se agregan recuperación de contraseña y emails transaccionales.

## Roadmap comercial

1. Integrar Meta/Instagram y Google Business mediante OAuth.
2. Reemplazar métricas estimadas por datos reales.
3. Incorporar IA vía backend para contenido, recomendaciones y reportes.
4. Agregar WhatsApp Business y fuentes de ventas/POS.
5. Implementar planes, límites por workspace, Stripe/Mercado Pago y billing.

## Repositorio

`ignamaher-ops/marketing-hub`
