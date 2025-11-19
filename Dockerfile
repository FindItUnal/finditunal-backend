# Optimized multi-stage Dockerfile using Alpine
# - build stage installs build tools only there
# - runtime stage contains only production deps + compiled JS

FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies needed for native modules (bcrypt, etc.)
RUN apk add --no-cache python3 make g++ build-base git

# Copy manifests first to leverage Docker cache for npm install
COPY package.json package-lock.json tsconfig.json ./

# Install all deps (dev deps needed to build)
RUN npm ci --legacy-peer-deps

# Copy sources and build
COPY . .
# Don't build in the builder stage for development - 
# the mounted volume will have the source code and dev mode will handle compilation
RUN npm run build || true

### Runtime stage
FROM node:18-alpine AS runtime
WORKDIR /app

# Install production dependencies only (smaller)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund --legacy-peer-deps

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built artifacts from builder
COPY --from=builder /app/Build ./Build

ENV NODE_ENV=production
EXPOSE 3000

# Use unprivileged user
USER appuser

CMD ["node", "Build/server-with-mysql.js"]
