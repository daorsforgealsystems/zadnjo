# Notification Service Dockerfile
FROM node:20.17.0-alpine AS base

# Install security updates
RUN apk add --no-cache libc6-compat && \
    apk del apk-tools

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY tsconfig.json ./
COPY src ./src
RUN npm run build || npx tsc -p tsconfig.json

FROM node:20.17.0-alpine

# Install security updates and create non-root user
RUN apk add --no-cache libc6-compat dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    apk del apk-tools

WORKDIR /app
ENV NODE_ENV=production

# Copy package files and install production dependencies
COPY --from=base /app/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application
COPY --from=base /app/dist ./dist

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 4006

# Use dumb-init for proper signal handling
CMD ["dumb-init", "node", "dist/main.js"]