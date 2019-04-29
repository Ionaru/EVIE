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
RUN npm run build:prod


## INSTALL SERVER

# Shortcut to create the server directory, data directory and logs directory
RUN mkdir /app/server/ /app/server/logs /app/server/data
WORKDIR /app/server

# Copy needed build files
COPY ./server/package.json .
COPY ./server/package-lock.json .
COPY ./server/tsconfig.json .
COPY ./server/config ./config

# Copy source files
COPY ./server/src ./src

# Install server dependencies
RUN npm install

# Build server for production
RUN npm run build

# Add volumes
VOLUME /app/server/logs
VOLUME /app/server/data
VOLUME /app/server/config


## RUN

EXPOSE  3001
ENV LEVEL debug
ENV NODE_ENV production
CMD ["npm", "start"]
