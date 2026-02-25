# Build stage - runs on native build platform to avoid QEMU SIGILL
# when compiling native modules (e.g. better-sqlite3) for a foreign arch
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder
ARG TARGETARCH

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies for the TARGET architecture on the BUILD platform.
# npm_config_arch tells node-pre-gyp to fetch/compile binaries for the target arch
# so we never invoke the compiler under slow/buggy QEMU emulation.
RUN NPM_ARCH=$([ "$TARGETARCH" = "amd64" ] && echo "x64" || echo "$TARGETARCH") && \
    npm_config_arch=$NPM_ARCH npm ci --omit=dev

# Runtime stage - final image for target platform
FROM node:22-alpine

WORKDIR /app

# Copy pre-built node_modules from builder (already compiled for target arch)
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Fix line endings for Windows hosts
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh

# Expose port
EXPOSE 3001

# Start API and scheduler in one container
RUN chmod +x /app/docker-entrypoint.sh
CMD ["/app/docker-entrypoint.sh"]
