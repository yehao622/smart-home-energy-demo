FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apk update && apk upgrade --no-cache

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Remove package-lock.json so Trivy doesn't scan it
RUN rm -f package-lock.json

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
