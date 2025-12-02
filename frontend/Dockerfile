# ------------------------------------------------------------
# 1. Build frontend using Node
# ------------------------------------------------------------
FROM node:25-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
#COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
COPY package.json ./
RUN npm install

# Copy source
COPY . .

# Build static files (output goes to /app/dist)
RUN npm run build


# ------------------------------------------------------------
# 2. Serve using Nginx
# ------------------------------------------------------------
FROM nginx:1.25-alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy build output to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (optional but recommended)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
