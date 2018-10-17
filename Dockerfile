FROM node:10-alpine

# Copy files to docker container
COPY . /app

WORKDIR /app/client
# Install client dependencies
RUN npm install
RUN npm run build:prod

WORKDIR /app/server
# Install server dependencies
RUN npm install

VOLUME /app/server/logs
VOLUME /app/server/data
VOLUME /app/server/config

EXPOSE  3001
ENV LEVEL debug
ENV NODE_ENV production
CMD ["npm", "run", "serve"]
