FROM node:10-alpine

# Copy files to docker container
COPY . /app

WORKDIR /app/server

# Install app dependencies
RUN npm install

VOLUME /app/server/logs
VOLUME /app/server/data
VOLUME /app/server/config

EXPOSE  3000
CMD ["npm", "run", "serve"]
