FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY client/package.json client/package-lock.json ./
RUN sed -i 's|https://registry.npmjs.org|https://registry.npmmirror.com|g' package-lock.json \
  && npm ci --registry=https://registry.npmmirror.com
COPY client/ ./
ARG SEED_DEMO=
ARG DEMO_EMAIL=
ARG DEMO_PASSWORD=
ENV SEED_DEMO=$SEED_DEMO \
  DEMO_EMAIL=$DEMO_EMAIL \
  DEMO_PASSWORD=$DEMO_PASSWORD
RUN npm run build

FROM nginx:1.27-alpine
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
