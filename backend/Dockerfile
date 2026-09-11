FROM node:20-alpine AS base

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 4000

# CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && npm start"]
CMD ["sh", "-c", "npx prisma db push && npm run seed && npm start"]
