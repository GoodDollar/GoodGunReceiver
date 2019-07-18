FROM node:10

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

VOLUME ["/app/lmdbdata"]

EXPOSE 4444

ENV AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
ENV AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}

CMD ["node", "index.js"]