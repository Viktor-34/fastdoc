FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
# prisma/schema.prisma must exist before npm postinstall (prisma generate)
COPY prisma ./prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm ci

COPY . .

ENV NODE_ENV=production

RUN npx prisma generate
RUN NEXTAUTH_SECRET=build-only-secret npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
