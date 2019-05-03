FROM node:12-alpine
RUN mkdir /app
WORKDIR /app

## INSTALL CLIENT

# Install dependencies
COPY ./.npmrc .
COPY ./package.json .
COPY ./package-lock.json .
ARG FA_TOKEN
RUN npm install

# Copy needed build files
COPY ./angular.json .
COPY ./tsconfig.json .

# Copy source files
COPY ./src ./src

# Build client for production
ENV NODE_ENV production
RUN npm run build:prod

## RUN NGINX

FROM nginx:mainline-alpine

COPY ./nginx.conf /etc/nginx/conf.d
RUN mkdir /etc/nginx/conf.d/proxy
COPY ./nginx-proxy.conf /etc/nginx/conf.d/proxy
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=0 /app /app
