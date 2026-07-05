#!/bin/sh
# Bootstrap idempotente do backend Laravel dentro do container.
# Garante .env, APP_KEY, banco SQLite, migrations e (opcionalmente) seed,
# depois entrega o processo servidor como PID 1 via `exec`.
set -e

# 1. .env (a partir do exemplo, se ainda não existir)
if [ ! -f .env ]; then
    cp .env.example .env
fi

# 2. APP_KEY (só gera se ainda não houver uma)
if ! grep -q '^APP_KEY=base64:' .env; then
    php artisan key:generate --force
fi

# 3. Banco SQLite (arquivo precisa existir para o Laravel conectar)
touch database/database.sqlite

# 4. Migrations (idempotente)
php artisan migrate --force

# 5. Seed: por padrão sim; APP_SEED=false pula.
if [ "${APP_SEED:-true}" = "true" ]; then
    php artisan db:seed --force
fi

# 6. Entrega o CMD (php artisan serve) como PID 1 → sinais/encerramento limpos.
exec "$@"
