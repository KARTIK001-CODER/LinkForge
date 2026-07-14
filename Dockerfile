FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
RUN npm ci

COPY apps/backend/prisma apps/backend/prisma
COPY apps/backend/tsconfig.json apps/backend/tsconfig.json
COPY apps/backend/src apps/backend/src

RUN npm run prisma:generate --workspace=apps/backend
RUN npm run build --workspace=apps/backend

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache tini

COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/apps/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

RUN addgroup -S linkforge && adduser -S linkforge -G linkforge
USER linkforge

EXPOSE 4000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
