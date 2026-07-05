# Tarefas API — Backend

> Refatorar a API de tarefas de arquivo JSON + closures para Laravel idiomático (Controller + Eloquent + validação), preservando o CRUD. · Estado: em progresso (Fase 5) · Data: 2026-07-05 · Autor: Pedro Vargas
> Referências: spec/adr/ADR-0001-sqlite · issue #—

## 0. Estado e avanço das fases
<!-- Controle de avanço do refactor. Atualizar a cada fase. -->
| Fase | Escopo | Branch | Status |
|------|--------|--------|--------|
| 1 | Rede de segurança: spec + testes de caracterização (test-first) | `backend_fase_1_rede_de_seguranca` | ✅ concluída (mergeada em `development`) |
| 2 | Persistência: `Task` model + migration + factory (SQLite) | `backend_fase_2_persistencia` | ✅ concluída (mergeada em `development`) |
| 3 | Cutover JSON→Eloquent: Controller + FormRequest + Resource + rotas `/api` (422/404) + seed de paridade | `backend_fase_3_controller` | ✅ concluída (mergeada em `development`) |
| 4 | CORS nativo restrito a `localhost:4200` + documentação OpenAPI/Swagger (l5-swagger) | `backend_fase_4_cors_swagger` | ✅ concluída (mergeada em `development`) |
| 5 | Documentação: README do backend (metodologia SDD/TDD, arquitetura, antes/depois) | `backend_fase_5_readme` | ✅ concluída (mergeada em `development`)|

Legenda: ✅ concluída · 🚧 em andamento · ⏳ pendente

> Os critérios de aceitação (§12) só são plenamente satisfeitos após a Fase 3 (cutover). Nas Fases 1–2 os testes do Grupo A rodam contra o código legado (JSON) e o Grupo B fica *skipped*.

## 1. Contexto e objetivo
<!-- Que problema resolvemos, para quem, por que agora. 1–2 parágrafos. -->
A API de tarefas atual persiste em um arquivo `storage/tarefas.json` e implementa toda a lógica como closures no arquivo de rotas, com funções globais (`lerTarefas`/`salvarTarefas`), sem validação, sem tratamento de erros e sem camada de domínio. Isso a torna frágil, insegura (CORS `*`) e impossível de testar em processo (redeclaração de função).

O objetivo é refatorar para uma API REST idiomática do Laravel — `TaskController` + `FormRequest` + `API Resource` + persistência via Eloquent — **sem alterar o comportamento funcional** do CRUD (listar, criar, remover), e corrigindo os defeitos de contorno (validação, 404, CORS restrito). O consumidor é o frontend Angular da Todo List.

## 2. Domínio e linguagem ubíqua
<!-- Entidades e termos com sua definição. Mapeia para src/core/domain/<dominio>. -->
- **Task (Tarefa):** item da lista de afazeres. Mapeia para `App\Models\Task` (tabela `tasks`).
  - `id` (int): identificador único, gerado pelo banco.
  - `title` (string): descrição da tarefa. Obrigatório.
  - `completed` (bool): se a tarefa foi concluída. Default `false`.
  - `created_at` / `updated_at` (timestamp): gerados pelo Eloquent; `created_at` define a ordem da listagem (R3).
- **Coleção de tarefas:** lista de `Task` ordenada da mais recente para a mais antiga.

> Nota: o endpoint é exposto em português (`/api/tarefas`) por compatibilidade com o frontend; o código (model, controller) é em inglês (`Task`).

## 3. Regras de negócio
<!-- Lista numerada de afirmações verificáveis. -->
- R1: `title` é obrigatório, do tipo string, com no máximo 255 caracteres.
- R2: uma tarefa recém-criada nasce com `completed = false`.
- R3: a listagem retorna as tarefas da mais recente para a mais antiga, ordenadas por **`id desc`** (determinístico mesmo com `created_at` empatado).
- R4: o `id` é gerado pelo banco (autoincremental); o cliente não o informa na criação.
- R5: remover uma tarefa inexistente resulta em `404` (não em `204`).
- R6: a persistência é feita em banco de dados via Eloquent — nunca em arquivo.
- R7: a resposta segue o envelope de API Resource: objeto sob a chave `data`.

## 4. Entradas / Saídas / Erros
- **Entradas:**
  - `GET /api/tarefas` — sem corpo.
  - `POST /api/tarefas` — JSON `{ "title": string }`.
  - `DELETE /api/tarefas/{task}` — `task` = id no path.
- **Saídas:**
  - `GET` → `200` `{ "data": Task[] }`.
  - `POST` → `201` `{ "data": Task }`.
  - `DELETE` → `204` sem corpo.
- **Erros:**
  - `422 Unprocessable Entity` — validação falhou (ex.: `title` ausente), com `{ message, errors }`.
  - `404 Not Found` — tarefa inexistente no `DELETE`.

## 5. Contratos
```ts
interface Task {
  id: number;
  title: string;      // 1..255
  completed: boolean; // default false
}

// GET /api/tarefas
// require: —
// ensure:  200; body = { data: Task[] } ordenado por created_at desc

// POST /api/tarefas  body: { title: string }
// require: title presente, string, length 1..255
// ensure:  201; body = { data: Task } com completed=false; tarefa persistida
//          se require falha -> 422 { message, errors }

// DELETE /api/tarefas/{id}
// require: existe Task com esse id
// ensure:  204; a Task deixa de existir
//          se não existe -> 404
```

## 6. Invariantes
<!-- Regras SEMPRE verdadeiras → testes de invariante. -->
- I1: `completed` é sempre booleano (nunca `null`) em uma tarefa persistida ou serializada.
- I2: `title` de uma tarefa persistida nunca é vazio.
- I3: `id` é único entre as tarefas.

