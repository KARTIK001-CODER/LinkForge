# Changelog

## [1.0.0] — 2026-07-14

### Added

- Smart link management with CRUD, archiving, restoring, soft-delete, and favorites
- Advanced redirect engine with password protection, expiration, scheduled availability, fallback URLs, rules engine, and A/B traffic distribution
- Real-time analytics with GeoIP enrichment, device/browser detection, UTM tracking, time-series aggregation, and CSV export
- User authentication with JWT access/refresh tokens, account locking, rate limiting, and session management
- Collection-based link organization
- Role-based access control (USER/ADMIN)
- Email verification and password reset flow
- Prometheus metrics for monitoring
- Redis caching with 24-hour TTL and circuit breaker resilience
- Pre-aggregated analytics metrics (hourly/daily/monthly) for fast queries
- Server-Sent Events (SSE) for real-time analytics streaming
- Rate limiting on all public endpoints
- Helmet security headers
- Structured logging with pino (replaces console.log)
- Request ID correlation
- Health check endpoints (liveness + readiness with DB and Redis checks)
- Docker containerization with multi-stage build
- Comprehensive CI/CD pipeline
- Environment variable validation at startup
- Database index optimization with composite indexes for analytics queries
- Test suite covering redirect engine, auth services, rules engine, traffic distribution, enrichment, and JWT

### Infrastructure

- Docker Compose for PostgreSQL 16, Redis 7, and backend services
- GitHub Actions CI: lint, type-check, test, build, Prisma validate, Docker build
- Production deployment guide and environment variable reference

### Security

- Hardcoded JWT secrets removed (env var validation at startup)
- Redirect route rate limiting added
- Express trust proxy configured
- Compression middleware enabled
- Input validation with Zod on all endpoints
- Account lockout after 5 failed login attempts
- HTTP-only cookies for refresh tokens
- Audit logging for auth events
