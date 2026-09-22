# ============================================================
# backend/Dockerfile — Multi-stage build for Node.js API
# ============================================================

FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies (separate layer for caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# ---- Production stage ----
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app .

# Create non-root user for security
RUN addgroup -S devconnect && adduser -S devconnect -G devconnect
RUN chown -R devconnect:devconnect /app
USER devconnect

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
