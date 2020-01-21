FROM  keymetrics/pm2:latest-alpine
ENV NODE_ENV=production
ENV HOST 0.0.0.0 

WORKDIR /usr/src/app
COPY . .

ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install
RUN npm install cross-env -g
EXPOSE 3000
CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]
