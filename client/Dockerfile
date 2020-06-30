FROM node:14-alpine as build

## INSTALL CLIENT

RUN mkdir /app
WORKDIR /app

# Copy needed build files
COPY ./.browserslistrc ./.npmrc ./package.json ./package-lock.json ./angular.json ./tsconfig.json ./

# Install dependencies
ARG EVIE_FA_TOKEN
RUN npm ci

# Copy source files
COPY ./src ./src

# Build client for production
ENV NODE_ENV production
ARG EVIE_ENV
RUN npx ng build --configuration=${EVIE_ENV}

## RUN NGINX

FROM nginx:mainline-alpine as serve

COPY ./nginx.conf /etc/nginx/conf.d
RUN mkdir /etc/nginx/conf.d/proxy
COPY ./nginx-proxy.conf /etc/nginx/conf.d/proxy
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/client /app
