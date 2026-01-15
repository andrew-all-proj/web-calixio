FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_API_BASE
ARG VITE_LIVEKIT_WS
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_LIVEKIT_WS=${VITE_LIVEKIT_WS}
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
