# Notification Microservice Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S notification -u 1001

# Change ownership
RUN chown -R notification:nodejs /app
USER notification

# Expose port
EXPOSE 3013

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3013/health || exit 1

# Start application
CMD ["npm", "start"]