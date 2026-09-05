# Marketing Hub

SaaS-style marketing dashboard for small businesses: restaurants, cafes, barbers, clothing stores and other local businesses.

## Current version

The repository contains a self-contained frontend MVP in `index.html`.

### Included in the MVP

- Dashboard with marketing KPIs
- Advertising/campaign management
- Content calendar
- Content generator demo
- CRM / customers
- Reviews and assisted responses
- Promotions
- Analytics
- Tasks
- Reports + CSV export
- Business configuration
- Global search
- Notifications
- Responsive mobile layout
- Demo persistence with `localStorage`
- Integration area prepared for Google Business Profile, Meta Ads, Google Ads, Instagram/Facebook, WhatsApp Business and POS/e-commerce

## Run locally

No build step is required.

Open `index.html` in a browser, or serve the repository with any static web server.

Example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Important MVP limitation

This is currently a frontend/demo product. Authentication, database persistence, real advertising APIs, real social publishing, WhatsApp messaging, POS/e-commerce sales attribution and production AI are not connected yet.

The UI intentionally keeps external credentials out of the browser. Production integrations should follow:

```text
Marketing Hub frontend
        |
        v
     Backend
        |
  +-----+-----+
  |     |     |
 DB   APIs    AI
```

OAuth tokens and API secrets must remain on the backend.

## Recommended production stack

- Frontend: Next.js / React
- Backend: Node.js
- Database: PostgreSQL / Supabase
- Hosting: Vercel + Railway/Render/Supabase
- Authentication: secure session-based auth or managed auth provider
- AI: OpenAI API through the backend
- Payments: Stripe or Mercado Pago

## Production roadmap

1. Backend + PostgreSQL + real authentication
2. Multi-business / workspace model
3. Google Business Profile integration
4. Meta / Instagram / Facebook integration
5. Meta Ads integration
6. Real AI content and recommendations
7. Google Ads integration
8. WhatsApp Business integration
9. POS / Shopify / WooCommerce integrations
10. Automated reports, alerts, billing and subscriptions

## Repository

`ignamaher-ops/marketing-hub`
