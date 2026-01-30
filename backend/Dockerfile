FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose port
EXPOSE 3001

# Start API and scheduler in one container
RUN chmod +x /app/docker-entrypoint.sh
CMD ["/app/docker-entrypoint.sh"]
