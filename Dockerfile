FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src/ ./src/
COPY public/ ./public/

RUN mkdir -p data && \
    echo '{"accounts":[],"apiKeys":[],"incognito":{"globalEnabled":false,"owners":{}},"invites":[],"registration":{"inviteRequired":false},"sessions":[],"sharedAccountMode":{"enabled":false},"users":[]}' > data/app.json

EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "src/server.js"]
