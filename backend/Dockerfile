FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --silent
COPY . .
EXPOSE 41783
VOLUME /app/data
CMD ["node", "server.js"]
