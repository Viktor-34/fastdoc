FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
# prisma/schema.prisma must exist before npm postinstall (prisma generate)
COPY prisma ./prisma
RUN apt-get update -y && apt-get install -y openssl curl chromium && rm -rf /var/lib/apt/lists/*
RUN npm ci

COPY . .
RUN chmod +x /app/scripts/start.sh

ENV NODE_ENV=production
ENV CHROME_EXECUTABLE_PATH=/usr/bin/chromium

RUN npx prisma generate
RUN NEXTAUTH_SECRET=build-only-secret npm run build

EXPOSE 3000

CMD ["sh", "/app/scripts/start.sh"]
