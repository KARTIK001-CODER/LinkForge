<![CDATA[# LinkForge

**Smart link management platform with advanced redirect engine, real-time analytics, and enterprise-grade security.**

[![CI](https://github.com/user/linkforge/actions/workflows/ci.yml/badge.svg)](https://github.com/user/linkforge/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue)
![React](https://img.shields.io/badge/React-19-purple)
![Express](https://img.shields.io/badge/Express-5-green)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

---

## Features

- **Smart Link Management** — Create, edit, archive, favorite, and organize links with tags and collections
- **Advanced Redirect Engine** — Password protection, expiration dates, scheduled availability, fallback URLs, rules engine (device/country/date conditions), A/B traffic distribution
- **Real-time Analytics** — Click tracking with GeoIP enrichment, device/browser detection, UTM parameter capture, time-series aggregation, live SSE streaming, CSV export
- **Authentication & Authorization** — JWT access/refresh tokens, account locking, rate limiting, session management, role-based access control
- **Enterprise Security** — Helmet headers, rate limiting, input validation (Zod), SQL injection protection (Prisma), XSS prevention, audit logging, cookie security
- **High Performance** — Redis caching (24h TTL), pre-aggregated metrics tables, circuit breaker for database resilience, composite indexes, compression, connection pooling

---

## Quick Start

```bash
# Prerequisites: Node.js 20+, Docker

# 1. Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# 2. Set up environment
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with your configuration

# 3. Install dependencies and initialize the database
npm install
npm run prisma:generate
npm run prisma:migrate:deploy

# 4. Start development servers
npm run dev
```

The backend starts at `http://localhost:4000` and the frontend at `http://localhost:5173`.

---

## Architecture

```
                    ┌─────────────┐
                    │  Frontend   │
                    │  React 19   │
                    │  Vite + TS  │
                    └──────┬──────┘
                           │ HTTP/JSON
                    ┌──────▼──────┐
                    │  Backend    │
                    │  Express 5  │
                    │  TypeScript │
                    └──────┬──────┘
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │PostgreSQL│    │  Redis   │    │  Client  │
    │  Prisma  │    │ Cache +  │    │  Browsers│
    │   ORM    │    │ Streams  │    │  (links) │
    └──────────┘    └──────────┘    └──────────┘
```

### Backend Modules

| Module | Purpose |
|--------|---------|
| `auth` | Registration, login, JWT, sessions, password reset, email verification |
| `links` | Smart link CRUD, lifecycle (archive/restore/delete), favorites |
| `collections` | Link grouping and organization |
| `redirect` | Link resolution, rules engine, traffic distribution, caching |
| `analytics` | Event pipeline, enrichment, aggregation, real-time streaming, export |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Express 5, TypeScript 7, Prisma 5 |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 (caching + event streams) |
| **Frontend** | React 19, Vite 8, Tailwind CSS 4 |
| **Auth** | JWT (access 15m + refresh 30d/90d), bcrypt |
| **Analytics** | GeoIP, UA parsing, pre-aggregated metrics |
| **Monitoring** | Prometheus metrics, structured logging (pino) |
| **Resilience** | Circuit breaker (opossum), dead-letter queue |

---

## Project Structure

```
linkforge/
├── apps/
│   ├── backend/          # Express API server
│   │   ├── prisma/       # Database schema & migrations
│   │   └── src/
│   │       ├── lib/      # Shared utilities (logger, prisma, error handler)
│   │       ├── modules/  # Feature modules (auth, links, redirect, analytics)
│   │       └── test/     # Test utilities
│   └── frontend/         # React SPA
│       └── src/
│           ├── components/  # Shared UI components
│           ├── features/    # Feature-specific components & API hooks
│           └── pages/       # Route pages
├── docker-compose.yml    # Infrastructure orchestration
├── Dockerfile            # Backend production build
└── .github/workflows/    # CI/CD pipeline
```

---

## Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) — Production setup, Docker, environment variables
- [Environment Reference](docs/ENVIRONMENT.md) — All configuration variables
- API documentation is available inline in the route and controller files

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start both backend and frontend in development mode |
| `npm run build` | Build both backend and frontend for production |
| `npm run test` | Run all tests |
| `npm run prisma:migrate:deploy` | Apply database migrations |
| `docker compose up -d` | Start PostgreSQL, Redis, and the backend |

---

## License

ISC
]]>