# Environment Variables

## Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens (64+ chars, random) | `a1b2c3...` |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (64+ chars, random) | `d4e5f6...` |
| `ANALYTICS_SALT` | Salt for hashing visitor IPs + user agents | `random-salt-string` |

## Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | HTTP server port |
| `NODE_ENV` | `development` | Environment mode (`development`, `production`, `test`) |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend URL for CORS and redirects |
| `BASE_URL` | `http://localhost:4000` | Backend public base URL |
| `LOG_LEVEL` | `debug` (dev) / `info` (prod) | Pino log level |

## Generating Secrets

```bash
# JWT secrets (64 chars, alphanumeric)
openssl rand -base64 64 | tr -dc 'A-Za-z0-9' | head -c 64

# Analytics salt (32 chars, base64)
openssl rand -base64 32
```

## Production Checklist

- [ ] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are strong random values
- [ ] `ANALYTICS_SALT` is a unique random string
- [ ] `NODE_ENV` is set to `production`
- [ ] `FRONTEND_URL` points to your production frontend domain
- [ ] `BASE_URL` points to your production API domain
- [ ] `DATABASE_URL` uses a production-grade PostgreSQL with SSL
- [ ] `REDIS_URL` points to a production Redis instance with persistence
