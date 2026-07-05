# Orquestração Docker — Infra

> Fazer com que `docker compose up --build` suba backend (Laravel) + frontend (Angular) funcionando, sem passos manuais. · Estado: em progresso (Fase 6) · Fecha: 2026-07-05 · Autor: Pedro Vargas
> Referencias: spec/backend/tarefas-api.md · issue #—

## 0. Estado e avanço

| Fase | Escopo | Branch | Status |
|------|--------|--------|--------|
| 6 | Infra: corrigir `docker-compose` e Dockerfiles para subir o stack completo | `backend_fase_6_infra` | 🚧 em andamento |

---

## 1. Contexto y objetivo
<!-- Qué problema resolvemos, para quién, por qué ahora. -->
O repositório traz um `docker-compose.yml` e dois `Dockerfile` (backend e frontend), mas o stack **não sobe corretamente**: os caminhos de trabalho estão inconsistentes, falta a extensão PHP para SQLite e o backend não é inicializado (sem `APP_KEY`/banco). Hoje o caminho confiável é o arranque manual (ver READMEs).

O objetivo desta fase é deixar `docker compose up --build` como um comando único e funcional: sobe a API do backend em `:8000` (com Swagger) e o dev server do frontend em `:4200`, sem intervenção manual.

### Diagnóstico (estado atual)

| # | Problema | Local |
|---|----------|-------|
| I1 | `working_dir: /backend` diverge do destino do volume (`/var/www`) e do `WORKDIR /backend` do Dockerfile — três caminhos inconsistentes | `docker-compose.yml`, `backend/Dockerfile` |
| I2 | Dockerfile do backend instala `pdo_mysql`, mas o projeto usa **SQLite** — falta `pdo_sqlite` | `backend/Dockerfile` |
| I3 | Backend não é inicializado no container: sem `.env`, `APP_KEY`, arquivo SQLite nem `migrate` | `backend/Dockerfile` / entrypoint |
| I4 | Frontend: volume monta em `/app`, mas o Dockerfile usa `WORKDIR /frontend` — mismatch | `docker-compose.yml`, `frontend/Dockerfile` |
| I5 | `version: '3.8'` é obsoleto no Compose v2 | `docker-compose.yml` |

---

## 2. Dominio y lenguaje ubicuo
<!-- Entidades y términos. -->
- **Serviço `backend`:** container PHP/Laravel que serve a API (`php artisan serve`).
- **Serviço `frontend`:** container Node/Angular que serve o dev server (`ng serve`).
- **Volume (bind mount):** mapeia o código do host para dentro do container.
- **`working_dir` / `WORKDIR`:** diretório onde o comando roda; deve coincidir com o destino do volume.
- **Portas:** `8000` (backend) e `4200` (frontend), publicadas no host.

---

## 3. Reglas de negocio
<!-- Afirmaciones verificables. -->
- RI1: `docker compose up --build` sobe **ambos** os serviços sem passos manuais.
- RI2: por serviço, o destino do volume, o `working_dir` do compose e o `WORKDIR` do Dockerfile são **o mesmo caminho** (backend: `/var/www`; frontend: `/app`).
- RI3: o backend expõe a API em `http://localhost:8000/api/tarefas` e o Swagger em `http://localhost:8000/api/documentation`.
- RI4: o frontend expõe o dev server em `http://localhost:4200`.
- RI5: a imagem do backend inclui a extensão `pdo_sqlite`.
- RI6: o backend arranca já configurado — `.env`, `APP_KEY`, `database.sqlite` e `migrate` aplicados automaticamente antes de servir, por um **entrypoint idempotente**.
- RI7: o `docker-compose.yml` não declara a chave `version` (obsoleta no Compose v2).
- RI8: **por padrão, o entrypoint executa as seeds** (`migrate --seed`). É possível subir o container **sem semear** definindo `APP_SEED=false` (forma opcional). `APP_SEED=true` é o default.
- RI9: o processo servidor é **PID 1** (entrypoint termina com `exec`), para encerramento limpo (`SIGTERM`/`Ctrl-C`).
- RI10: o backend expõe um **healthcheck** (`/up`); o container só é considerado saudável quando a API responde.

---

## 4. Entradas / Salidas / Errores
- **Entradas:**
  - `docker compose up --build` — sobe o stack **com seed** (padrão).
  - `APP_SEED=false docker compose up` — forma **opcional**, sobe **sem** semear.
