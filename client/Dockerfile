FROM node:10-alpine
RUN mkdir /app/

## INSTALL CLIENT

RUN mkdir /app/client/
WORKDIR /app/client

# Copy needed build files
COPY ./client/.npmrc .
COPY ./client/package.json .
COPY ./client/package-lock.json .
COPY ./client/angular.json .
COPY ./client/tsconfig.json .

# Copy source files
COPY ./client/src ./src

# Install client dependencies
ARG FA_TOKEN
RUN npm install

# Build client for production
ENV NODE_ENV production
RUN npm run build:prod
RUN npm ci

## RUN NGINX

FROM nginx:mainline-alpine
COPY ./client/nginx.conf /etc/nginx/conf.d
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=0 /app /app
