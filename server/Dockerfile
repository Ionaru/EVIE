FROM node:12-alpine

## INSTALL SERVER

RUN mkdir -p /app/logs /app/data /app/config
WORKDIR /app

# Copy needed build files
COPY ./config ./config
COPY ./package.json ./package-lock.json ./tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY ./src ./src

# Build server for production
ENV NODE_ENV production
RUN npm run build
RUN npm cache clean --force

# Add volumes
VOLUME /app/logs /app/data /app/config

## RUN

CMD ["npm", "start"]
