FROM node:22.7-slim
WORKDIR /primer-search
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
