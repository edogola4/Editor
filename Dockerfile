# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install production dependencies
RUN npm install --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy other necessary files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server/package.json ./server/

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["node", "dist/server/src/index.js"]
