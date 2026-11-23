FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

COPY pnpm*.json ./

RUN corepack enable pnpm

COPY . .

RUN pnpm run build

EXPOSE 3001

CMD ["npm", "start"]
