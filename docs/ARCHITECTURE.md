# Marketing Hub — Architecture

## Current MVP

The current application is intentionally a single static HTML file. It uses browser `localStorage` for demo data and does not expose external API credentials.

## Target architecture

```text
                         +----------------------+
                         |   Marketing Hub UI   |
                         |   React / Next.js    |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         |       Backend        |
                         | Auth / API / Jobs    |
                         +----+----+----+-------+
                              |    |    |
                +-------------+    |    +----------------+
                |                  |                     |
                v                  v                     v
        +---------------+  +---------------+     +---------------+
        | PostgreSQL    |  | External APIs |     | AI Provider   |
        | Businesses    |  | Google / Meta |     | OpenAI        |
        | Users / CRM   |  | WhatsApp / POS|     |               |
        +---------------+  +---------------+     +---------------+
```

## Core entities

- `users`
- `businesses`
- `memberships`
- `campaigns`
- `content_items`
- `customers`
- `reviews`
- `promotions`
- `tasks`
- `integrations`
- `integration_accounts`
- `analytics_snapshots`
- `reports`
- `subscriptions`

## Security rules

1. Never put API client secrets in frontend JavaScript.
2. OAuth authorization should be completed through the backend.
3. Store provider access/refresh tokens encrypted at rest.
4. Scope every database query by business/workspace.
5. Validate webhook signatures before accepting external events.
6. Add rate limits to authentication, AI and messaging endpoints.
7. Keep production credentials in environment variables / secret storage.
8. Log integration errors without logging access tokens or sensitive customer data.

## Integration order

### Phase 1

- Google Business Profile
- Meta Ads
- Instagram/Facebook

### Phase 2

- Google Ads
- WhatsApp Business
- AI generation/recommendations

### Phase 3

- POS / e-commerce
- Shopify / WooCommerce
- Automated attribution
- Advanced reporting

## Attribution

The current MVP displays estimated/demo performance. Production ROAS and sales attribution require a real source of sales, such as a POS, e-commerce platform, booking system or verified conversion events.