- **Salidas:**
  - Dois containers em execução (backend, frontend).
  - `GET /up` → `200`; `GET /api/tarefas` → `200`; `/api/documentation` → `200`; `:4200` → `200`.
- **Errores a eliminar:**
  - Container do backend falha/reinicia por `working_dir` inexistente.
  - `could not find driver` (SQLite) por falta de `pdo_sqlite`.
  - `No application encryption key` por falta de `APP_KEY`.

---

## 5. Contratos
```yaml
# docker-compose.yml (sem 'version')
services:
  backend:
    build: { context: ./backend }
    working_dir: /var/www              # == destino do volume == WORKDIR do Dockerfile
    volumes:
      - ./backend:/var/www
      - backend_vendor:/var/www/vendor # named volume: o bind mount não apaga o vendor da imagem
    ports: [ "8000:8000" ]
    environment:
      APP_SEED: ${APP_SEED:-true}      # seed por padrão; APP_SEED=false para pular
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/up"]
      interval: 10s
      timeout: 3s
      retries: 5
    # entrypoint (docker-entrypoint.sh) faz o bootstrap e no fim: exec "$@"
  frontend:
    build: { context: ./frontend }
    working_dir: /app                  # == destino do volume == WORKDIR do Dockerfile
    volumes:
      - ./frontend:/app
      - frontend_node_modules:/app/node_modules
    ports: [ "4200:4200" ]

volumes:
  backend_vendor:
  frontend_node_modules:
```

**Fluxo do entrypoint do backend** (`docker-entrypoint.sh`, idempotente):

```sh
#!/bin/sh
set -e
[ -f .env ] || cp .env.example .env          # 1. .env
grep -q '^APP_KEY=base64' .env || php artisan key:generate   # 2. APP_KEY
touch database/database.sqlite               # 3. banco SQLite
php artisan migrate --force                  # 4. migrations (idempotente)
[ "${APP_SEED:-true}" = "true" ] && php artisan db:seed --force   # 5. seed opcional
exec "$@"                                     # 6. entrega o CMD como PID 1 (artisan serve)
```

---

## 6. Invariantes
- II1: para cada serviço, `volume destino == working_dir == WORKDIR` (caminho único e consistente).
- II2: a imagem do backend tem os drivers PDO que o `.env` exige (aqui, `pdo_sqlite`).
- II3: `migrate` e o `TaskSeeder` são **idempotentes** — reiniciar o container não duplica dados nem falha (o seeder usa `firstOrCreate`).

---

## 7. Escenarios (BDD)
```
Escenario: Subir o stack completo
  Given o repositório clonado
  When  ejecuto `docker compose up --build`
  Then  os serviços backend e frontend ficam "up"
  And   nenhum container entra em restart-loop

Escenario: API disponível
  Given o stack rodando
  When  GET http://localhost:8000/api/tarefas
  Then  status 200 e corpo JSON { data: [...] }

Escenario: Swagger disponível
  Given o stack rodando
  When  GET http://localhost:8000/api/documentation
  Then  status 200

Escenario: Frontend disponível
  Given o stack rodando
  When  GET http://localhost:4200
  Then  status 200

Escenario: Seed por padrão
  Given nenhuma variável APP_SEED definida
  When  `docker compose up --build`
  Then  o banco contém as 3 tarefas iniciais (TaskSeeder)

Escenario: Subir sem seed (opcional)
  Given APP_SEED=false
  When  `APP_SEED=false docker compose up`
  Then  as migrations rodam
  And   o banco NÃO é semeado (0 tarefas)

Escenario: Reinício idempotente
  Given o stack já subiu uma vez (com seed)
  When  reinicio o container
  Then  não há erro de migration nem tarefas duplicadas
```

---

## 8. Ejemplos
| entrada | resultado esperado |
|---------|--------------------|
| `docker compose up --build` | backend + frontend "up" e **semeado** (3 tarefas), sem passos manuais |
| `APP_SEED=false docker compose up` | stack "up", migrations aplicadas, **sem** semear (0 tarefas) |
| `curl localhost:8000/up` | `200` |
| `curl localhost:8000/api/tarefas` | `200` `{ "data": [...] }` |
| `curl -I localhost:4200` | `200` |

---

## 9. Eventos            <!-- si aplica -->
No aplica.

