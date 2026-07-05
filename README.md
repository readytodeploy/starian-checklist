# 📝 Todo List — Refatoração Fullstack (Angular + Laravel)

> **Avaliação técnica — Starian** · Vaga: Desenvolvedor Sênior
> Refatoração de uma *Todo List* de código legado para uma arquitetura limpa,
> testada e documentada.

**Autor:** Pedro Antonio Vargas Lopez — Senior Software Engineer · 📧 pedroanto.94@gmail.com

---

## Sobre o projeto

Monorepo com uma aplicação de tarefas (**listar, criar, remover**): uma API REST em
**Laravel** e um cliente em **Angular**. O ponto de partida era um projeto propositalmente
cheio de más práticas; o objetivo foi **refatorá-lo** — sem mudar a funcionalidade —
melhorando estrutura, legibilidade, segurança, testes e responsividade.

---

## Estrutura

```
.
├── backend/            # API Laravel 11 (ver backend/README.md)
├── frontend/           # App Angular 17 (ver frontend/README.md)
├── spec/               # Especificações (SDD) por domínio: backend, frontend, infra
└── docker-compose.yml  # Orquestra backend + frontend
```

Documentação detalhada de cada parte:
- **Backend** → [`backend/README.md`](backend/README.md)
- **Frontend** → [`frontend/README.md`](frontend/README.md)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | PHP 8.2 · Laravel 11 · SQLite · OpenAPI/Swagger (l5-swagger) |
| Frontend | Angular 17 · TypeScript · signals · Prettier |
| Infra | Docker · docker-compose |

---

## Como executar

### Opção A — Stack completo com Docker

Um comando na raiz sobe backend + frontend (o entrypoint cuida de `.env`, banco,
migrations e seed):

```bash
docker compose up --build
```

- Frontend: http://localhost:4200
- API: http://localhost:8000/api/tarefas
- Swagger: http://localhost:8000/api/documentation

Por padrão o banco é **semeado** (3 tarefas). Para subir **sem seed**:
`APP_SEED=false docker compose up`.

### Opção B — Local, sem Docker

Precisa de **PHP 8.2+**, **Composer**, **Node 18+**, **npm** e **Google Chrome** (para os testes do front).

**1. Backend** (terminal 1):

```bash
cd backend
composer install                 # no PHP 8.5, use: composer install --ignore-platform-req=php
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed        # cria as tabelas e semeia 3 tarefas (omita --seed p/ banco vazio)
php artisan serve                 # API em http://localhost:8000
```

**2. Frontend** (terminal 2):

```bash
cd frontend
npm install
npm start                         # app em http://localhost:4200
```

> O frontend consome `http://localhost:8000/api` (definido em `frontend/src/environments/environment.ts`).
> Suba o backend **antes**; caso contrário a lista aparece vazia com mensagem de erro.

---

## Metodologia

- **SDD (Spec-Driven Development):** cada domínio é especificado primeiro em
  [`spec/`](spec) (backend, frontend, infra), fonte de verdade da implementação.
- **TDD (test-first):** uma rede de segurança de testes é escrita **antes** de refatorar,
  garantindo que o comportamento não quebre a cada passo.
- **Git-flow:** um branch por fase (`fase_[n]_[área]_feature`) → merge em `development` →
  `main`, com commits no padrão Conventional Commits.

---

## Testes

```bash
cd backend  && php artisan test                                   # API (feature tests)
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless # componentes, serviço e fluxo
```

---

## Antes e depois

Cada **objetivo da avaliação** e o que ele virou na prática (o detalhe por área vem logo abaixo):

| Objetivo (do desafio) | O que foi entregue | Ver detalhe |
|-----------------------|--------------------|-------------|
| Identificar más práticas e problemas técnicos | Diagnóstico documentado: **11** pontos no backend, **20** no frontend e os da infra, cada um mapeado a uma correção | tabelas abaixo + [`spec/`](spec) |
| Refatorar front e back (qualidade, manutenibilidade, boas práticas) | *closures* + JSON → Controller/Eloquent/Swagger; *god component* → componentes tipados; **testes** dos dois lados + Prettier | Backend / Frontend |
| Separar responsabilidades, arquitetura limpa e moderna | Backend em camadas (rota → *request* → *controller* → *model* → *resource*); frontend por feature com **`OnPush` + signals** | Backend / Frontend |
| Garantir que a aplicação continue funcionando | **Test-first** validado a cada fase; correção do contrato `/api`; `docker compose up` funcional | Infra |
| Escrever código claro, coeso e consistente | Sem `any`, **Conventional Commits** + **git-flow**, *specs* como fonte de verdade, **Prettier** | Backend / Frontend |
| Garantir responsividade | SCSS com `@media`: formulário empilha no mobile, títulos quebram, container adaptativo | Frontend |

