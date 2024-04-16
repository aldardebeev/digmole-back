FROM composer:2.1.9 as vendor
WORKDIR app
COPY . .
RUN composer install \
    --ignore-platform-reqs \
    --no-interaction \
    --no-plugins \
    --no-scripts \
    --prefer-dist


FROM harbor.smw.team/server-base/unit:1.27.0-php8.1
WORKDIR /var/www/html
ARG STAGE=develop
COPY --from=vendor /app/* .

RUN cp .deploy/$STAGE/config.json . &&\
    cp .deploy/$STAGE/config.json /docker-entrypoint.d/config.json && \
    cp .deploy/$STAGE/.env . && \
    chmod -R 777 /var/www/html/storage && \
    chmod -R 777 /var/www/html/bootstrap && \
    rm -rf .deploy .git
