# Tarefas API — Backend

> **Avaliação técnica — Starian** · Vaga: Desenvolvedor Sênior
> Demonstra arquitetura, refatoração, boas práticas de engenharia e qualidade de código.

**Autor:** Pedro Antonio Vargas Lopez — Senior Software Engineer · 📧 pedroanto.94@gmail.com

---

## O que este projeto faz?

API REST de uma *Todo List* construída com **Laravel 11** e **PHP 8.2**. Expõe um CRUD mínimo de tarefas — **listar, criar e remover** — com validação, respostas consistentes via *API Resources*, CORS restrito e documentação OpenAPI/Swagger.

É o resultado de uma refatoração que levou o código legado (*closures* com persistência em arquivo JSON) a uma arquitetura **Controller + Form Request + API Resource + Eloquent**, coberta por uma rede de segurança de testes.

---

## Metodologia

A refatoração se apoiou em duas práticas:

- **SDD — Spec-Driven Development:** o contrato da API foi definido primeiro no [spec](../spec/backend/tarefas-api.md) (domínio, regras de negócio, invariantes, cenários e critérios de aceitação), que serviu de fonte de verdade para a implementação.
- **TDD — test-first:** antes de tocar o código legado, foi construída uma rede de segurança de testes (regressão + comportamento-alvo). Cada fase foi validada contra essa rede, garantindo que o CRUD continuasse funcionando durante todo o refactor.

---

## Arquitetura

API REST em camadas, seguindo as convenções do Laravel. Cada requisição atravessa:

```
Request
  └─▶ routes/api.php          · apiResource sob o prefixo /api
        └─▶ StoreTaskRequest  · validação de entrada (→ 422)
              └─▶ TaskController · orquestração (sem lógica nas rotas)
                    └─▶ Task    · modelo Eloquent (SQLite)
                          └─▶ TaskResource · resposta normalizada ({ data })
```

- **Apresentação:** controllers enxutos + *API Resources* para respostas consistentes.
- **Validação:** *Form Requests* isolam as regras de entrada.
- **Domínio / Persistência:** modelo `Task` com Eloquent sobre SQLite.
- **Transversal:** CORS nativo (`config/cors.php`) e documentação OpenAPI por atributos.

---

## Antes e depois da refatoração

| Antes (legado) | Depois (refatorado) |
|---|---|
| Lógica em *closures* e funções globais em `routes/api.php` | `TaskController` (index / store / destroy); as rotas só declaram o recurso |
| Persistência em `storage/tarefas.json` | **Eloquent** + SQLite (migration, factory, seeder) |
| `POST` sem validação (aceitava qualquer coisa) | `StoreTaskRequest` → `422` |
| `DELETE` retornava sempre `204` | Route-model binding → `404` se não existe |
| CORS aberto a qualquer origem (`*`) com middleware próprio | `HandleCors` nativo restrito a `localhost:4200` |
| Rotas web e API misturadas (`require` em `web.php`) | Recurso em `routes/api.php` sob o prefixo `/api` |
| Resposta sem formato consistente | `TaskResource` (envelope `data`) |
| Sem testes automatizados | Rede de segurança de *feature* (regressão + alvo) |
| Sem documentação | OpenAPI/Swagger em `/api/documentation` |

---

## Stack

| Componente | Versão |
|---|---|
| PHP | `^8.2` |
| Laravel | 11.x |
| Banco de dados | SQLite (padrão) |
| Documentação da API | `darkaonline/l5-swagger` `~10.0.0` (swagger-php 5) |
| Testes | PHPUnit (`php artisan test`) |

