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

# Start nginx - with debug output
CMD sh -c "echo 'BACKEND_URL is: ' && echo $BACKEND_URL && envsubst '\$BACKEND_URL' < /etc/nginx/nginx.conf.src > /etc/nginx/conf.d/default. conf && echo 'Generated config line 21: ' && sed -n '21p' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"