# ──────────────────────────────────────────────
# Stage 1: Build the TypeScript server
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app/server

# Install dependencies first (layer caching)
COPY server/package.json server/package-lock.json ./
RUN npm ci

# Copy source and compile
COPY server/tsconfig.json ./
COPY server/src/ ./src/
RUN npm run build

# ──────────────────────────────────────────────
# Stage 2: Production image
# ──────────────────────────────────────────────
FROM node:20-alpine AS production

# Add a non-root user for security
RUN addgroup -S tetrinet && adduser -S tetrinet -G tetrinet

WORKDIR /app

# Install production dependencies only
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev

# Copy compiled server
COPY --from=builder /app/server/dist ./server/dist/

# Copy static client files
# The server serves from path.join(__dirname, '../../client')
# __dirname = /app/server/dist  →  ../../client = /app/client
COPY client/ ./client/

# Set ownership
RUN chown -R tetrinet:tetrinet /app

USER tetrinet

# Default port (overridable via PORT env var)
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/ || exit 1

CMD ["node", "server/dist/index.js"]
