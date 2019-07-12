FROM node:10

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

VOLUME ["/lmdbdata"]

EXPOSE 4444

CMD ["node", "index.js"]