### Backend

| Antes (legado) | Depois (refatorado) |
|----------------|---------------------|
| Toda a lógica em *closures* e funções globais no `routes/api.php` | `TaskController` (index/store/destroy); rotas só declaram o recurso |
| Persistência em arquivo `storage/tarefas.json` | **Eloquent** + SQLite (migration, factory, seeder) |
| `POST` sem validação (aceitava qualquer coisa) | `StoreTaskRequest` (`required`, `string`, `max:255`) → `422` |
| `DELETE` retornava sempre `204` | Route-model binding → `404` quando não existe |
| CORS liberado a qualquer origem (`*`) com middleware caseiro | `HandleCors` nativo restrito a `localhost:4200` |
| Rotas web e API misturadas (`require` em `web.php`) | Recurso em `routes/api.php` sob o prefixo `/api` |
| Resposta sem formato consistente | `TaskResource` (envelope `data`) |
| Listagem com ordem indefinida (`created_at` empatado) | Ordenação determinística por **`id desc`** |
| Sem testes | Suíte de *feature* (regressão + comportamento-alvo) |
| Sem documentação | **OpenAPI/Swagger** em `/api/documentation` |

### Frontend

| Antes (legado) | Depois (refatorado) |
|----------------|---------------------|
| Tudo em `AppComponent` (dados + HTTP + UI) | Componentes **standalone** (form/list/item) + `TodoService` |
| `any` em todo lado | Modelo `Todo` tipado (`strict`) |
| URL `http://localhost:8000/tarefas` (**quebrada**) | `environments` → `/api/tarefas` |
| `HttpClientModule` (deprecado) | `provideHttpClient()` |
| `subscribe(next, error)` (deprecado) | *observer object* + **signals** |
| Dados "fake" no erro (escondia falhas) | Mensagem de erro na UI; estado reflete o servidor |
| Estilos inline, não responsivo | SCSS por componente + `@media` responsivo |
| `*ngIf` / `*ngFor` | `@if` / `@for (… ; track id)` / `@empty` |
| Change detection padrão | **`OnPush`** + signals |
| Sem validação nem feedback | Validação (obrigatório, limite 255) com tooltip e mensagens |
| Sem testes / sem formatador | 29 testes (fluxo + serviço + componentes) · **Prettier** |

### Infra

| Antes (legado) | Depois (refatorado) |
|----------------|---------------------|
| `working_dir` inconsistente; `version` obsoleta | Paths consistentes (`/var/www`, `/app`); sem `version` |
| Faltava a extensão `pdo_sqlite` (usava `pdo_mysql`) | `pdo_sqlite` instalada no `Dockerfile` |
| Backend não inicializava no container | **Entrypoint** idempotente (`.env`, `APP_KEY`, `migrate`, seed) |
| `docker compose up` não subia o stack | Sobe backend + frontend com um comando (+ `APP_SEED` opcional) |

---

## 🧭 Recomendações e backlog

Itens **fora do escopo** desta refatoração, mas detectados durante o trabalho — priorizados:

1. **Endpoint para alternar o status da tarefa (`completed`).**
   A coluna `completed` já existe no modelo/banco, mas **não há endpoint** para atualizá-la
   (o recurso expõe só `index`/`store`/`destroy`). Propor `PATCH /api/tarefas/{id}` (ou uma rota
   de *toggle*) com `UpdateTaskRequest`, e no frontend um **checkbox** por item para marcar
   concluída/pendente. É a evolução funcional mais natural.

2. **Paginação (backend + frontend).**
   Hoje o `GET /api/tarefas` devolve **todos** os registros. Para listas grandes, adotar
   `Task::paginate()` no backend (com `meta`/`links`) e, no frontend, controles de página ou
   *scroll* infinito — consulta mais **performática** e previsível.

3. **Melhorias de UI/UX.**
   - Confirmação ao remover (evita exclusão acidental).
   - Feedback de sucesso (ex.: *toast* ao criar/remover).
   - Foco automático no campo ao carregar; contador de tarefas.
   - Filtros (todas / pendentes / concluídas) — depende do item 1.

4. **Qualidade e automação (planejado).**
   - **ESLint** (angular-eslint) integrado ao Prettier.
   - Testes **E2E** (Playwright/Cypress) do fluxo real.
   - **CI** (rodar `php artisan test` + `ng test`/`ng lint` a cada push).
   - Interceptor HTTP no frontend para **tratamento de erro centralizado**.

---

## Documentação

- Especificações (SDD): [`spec/backend`](spec/backend), [`spec/frontend`](spec/frontend), [`spec/infra`](spec/infra).
- API interativa: Swagger em `/api/documentation`.