## 10. Modelo de estados  <!-- si aplica -->
No aplica (ciclo de vida padrão de containers).

## 11. Decisiones (ADR)
- ADR-I1: padronizar o diretório do backend em **`/var/www`** (volume, `working_dir` e `WORKDIR`).
- ADR-I2: padronizar o diretório do frontend em **`/app`** (volume, `working_dir` e `WORKDIR`).
- ADR-I3: adicionar **`pdo_sqlite`** às extensões do `backend/Dockerfile` (e manter/retirar `pdo_mysql` conforme uso).
- ADR-I4: **entrypoint** do backend (`docker-entrypoint.sh`) que garante `.env`, `APP_KEY`, `database.sqlite` e `migrate --force`, e termina com `exec "$@"` para entregar o CMD como PID 1 (sinais limpos).
- ADR-I5: **remover a chave `version`** do `docker-compose.yml` (obsoleta no Compose v2).
- ADR-I6: renomear os serviços para `backend`/`frontend` (mais claros que `laravel`/`angular`) — opcional.
- ADR-I7: **seed por padrão, desativável** — o entrypoint roda `db:seed --force` quando `APP_SEED` (default `true`); `APP_SEED=false` pula o seed. Wired no compose via `environment: APP_SEED: ${APP_SEED:-true}`. Seeder idempotente (`firstOrCreate`).
- ADR-I8: **healthcheck** no backend (`curl -f /up`); permite `depends_on: condition: service_healthy` e status real no `docker compose ps`.
- ADR-I9: **`.dockerignore`** em cada serviço para não copiar `vendor/`, `node_modules/`, `.env`, `.git`, `storage/*.sqlite` para o contexto/imagem (build menor e sem vazar segredos).
- ADR-I10: **volumes nomeados** para `vendor/` e `node_modules/`, evitando que o bind mount do código apague as dependências instaladas na imagem (e ganho de performance no macOS).
- ADR-I11: **higiene de imagem** no `backend/Dockerfile` — `apt-get ... && rm -rf /var/lib/apt/lists/*` numa única layer; base já pinada (`php:8.3-fpm`, `node:20`).

---

## 12. Criterios de aceptación
- [ ] `docker compose up --build` sobe backend + frontend sem passos manuais (RI1) — verificação: `docker compose ps`
- [ ] Caminhos consistentes por serviço (RI2, II1) — verificação: revisão de `docker-compose.yml` + Dockerfiles
- [ ] `GET /up` e `GET /api/tarefas` → `200` (RI3, RI5, RI6) — verificação: `curl`
- [ ] Swagger UI `/api/documentation` → `200` (RI3) — verificação: `curl`
- [ ] Frontend `:4200` → `200` (RI4) — verificação: `curl`
- [ ] `docker-compose.yml` sem `version` (RI7) — verificação: leitura do arquivo
- [ ] **Seed por padrão** (RI8) — `docker compose up` → 3 tarefas em `/api/tarefas`
- [ ] **Subir sem seed** (RI8) — `APP_SEED=false docker compose up` → 0 tarefas, migrations aplicadas
- [ ] **Idempotência** (II3) — reiniciar o container não duplica dados nem falha
- [ ] **Encerramento limpo** (RI9) — `Ctrl-C` / `docker compose down` para os containers sem `SIGKILL`
- [ ] **Healthcheck** (RI10) — `docker compose ps` mostra `healthy` no backend

---

## 13. Trazabilidad
| Regla / Escenario | Verificación | Archivo |
|-------------------|--------------|---------|
| RI2, II1 / caminhos consistentes | revisão | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile` |
| RI5 / driver SQLite | `curl /api/tarefas` | `backend/Dockerfile` |
| RI6, RI9 / bootstrap + PID 1 | `docker compose up` | `backend/docker-entrypoint.sh` |
| RI8 / seed por padrão e toggle | `curl /api/tarefas` (com/sem `APP_SEED`) | `docker-entrypoint.sh`, `docker-compose.yml` |
| RI10 / healthcheck | `docker compose ps` | `docker-compose.yml` |
| II3 / idempotência | reinício | `docker-entrypoint.sh`, `TaskSeeder` |
| RI3, RI4 / serviços acessíveis | `curl` | `docker-compose.yml` |
| RI7 / sem `version` | leitura | `docker-compose.yml` |
