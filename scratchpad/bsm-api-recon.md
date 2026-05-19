# Barton Springs Mill API Reconnaissance

Date: 2026-05-19

## Summary
bartonspringsmill.com is a **Shopify storefront** with public JSON APIs and UCP (Unified Commerce Protocol) support.

## Reachable Endpoints

### Status 200 (Public APIs)
- `GET /robots.txt` — text/plain; directs agents to UCP endpoints
- `GET /sitemap.xml` — application/xml
- `GET /products.json?limit=2` — application/json; returns `{"products": [...]}`
- `GET /cart.js` — text/javascript; empty payload (caching served)
- `GET /.well-known/ucp` — application/json; UCP discovery document

### Status 404
- `GET /api/2024-01/graphql.json` (on the primary domain — Storefront GraphQL is at the `.myshopify.com` host)
- `GET /api/ucp/mcp` (on primary domain — actual endpoint is on `.myshopify.com`)

## API Surfaces

### 1. Shopify JSON Product API (`/products.json`) — RECOMMENDED MVP
Public, no auth. Response shape:
```json
{
  "products": [
    {
      "id": 7968384876798,
      "title": "...",
      "handle": "tour-2",
      "body_html": "...",
      "vendor": "Barton Springs Mill",
      "product_type": "Tour",
      "variants": [
        { "id": 43797381447934, "title": "10am - 11am", "sku": null, "price": "25.00", "available": true }
      ],
      "images": [...]
    }
  ]
}
```
Query params: `limit`, `page`. Pagination via `?page=N` works.

### 2. Shopify UCP (Unified Commerce Protocol)
Discovery: `/.well-known/ucp` →
- `ucp.version`: "2026-04-08"
- `ucp.services.dev.ucp.shopping.endpoint`: `https://bartonspringsmill.myshopify.com/api/ucp/mcp`
- Capabilities: catalog.search, catalog.lookup, cart, checkout, order, discount, fulfillment

This is Shopify's *native* MCP transport. Future-proof but undocumented client-side. Skip for v1.

### 3. Shopify Storefront GraphQL
- Token (public, in homepage HTML): `77f4b8d3ae0aba7ee91cb058ab0a3f48`
- Endpoint: `https://bartonspringsmill.myshopify.com/api/2024-01/graphql.json`
- Better filtering/sorting than REST. Defer to v2.

## Rate Limits / Auth
- No explicit `X-RateLimit-*` headers on `/products.json`
- Cloudflare front (cf-ray present)
- `shopify-complexity-score-v2` header surfaces on some endpoints (29–162 range observed)
- Standard Shopify public limit ≈ 2 req/s — throttle to be safe

## MCP Server Decision
**v1: `/products.json` REST** — simplest, no auth, no token leak risk, easy to mock.
**v2 (future):** Storefront GraphQL via public token for richer filters.
**Skip:** UCP MCP transport — premature, would require MCP-to-MCP bridge.

## Health Check Target
`GET https://bartonspringsmill.com/products.json?limit=1` — cheap, public, returns JSON. Validate: status 200, `Content-Type: application/json`, body parses, top-level `products` is array.
