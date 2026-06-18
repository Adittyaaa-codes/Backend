# ==========================================
# Stage 1: Build the TypeScript application
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy source code and configuration files
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript to JavaScript (generates the dist/ directory)
RUN npm run build

# Prune node_modules to keep only production dependencies
RUN npm prune --production

# ==========================================
# Stage 2: Create the runner image
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy built files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create a non-root user for security and use it
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodeuser -G nodejs && \
    chown -R nodeuser:nodejs /app
USER nodeuser

# Expose port (adjust to the port your Node.js application uses, e.g., 3000 or 5000)
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
