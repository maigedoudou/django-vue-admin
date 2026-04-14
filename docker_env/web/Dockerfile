FROM node:14-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /web/
COPY web/. .
RUN npm install --registry=https://registry.npmmirror.com
RUN npm run build

FROM nginx:alpine
COPY ./docker_env/nginx/my.conf /etc/nginx/conf.d/my.conf
COPY --from=0 /web/dist /usr/share/nginx/html
