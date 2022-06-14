FROM node:16-alpine as dev

ENV NODE_ENV=development

WORKDIR /usr/app

COPY yarn.lock .
COPY package.json .

RUN yarn install && yarn cache clean

COPY . .

RUN yarn build

FROM node:16-alpine as production
ENV NODE_ENV=production

WORKDIR /app

COPY --from=dev /usr/app/build /app
COPY --from=dev /usr/app/package.json /app/
COPY --from=dev /usr/app/yarn.lock /app/

RUN chown -R node: .

USER node
RUN yarn install --non-interactive --frozen-lockfile && yarn cache clean

CMD ["node", "index.js"]
