# ---- Build stage: compile TypeScript to dist/ ----
FROM node:26-alpine AS build

WORKDIR /app

# Install all dependencies (including dev) for the build.
COPY server/package.json server/package-lock.json server/tsconfig.json ./
RUN npm ci

# Compile the application. The migrations are compiled alongside src, so the
# runtime stage can run them without ts-node.
COPY server/src ./src
COPY server/migrations ./migrations
RUN npm run build


# ---- Runtime stage: production image ----
FROM node:26-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies only. Everything is pure JavaScript, so there
# is no native compilation and no build toolchain is required.
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy the compiled application and its migrations from the build stage.
COPY --from=build /app/dist ./dist

# The ESI response cache lives in /app/data. /app/config is where the optional
# EVIE_DB_SSL_CA/CERT/KEY certificates are expected; both are mounted as volumes
# in production.
RUN mkdir -p /app/data /app/config && chown -R node:node /app
VOLUME /app/data /app/config

# Nothing is published to the host. The client's nginx reaches this service over
# a shared Docker network, at http://evie-server:3731.
EXPOSE 3731

USER node

# `exec` so the application itself receives SIGTERM and can shut down cleanly,
# rather than the shell that started it.
CMD ["sh", "-c", "npm run migrate && exec node ./dist/src/index.js"]
