FROM 454455319752.dkr.ecr.eu-west-2.amazonaws.com/nodejs:alpine-3.11_nodejs-12 AS base

RUN apk upgrade --no-cache && \
      mkdir -p /opt/app/dft-street-manager-jobs

WORKDIR /opt/app/dft-street-manager-jobs

ENTRYPOINT ["/sbin/tini", "--"]

COPY package.json .

COPY package-lock.json .

FROM base AS dependencies

RUN apk add --no-cache \
      g++ \
      make \
      python

COPY . .

RUN npm set progress=false && \
      npm config set depth 0 && \
      npm install --only=production && \
      cp -R node_modules prod_node_modules && \
      npm install && \
      npm run build && \
      npm audit && \
      npm run test

FROM base AS release

COPY --from=dependencies /opt/app/dft-street-manager-jobs/dist /opt/app/dft-street-manager-jobs/dist
COPY --from=dependencies /opt/app/dft-street-manager-jobs/src /opt/app/dft-street-manager-jobs/src
COPY --from=dependencies /opt/app/dft-street-manager-jobs/prod_node_modules /opt/app/dft-street-manager-jobs/node_modules

RUN chown nodejs:nodejs -R /opt/app

USER nodejs
