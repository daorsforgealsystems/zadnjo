# User Service Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build || npx tsc -p tsconfig.json

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY --from=base /app/dist ./dist
EXPOSE 4001
CMD ["node", "dist/main.js"]