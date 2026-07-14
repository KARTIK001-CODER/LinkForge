# Deployment Guide

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- A PostgreSQL 16 database (or use the Docker service)
- A Redis 7 instance (or use the Docker service)
- A domain name with DNS configured (production)

## Production Architecture

```
                         ┌─────────────┐
                         │   Reverse   │
                         │   Proxy     │
                         │  (nginx/    │
                         │  Caddy)     │
                         └──────┬──────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
          ┌─────▼─────┐  ┌──────▼──────┐  ┌──────▼──────┐
          │  Frontend  │  │   Backend   │  │   Backend   │
          │  (CDN/     │  │  (instance) │  │  (instance) │
          │  Static)   │  │  :4000      │  │  :4001      │
          └───────────┘  └──────┬───────┘  └──────┬───────┘
                                │                  │
                    ┌───────────┴──────────┐       │
                    │                      │       │
              ┌─────▼─────┐         ┌──────▼──────┐
              │PostgreSQL │         │    Redis    │
              │   16      │         │     7       │
              └───────────┘         └─────────────┘
```

## Option 1: Docker Compose (Recommended)

### 1. Clone and configure

```bash
git clone https://github.com/your-org/linkforge.git
cd linkforge
cp apps/backend/.env.example apps/backend/.env
```

### 2. Set environment variables

Edit `apps/backend/.env`:

```bash
# Generate strong secrets:
#   openssl rand -base64 64 | tr -dc 'A-Za-z0-9' | head -c 64
#   openssl rand -base64 32

DATABASE_URL="postgresql://linkforge:password@postgres:5432/linkforge"
REDIS_URL="redis://redis:6379"
NODE_ENV=production
JWT_ACCESS_SECRET="<generate-a-64-char-random-string>"
JWT_REFRESH_SECRET="<generate-another-64-char-random-string>"
ANALYTICS_SALT="<generate-a-random-salt>"
FRONTEND_URL="https://your-domain.com"
BASE_URL="https://api.your-domain.com"
```

### 3. Deploy

```bash
# Build and start all services
docker compose up -d --build

# Run database migrations
docker compose exec backend npx prisma migrate deploy
```

### 4. Verify

```bash
# Check health
curl https://api.your-domain.com/health
curl https://api.your-domain.com/ready
```

## Option 2: Manual Deployment

### Backend

```bash
cd apps/backend
npm ci
npm run build
npm run prisma:generate
npm run prisma:migrate:deploy
NODE_ENV=production npm run start
```

### Frontend

Deploy the `apps/frontend/dist/` directory to any static hosting provider (Vercel, Netlify, Cloudflare Pages, S3+CloudFront).

## Environment Variables

See [ENVIRONMENT.md](ENVIRONMENT.md) for a complete reference.

## Health Checks

| Endpoint | Purpose | Expected |
|----------|---------|----------|
| `GET /health` | Liveness probe | `200 { status: "ok" }` |
| `GET /ready` | Readiness probe | `200 { status: "ready", database: "connected", redis: "connected" }` |
| `GET /metrics` | Prometheus metrics | Prometheus text format |

## SSL/TLS

Use a reverse proxy (nginx, Caddy, Traefik) to terminate TLS. Ensure:
- The reverse proxy sets `X-Forwarded-For` headers
- The backend has `trust proxy` enabled (already configured)
- Cookies have `Secure` flag (enabled when `NODE_ENV=production`)

## Monitoring

- Prometheus metrics are available at `/metrics`
- Structured JSON logs via pino (log to stdout, collect with your log aggregator)
- Health check endpoints for container orchestration

## Scaling

- The backend is stateless — scale horizontally behind a load balancer
- Use a connection pooler (PgBouncer) for PostgreSQL
- Redis handles caching and analytics streams — ensure enough memory
- Pre-computed analytics tables keep query performance constant regardless of data volume
