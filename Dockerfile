# ─────────────────────────────────────────────────────────────────
# Multi-Stage Dockerfile for MERN App
# Stage 1 : Build the React frontend
# Stage 2 : Run Express server (serves API + static React build)
# ─────────────────────────────────────────────────────────────────

# ── Stage 1: Build React ──────────────────────────────────────────
FROM public.ecr.aws/docker/library/node:18-alpine AS build-client

WORKDIR /app/client

# Install dependencies first (layer cache optimization)
COPY client/package*.json ./
RUN npm ci --silent

# Copy source and build
COPY client/ ./
RUN npm run build


# ── Stage 2: Production Express Server ───────────────────────────
FROM public.ecr.aws/docker/library/node:18-alpine AS production

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install server dependencies
COPY server/package*.json ./server/
RUN npm ci --prefix server --only=production --silent

# Copy server source
COPY server/ ./server/

# Copy built React app from Stage 1
COPY --from=build-client /app/client/build ./client/build

# Set ownership
RUN chown -R appuser:appgroup /app
USER appuser

# Environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Health check for ECS
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "server/index.js"]
