FROM node:12-alpine
RUN mkdir /app
WORKDIR /app

## INSTALL SERVER

RUN mkdir /app/logs
RUN mkdir /app/data
RUN mkdir /app/config

# Install dependencies
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install

# Copy needed build files
COPY ./tsconfig.json .
COPY ./config ./config

# Copy source files
COPY ./src ./src

# Build server for production
ENV NODE_ENV production
RUN npm run build
RUN npm ci
RUN npm cache clean --force

# Add volumes
VOLUME /app/server/logs
VOLUME /app/server/data
VOLUME /app/server/config

## RUN

EXPOSE  3000
CMD ["npm", "start"]
