FROM php:8.3-fpm

# Dependências do sistema + extensões PHP (inclui pdo_sqlite para o banco SQLite).
# Limpa o cache do apt na mesma layer para manter a imagem enxuta.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libzip-dev zip unzip git curl libpng-dev libsqlite3-dev \
    && docker-php-ext-install zip pdo pdo_sqlite pdo_mysql \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

RUN composer install --no-interaction --prefer-dist

# Entrypoint: bootstrap idempotente (.env, key, migrate, seed opcional) e exec do CMD.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
