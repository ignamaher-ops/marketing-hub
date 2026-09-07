# Marketing Hub

SaaS base para gestionar el marketing de pequeños negocios: restaurantes, cafés, barberías, locales de ropa y otros negocios locales.

## Estado

Marketing Hub cuenta con frontend responsive, backend Node.js + Express, PostgreSQL, autenticación con sesiones persistidas, aislamiento por workspace y endpoints CRUD para campañas, clientes, contenido, reseñas y promociones.

El producto también incorpora un **Marketing Manager AI**: un agente dentro del dashboard que cruza campañas, ventas, consultas, clientes, contenido, reseñas y promociones para explicar qué está pasando y recomendar la próxima acción. Si `OPENAI_API_KEY` está configurada, usa la Responses API de OpenAI desde el backend; si no está configurada, funciona en modo demo con análisis determinístico basado en los datos del workspace.

Las integraciones externas (Meta, Google, WhatsApp y billing) requieren OAuth, credenciales, webhooks y configuración del proveedor antes de considerarse conectadas.

## Stack

- Frontend: HTML/CSS/JavaScript + Chart.js.
- Backend: Node.js 20 + Express 5.
- Base de datos: PostgreSQL.
- Auth: bcrypt + sesiones PostgreSQL + cookies HttpOnly + CSRF.
- Seguridad: Helmet, rate limiting, límites de body y aislamiento por `business_id`.
- IA: OpenAI Responses API desde servidor, con `OPENAI_MODEL` configurable.
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

Para activar el modelo real, configurá:

```bash
OPENAI_API_KEY=tu_clave
OPENAI_MODEL=gpt-5.6-luna
```

La clave se usa únicamente en el backend y nunca se envía al navegador.

## Cuenta demo local

Con `SEED_DEMO=true` se crea automáticamente una cuenta de demostración.

- Email: `demo@marketinghub.local`
- Contraseña: `MarketingHubDemo!2026`

Para producción, `SEED_DEMO=false` y los usuarios se registran desde la pantalla de acceso.

## Producción

El archivo `render.yaml` deja preparado un servicio Node con PostgreSQL administrado y una variable privada para `OPENAI_API_KEY`. Antes de vender el producto hay que configurar dominio/HTTPS, backups, observabilidad y un proveedor de correo si se agregan recuperación de contraseña y emails transaccionales.

## Roadmap comercial

1. Integrar Meta/Instagram y Google Business mediante OAuth.
2. Reemplazar métricas estimadas por datos reales.
3. Extender el Marketing Manager AI a contenido, reportes, calendario y acciones ejecutables.
4. Agregar WhatsApp Business y fuentes de ventas/POS.
5. Implementar planes, límites por workspace, Stripe/Mercado Pago y billing.

## Repositorio

`ignamaher-ops/marketing-hub`
