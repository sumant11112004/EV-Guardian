# ChargePointX – Multi-stage Dockerfile

# ── Stage 1: Build Frontend ──
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Backend ──
FROM node:20-alpine AS production
WORKDIR /app

# Backend deps
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Backend source
COPY backend/ ./

# Copy frontend build
COPY --from=frontend-builder /app/frontend/.next /app/public/frontend/.next
COPY --from=frontend-builder /app/frontend/public /app/public/frontend/public

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server.js"]
