# ---- Build stage: compile the Angular application ----
#
# Node 16 is deliberate, and the only place this repository does not use Node 24.
# Angular 11 ships webpack 4, whose hardcoded md4 hashing fails against the
# OpenSSL 3 that Node 17 and newer bundle. The pin can go once the client is
# upgraded past Angular 11; see the known issue in CHANGELOG.md.
FROM node:26-alpine AS build

WORKDIR /app

# Install dependencies. The @fortawesome packages are the paid Pro ones and come
# from a private registry, so this needs a FontAwesome token. .npmrc reads it
# from the environment, which ARG provides for the duration of the RUN below.
COPY client/.browserslistrc client/.npmrc client/package.json client/package-lock.json client/angular.json client/tsconfig.base.json ./
ARG EVIE_FA_TOKEN
RUN npm ci

# Copy source files.
COPY client/src ./src

# Build the client for production. EVIE_ENV selects an `ng build` configuration
# from angular.json: one of local, development or production.
ENV NODE_ENV production
ARG EVIE_ENV=production
RUN npx ng build --configuration=${EVIE_ENV}


# ---- Runtime stage: serve the built files with nginx ----
FROM nginx:mainline-alpine AS runtime

COPY client/nginx.conf /etc/nginx/conf.d
RUN mkdir /etc/nginx/conf.d/proxy
COPY client/nginx-proxy.conf /etc/nginx/conf.d/proxy
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/client /app

# Nothing is published to the host. nginx listens on 80 and is reached over the
# "edge" network by the reverse proxy, as http://evie-client:80.
EXPOSE 80
