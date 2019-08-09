FROM node:11
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 8000
HEALTHCHECK CMD curl -f http://localhost:8000/
CMD ["npm", "run", "start"]