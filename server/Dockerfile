FROM node:16-alpine

## INSTALL SERVER

RUN mkdir -p /app/data /app/config
WORKDIR /app

# Copy needed build files
COPY ./package.json ./package-lock.json ./tsconfig.json ./ormconfig.js ./

# Install dependencies
RUN npm ci

# Copy source files
COPY ./src ./src
COPY ./migrations ./migrations

# Build server for production
ENV NODE_ENV production
RUN npm run build
RUN npm cache clean --force

# Add volumes
VOLUME /app/data /app/config

## RUN

CMD ["npm", "start"]
