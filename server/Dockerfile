FROM node:10-alpine
RUN mkdir /app/

## INSTALL SERVER

RUN mkdir /app/server/
RUN mkdir /app/server/logs
RUN mkdir /app/server/data
RUN mkdir /app/server/config
WORKDIR /app/server

# Copy needed build files
COPY ./server/package.json .
COPY ./server/package-lock.json .
COPY ./server/tsconfig.json .
COPY ./server/config ./config

# Copy source files
COPY ./server/src ./src

# Copy shared source files from client
RUN mkdir -p /app/client/src/shared
COPY ./client/src/shared /app/client/src/shared

# Install server dependencies
RUN npm install

# Build server for production
ENV NODE_ENV production
RUN npm run build
RUN npm ci

# Add volumes
VOLUME /app/server/logs
VOLUME /app/server/data
VOLUME /app/server/config


## RUN

EXPOSE  3000
ENV LEVEL debug
CMD ["npm", "run", "start"]
