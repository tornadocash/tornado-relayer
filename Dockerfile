# syntax=docker/dockerfile:experimental
# export DOCKER_BUILDKIT=1

FROM node:12
WORKDIR /app

RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts && echo "Host github.com\n\tUser git" > ~/.ssh/config

COPY package.json yarn.lock ./
RUN --mount=type=ssh yarn && yarn cache clean --force
COPY . .

EXPOSE 8000
ENTRYPOINT ["yarn"]
