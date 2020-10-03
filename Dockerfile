FROM node:12
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn && yarn cache clean --force
COPY . .

EXPOSE 8000
# HEALTHCHECK CMD curl -f http://localhost:8000/status
ENTRYPOINT ["yarn"]
CMD ["server"]
