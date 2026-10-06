# Build context must be the repo root: docker build -f backend/Dockerfile .
FROM node:24-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY shared/package.json shared/package.json
COPY backend/package.json backend/package.json
RUN npm ci

FROM deps AS build
COPY tsconfig.base.json ./
COPY shared/ shared/
COPY backend/ backend/
RUN npm run build -w shared
RUN npm run prisma:generate -w backend
RUN npm run build -w backend
RUN npm prune --omit=dev

FROM base AS runtime
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/package.json ./package.json
COPY --from=build --chown=appuser:appgroup /app/shared/package.json ./shared/package.json
COPY --from=build --chown=appuser:appgroup /app/shared/dist ./shared/dist
COPY --from=build --chown=appuser:appgroup /app/backend/package.json ./backend/package.json
COPY --from=build --chown=appuser:appgroup /app/backend/dist ./backend/dist
COPY --from=build --chown=appuser:appgroup /app/backend/prisma ./backend/prisma

USER appuser
EXPOSE 4000
CMD ["node", "backend/dist/server.js"]
