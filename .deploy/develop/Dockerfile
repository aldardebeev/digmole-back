FROM node:20.11.0-bullseye-slim as build

ARG STAGE=develop
WORKDIR /app
COPY . .
RUN cp -rf .deploy/$STAGE/.env . && \
    yarn install --frozen-lockfile && \
    yarn prisma generate && \
    yarn run build && \
    rm -rf .deploy

FROM node:20.11.0-bullseye-slim

WORKDIR /app
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.env ./.env
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist

CMD ["yarn", "run", "start:prod"]
