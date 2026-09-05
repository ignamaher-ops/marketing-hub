# Deploy Marketing Hub MVP

The repository is configured as a Render Blueprint with a Node web service and PostgreSQL database.

## 1. Create the deployment

In Render, choose **New → Blueprint** and connect the GitHub repository `ignamaher-ops/marketing-hub`.

Render will read `render.yaml` and provision:

- `marketing-hub` web service
- `marketing-hub-db` PostgreSQL database
- `DATABASE_URL` from the database connection string
- a generated `SESSION_SECRET`

## 2. Deploy

Accept the Blueprint and wait for the web service to finish building.

The service starts with `npm start` and exposes `/health` for the health check.

## 3. Use the app

Open the generated Render URL and create an account from the registration screen.

The MVP now persists these modules in PostgreSQL:

- Authentication and business workspace
- Campaigns
- Customers / CRM
- Content calendar
- Reviews and responses
- Promotions

Campaigns, customers, content, reviews, promotions and workspace settings are scoped to the authenticated business.

## 4. Demo data

Production is configured with `SEED_DEMO=false`, so new deployments start clean. For local development, `docker-compose.yml` keeps `SEED_DEMO=true`.

## 5. Important

Do not put API keys, database credentials or OAuth tokens in `index.html` or any frontend JavaScript. Production integrations should use backend environment variables and server-side OAuth/webhooks.
