FROM node:20-alpine AS builder

WORKDIR /app

# install deps
COPY package*.json ./
RUN npm ci

# copy from the directory
COPY . .

# generate prisma client and build 
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# install deps
COPY package*.json ./
RUN npm ci --omit=dev && npm install prisma

# copy
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src ./src

# generate
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
