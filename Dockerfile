#=============================================================================
# Stage 1: Build Stage
# Purpose: Build the React application
# =============================================================================
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code and configuration files
COPY src ./src
COPY index.html ./
COPY public ./public
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Build the application
RUN npm run build

# =============================================================================
# Stage 2: Runtime Stage with Nginx
# Purpose: Serve the static files with Nginx
# =============================================================================
FROM nginx:1.29-alpine

# Labels for container metadata
LABEL "maintainer"="MyApp admin"
LABEL "description"="MyApp Frontend Application"

# Install runtime dependencies
# - gettext for envsubst (environment variable substitution)
# - curl for health checks
RUN apk add --no-cache \
    gettext \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nginx-user && \
    adduser -u 1001 -S nginx-user -G nginx-user

# Create necessary directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx /var/log/nginx /usr/share/nginx/html && \
    chmod -R 755 /var/cache/nginx /var/log/nginx /usr/share/nginx/html

# Copy built application from builder stage
COPY --from=builder --chown=nginx-user:nginx-user /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY --chown=nginx-user:nginx-user nginx/nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx-user:nginx-user nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy runtime configuration files
# COPY --chown=nginx-user:nginx-user config /usr/share/nginx/html/config

# Copy startup script
COPY --chown=nginx-user:nginx-user docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Switch to non-root user
USER nginx-user

# Expose port 80 (non-privileged port)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost || exit 1

# Start nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