> ⚠️ **Sobre o `l5-swagger`:** fixado em `~10.0.0` **de propósito**. As versões `10.1+`/`11.x` usam `swagger-php 6`, que traz `symfony/type-info` e **exige PHP ≥ 8.4.1**. Fixar `~10.0.0` (swagger-php 5) mantém a compatibilidade com PHP 8.2/8.3. Não mudar para `^10.0` nem `^11.1` sem subir a versão do PHP. Ver [Notas técnicas](#notas-técnicas).

---

## Instalação e configuração local — Como instalo?

> Requisitos: **PHP 8.2** (ou 8.3) com as extensões habituais do Laravel (`pdo`, `pdo_sqlite`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`) e [Composer](https://getcomposer.org/) 2.x.

Todos os comandos a partir da pasta `backend/`:

```bash
# 1. Dependências (usa o lock — NÃO use "composer update", ver Notas técnicas)
composer install

# 2. Variáveis de ambiente
cp .env.example .env
php artisan key:generate

# 3. Banco de dados SQLite
touch database/database.sqlite
php artisan migrate --seed          # cria as tabelas e semeia 3 tarefas iniciais
```

> O `.env.example` já traz `DB_CONNECTION=sqlite`, então não é preciso configurar MySQL para começar.
> Omita `--seed` se preferir iniciar com o banco vazio.

---

## Como executo?

### Local

```bash
php artisan serve                   # http://localhost:8000
```

- API: `http://localhost:8000/api/tarefas`
- Swagger UI: `http://localhost:8000/api/documentation`

### Docker (stack completo)

A partir da **raiz do repositório** sobe backend + frontend:

```bash
docker compose up --build
```

- Backend: http://localhost:8000 · Frontend: http://localhost:4200 · Swagger: http://localhost:8000/api/documentation

> ⚠️ O `docker-compose.yml` ainda tem ajustes pendentes da fase de infraestrutura (ex.: `working_dir`). Enquanto isso, o arranque **local** acima é o caminho verificado.

---

## Como testo?

Rede de segurança do CRUD (regressão + comportamento-alvo do refactor), com `RefreshDatabase` e `TaskFactory`:

```bash
php artisan test
```

Cobre: `200` ao listar, `201` ao criar, `422` sem `title`, `204` ao remover existente e `404` ao remover inexistente.

---

## API — endpoints e exemplos

Base URL: `http://localhost:8000/api`

| Método | Rota | Descrição | Sucesso | Erros |
|---|---|---|---|---|
| `GET` | `/tarefas` | Lista todas as tarefas (mais recentes primeiro) | `200` | — |
| `POST` | `/tarefas` | Cria uma tarefa | `201` | `422` sem `title` |
| `DELETE` | `/tarefas/{id}` | Remove uma tarefa | `204` | `404` se não existe |

As respostas vêm envelopadas em `data` (via `TaskResource`).

### Modelo `Task`

```json
{
  "id": 1,
  "title": "Comprar pão",
  "completed": false
}
```

### Exemplos

**Listar**

```bash
curl http://localhost:8000/api/tarefas
```
```json
{ "data": [ { "id": 1, "title": "Comprar pão", "completed": false } ] }
```

**Criar** (`title` é obrigatório, `string`, `max:255`)

```bash
curl -X POST http://localhost:8000/api/tarefas \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"title": "Comprar pão"}'
```
```json
{ "data": { "id": 1, "title": "Comprar pão", "completed": false } }
```

Sem `title` retorna `422`:
```json
{ "message": "The title field is required.", "errors": { "title": ["The title field is required."] } }
```

**Remover**

```bash
curl -X DELETE http://localhost:8000/api/tarefas/1   # 204 se existe, 404 se não
```

### Documentação (Swagger / OpenAPI)

A API está anotada com atributos OpenAPI (`#[OA\...]`) no controller e no resource.

- **UI:** http://localhost:8000/api/documentation
- **JSON:** http://localhost:8000/docs

Regenerar a especificação após alterar anotações:

```bash
php artisan l5-swagger:generate
```

### CORS

Configurado em [`config/cors.php`](config/cors.php) com o CORS nativo do Laravel (sem middleware próprio):

- **Origens permitidas:** `http://localhost:4200` (o frontend Angular)
- **Métodos:** `GET`, `POST`, `DELETE`, `OPTIONS`
- **Paths:** `api/*`

Para permitir outra origem, edite `allowed_origins`.

---

## Como está organizado?

```
app/
├── Http/
│   ├── Controllers/TaskController.php   # index / store / destroy (+ anotações OpenAPI)
│   ├── Requests/StoreTaskRequest.php    # validação: title required|string|max:255
│   └── Resources/TaskResource.php       # resposta consistente { id, title, completed }
├── Models/Task.php                      # fillable, cast completed:boolean, default completed=false
database/
├── migrations/..._create_tasks_table.php
├── factories/TaskFactory.php
└── seeders/TaskSeeder.php               # 3 tarefas iniciais (idempotente)
routes/api.php                           # Route::apiResource('tarefas')->only([index,store,destroy])
config/cors.php                          # CORS restrito ao front
tests/Feature/TarefasApiTest.php         # rede de segurança do CRUD
```

Decisões-chave do refactor (detalhe no [spec](../spec/backend/tarefas-api.md)):

- **Sem lógica nas rotas:** tudo vive no `TaskController`; `routes/api.php` só declara o recurso.
- **Persistência real:** Eloquent + migration, no lugar do antigo `storage/tarefas.json`.
- **Validação explícita:** `StoreTaskRequest` → `422` automático sem `title`.
- **`404` correto ao remover:** route-model binding (`destroy(Task $task)`) no lugar do `204` incondicional anterior.
- **Resposta consistente:** `TaskResource` envelopa a saída em `data`.
- **CORS nativo restrito:** removido o middleware próprio com `Access-Control-Allow-Origin: *`.

> Nota: a rota usa o nome `tarefas`, mas o parâmetro é mapeado para `task` (`->parameters(['tarefas' => 'task'])`) para casar com o route-model binding `destroy(Task $task)`.

---

## Notas técnicas

### Por que NÃO usar `composer update` neste projeto

No momento, `laravel/framework` (toda a faixa instalável) está marcado com *security advisories*. O Composer **bloqueia a resolução** quando precisa recarregar o Laravel do zero, que é justamente o que o `composer update` faz. Já o `composer install` lê do `composer.lock` e **não** re-resolve o Laravel, então funciona sem problemas.

- ✅ Use **`composer install`** (instala a partir do lock).
- ❌ Evite **`composer update`** puro / com `-W` enquanto houver esses advisories.
- Para atualizar uma dependência pontual sem tocar no Laravel: `composer update <pacote> --with-dependencies`.

### Compatibilidade de PHP e `l5-swagger`

O `l5-swagger` está fixado em `~10.0.0` porque usa `swagger-php 5` (sem `symfony/type-info`), compatível com PHP 8.2/8.3. Subir para `10.1+`/`11.x` traria `swagger-php 6` → `symfony/type-info` → **PHP ≥ 8.4.1**. Se no futuro o runtime subir para PHP 8.4+, dá para voltar a `^11.1`.
