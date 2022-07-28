FROM node:16
WORKDIR /usr/src/app
COPY package.json ./
COPY yarn.lock ./
COPY prisma ./prisma/
COPY .env ./
COPY tsconfig.json ./
COPY . .
RUN yarn
RUN npx prisma generate
RUN yarn build
EXPOSE 3000
CMD [ "yarn", "start:dev" ]