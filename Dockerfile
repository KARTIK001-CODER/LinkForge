FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

RUN npm ci

COPY apps/backend/prisma apps/backend/prisma
COPY apps/backend/tsconfig.json apps/backend/tsconfig.json
COPY apps/backend/src apps/backend/src

RUN npm run prisma:generate --workspace=apps/backend
RUN npm run build --workspace=apps/backend


FROM node:20-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends tini openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

RUN groupadd --system linkforge \
    && useradd --system --gid linkforge linkforge

USER linkforge

EXPOSE 4000

ENTRYPOINT ["/usr/bin/tini", "--"]

CMD ["node", "dist/server.js"]