# Multi-stage Dockerfile for M.K. ENTERPRISES Glass & Aluminium Billing System
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies including zip for backup engine
RUN apk add --no-cache zip

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript & Vite build)
RUN npm ci

# Copy application source code
COPY . .

# Build production frontend assets (output to /app/dist)
RUN npm run build

# --- Production Image ---
FROM node:22-alpine AS runner

WORKDIR /app

# Install runtime utilities (zip utility for daily automated backup archives)
RUN apk add --no-cache zip

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend server, scripts, and default seed data
COPY server ./server
COPY scripts ./scripts

# Create persistent storage mount directory
RUN mkdir -p /app/server/data /app/server/backups

# Expose cloud port
EXPOSE 5000

# Start unified server
CMD ["npm", "start"]

