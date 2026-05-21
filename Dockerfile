FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Expose port 3000 (Cloud Run will override this, but we support process.env.PORT)
EXPOSE 3000

ENV NODE_ENV=production

# Run the server in production mode
CMD ["npx", "tsx", "server/index.ts"]
