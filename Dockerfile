# Build the static admin UI, then serve it with nginx, which also proxies the
# admin API to the Tamamo container.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
# Where the Tamamo admin API is reachable from this container.
ENV TAMAMO_API=http://tamamo:8081
# Let the nginx image put this container's DNS servers in NGINX_LOCAL_RESOLVERS,
# so the backend's name is resolved at request time.
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8081
