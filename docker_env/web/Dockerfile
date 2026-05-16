FROM node:14-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /web/
COPY web/. .
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-factor 2 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && (npm install --registry=https://registry.npmmirror.com || npm install --registry=https://registry.npmjs.org)
RUN grep -rl "操作" node_modules/d2-crud-x node_modules/d2-crud-plus 2>/dev/null | grep -v "\.map$" | xargs sed -i 's/"操作"/"Actions"/g; s/'"'"'操作'"'"'/'"'"'Actions'"'"'/g' 2>/dev/null || true
RUN npm run build

FROM nginx:alpine
COPY ./docker_env/nginx/my.conf /etc/nginx/conf.d/my.conf
COPY --from=0 /web/dist /usr/share/nginx/html
