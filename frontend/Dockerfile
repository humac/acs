# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . . 

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf.src

# Expose port
EXPOSE 80

# Use a startup script for clarity
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "BACKEND_URL:  $BACKEND_URL"' >> /start.sh && \
    echo 'envsubst "\$BACKEND_URL" < /etc/nginx/nginx.conf.src > /etc/nginx/conf.d/default.conf' >> /start.sh && \
    echo 'cat /etc/nginx/conf.d/default.conf | grep proxy_pass' >> /start.sh && \
    echo 'exec nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

CMD ["/start.sh"]