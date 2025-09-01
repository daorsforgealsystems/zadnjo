# Frontend Dockerfile for React/Vite app
FROM node:20.17.0-alpine AS build
ARG VITE_BUILD_MODE=docker

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
# Use Vite mode so the frontend picks up .env.<mode> files (we'll pass docker via build args)
RUN npm run build -- --mode $VITE_BUILD_MODE

# Production stage
FROM nginx:1.27-alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]