## 7. Cenários (BDD)
```
Cenário: Listar tarefas existentes
  Given existe uma tarefa "Existing task"
  When  GET /api/tarefas
  Then  status 200
  And   o corpo contém "Existing task"

Cenário: Criar tarefa válida
  Given nenhuma restrição
  When  POST /api/tarefas com { title: "Buy bread" }
  Then  status 201
  And   o corpo contém { title: "Buy bread", completed: false }
  And   a tarefa fica persistida no banco

Cenário: Criar tarefa sem título
  Given nenhuma restrição
  When  POST /api/tarefas com {}
  Then  status 422
  And   errors.title está presente

Cenário: Remover tarefa existente
  Given existe uma tarefa com id X
  When  DELETE /api/tarefas/X
  Then  status 204
  And   a tarefa com id X não existe mais

Cenário: Remover tarefa inexistente
  Given não existe tarefa com id 999999
  When  DELETE /api/tarefas/999999
  Then  status 404
```

## 8. Exemplos
| entrada | resultado esperado |
|---------|--------------------|
| `POST { "title": "Buy bread" }` | `201` `{ "data": { "id": 1, "title": "Buy bread", "completed": false } }` |
| `POST { }` | `422` `{ "message": "...", "errors": { "title": [...] } }` |
| `GET /api/tarefas` (1 tarefa) | `200` `{ "data": [ { "id": 1, "title": "Buy bread", "completed": false } ] }` |
| `DELETE /api/tarefas/1` (existe) | `204` sem corpo |
| `DELETE /api/tarefas/999999` (não existe) | `404` |

## 9. Eventos            <!-- se aplicável -->
Não se aplica — a API é CRUD stateless, sem event sourcing nem eventos de domínio publicados.

## 10. Modelo de estados  <!-- se aplicável -->
```
(inexistente) --POST--> [completed=false] --DELETE--> (inexistente)
```
Transição `completed=false → completed=true` (marcar concluída) **fora do escopo** desta iteração: o recurso expõe apenas `index`, `store` e `destroy` (sem `update`).

## 11. Decisões (ADR)   <!-- se aplicável -->
- ADR-0001: usar **SQLite** como banco (zero setup para o teste técnico).
- ADR-0002: prefixar rotas com **`/api`** e movê-las para `routes/api.php` (habilitado em `bootstrap/app.php`).
- ADR-0003: padronizar respostas com **`TaskResource`** (envelope `data`).
- ADR-0004: **CORS nativo** via `config/cors.php`, restrito a `http://localhost:4200` (remover middleware caseiro).
- ADR-0005: **seed de paridade** via `TaskSeeder` reproduzindo as 3 tarefas iniciais do antigo `tarefas.json`. Idempotente (`firstOrCreate` por `title`). Executado sob demanda (`php artisan db:seed` / `migrate --seed`), **não** automaticamente nos testes (`RefreshDatabase` não semeia), preservando o determinismo da suíte.
- ADR-0006: **documentação OpenAPI** via `darkaonline/l5-swagger` com atributos PHP 8 (`OpenApi\Attributes`) no controller/resource. Swagger UI em `/api/documentation`, JSON em `/docs`. `L5_SWAGGER_GENERATE_ALWAYS=true` regenera sob demanda; o JSON gerado (`storage/api-docs`) é gitignored (não versionado).
- ADR-0007: **pin de `l5-swagger` em `~10.0.0`** (swagger-php 5) para manter compatibilidade com **PHP 8.2/8.3**. As versões `10.1+`/`11.x` usam swagger-php 6 → `symfony/type-info` → exige PHP ≥ 8.4.1. Reavaliar se o runtime subir para 8.4+.

## 12. Critérios de aceitação
- [x] Listar retorna 200 com as tarefas (R3, R7) — test: `test_list_returns_200_with_tasks`
- [x] Criar tarefa válida retorna 201 e persiste (R2, R4, R6, R7) — test: `test_create_persists_task`
- [x] Criar sem título retorna 422 (R1) — test: `test_create_without_title_returns_422`
- [x] Remover tarefa existente retorna 204 e apaga (R6) — test: `test_delete_existing_task_removes_it`
- [x] Remover inexistente retorna 404 (R5) — test: `test_delete_missing_task_returns_404`
- [x] CORS restrito a localhost:4200 (ADR-0004) — verificação: header `Access-Control-Allow-Origin`
- [x] API documentada em OpenAPI/Swagger (ADR-0006) — verificação: `/api/documentation` (200) e `/docs` (JSON)

## 13. Rastreabilidade
| Regra / Cenário | Teste | Arquivo de código |
|-------------------|------|-------------------|
| R1 / Criar sem título | `test_create_without_title_returns_422` | `app/Http/Requests/StoreTaskRequest.php` |
| R2, R4, R6 / Criar válida | `test_create_persists_task` | `app/Http/Controllers/TaskController.php@store`, `app/Models/Task.php` |
| R3, R7 / Listar | `test_list_returns_200_with_tasks` | `app/Http/Controllers/TaskController.php@index`, `app/Http/Resources/TaskResource.php` |
| R5 / Remover inexistente | `test_delete_missing_task_returns_404` | `routes/api.php` (route-model binding) |
| R6 / Remover existente | `test_delete_existing_task_removes_it` | `app/Http/Controllers/TaskController.php@destroy` |
| ADR-0004 / CORS | (verificação HTTP) | `config/cors.php`, `bootstrap/app.php` |
