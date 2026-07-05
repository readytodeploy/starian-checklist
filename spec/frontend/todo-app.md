# Todo App — Frontend

> Refatorar o frontend Angular da Todo List de um *god component* (`any`, estilos inline, dados "fake", URL errada) para uma arquitetura moderna (serviço + componentes + signals), consumindo `/api/tarefas` e responsiva, **sem alterar a funcionalidade**. · Estado: em progresso (Fase 10) · Data: 2026-07-05 · Autor: Pedro Vargas
> Referências: spec/backend/tarefas-api.md · issue #—

## 0. Estado e avanço das fases

| Fase | Escopo | Branch | Status |
|------|--------|--------|--------|
| 7 | Rede de segurança (test-first) + este spec | `fase_7_frontend_rede_de_seguranca` | ✅ concluída (mergeada em `development`) |
| 8 | Modelo `Todo` + `TodoService` + `provideHttpClient` + environments (fix `/api`) | `fase_8_frontend_datos` | ✅ concluída (mergeada em `development`) |
| 9 | Componentes (form/list/item) + signals + control flow moderno + testes por componente | `fase_9_frontend_componentes` | ✅ concluída (mergeada em `development`) |
| 10 | Responsividade + Prettier (formatação de código) | `fase_10_frontend_responsividade_e_format` | 🚧 em andamento |
| 11 | ESLint (angular-eslint) + verificação final (ng test / docker) | — | ⏳ pendente |

Legenda: ✅ concluída · 🚧 em andamento · ⏳ pendente

> A rede de segurança (Fase 7) fixa o *happy path* e deve **sobreviver** à extração de serviço e componentes (Fases 8–9). Se um teste ficar vermelho por causa da refatoração, o comportamento mudou.

---

## 1. Contexto e objetivo
<!-- Que problema resolvemos, para quem, por que agora. -->
O frontend atual concentra tudo em `AppComponent`: tipos `any`, HTTP embutido, estilos inline, sem componentes nem testes. Pior: chama `http://localhost:8000/tarefas`, mas o backend refatorado serve em **`/api/tarefas`** — a app está **quebrada end-to-end** e mascara isso com um *fallback* de dados inventados.

O objetivo é refatorar para uma arquitetura Angular 17 idiomática — **serviço tipado + componentes standalone + signals + control flow moderno** — consumindo o contrato real da API, com UI responsiva e acessível, **preservando o comportamento** (listar, criar, remover).

---

## 2. Domínio e linguagem ubíqua
<!-- Entidades y términos. -->
- **Todo (Tarefa):** item da lista. Espelha o recurso do backend.
  - `id` (number), `title` (string), `completed` (boolean).
- **`TodoService`:** camada de dados; encapsula o HTTP e desenvelopa o `{ data }` do backend.
- **Componentes:** `TodoFormComponent` (criar), `TodoListComponent` (listar), `TodoItemComponent` (uma tarefa).
- **Estado da UI:** `loading`, `error`, lista de `todos` (via signals).

---

## 3. Regras de negócio
<!-- Afirmaciones verificables. -->
- RF1: ao iniciar, a app carrega as tarefas via `GET /api/tarefas` e as exibe.
- RF2: criar tarefa envia `POST /api/tarefas` com `{ title }`; a tarefa criada aparece na lista.
- RF3: remover envia `DELETE /api/tarefas/{id}`; a tarefa some da lista.
- RF4: título vazio (ou só espaços) **não** cria (não dispara `POST`).
- RF5: em erro de rede/HTTP, a UI mostra uma **mensagem de erro** ao usuário — **nunca** dados inventados; o estado permanece consistente com o servidor.
- RF6: a base URL vem de `environment.apiUrl` (`http://localhost:8000/api`), não hardcoded no componente.
- RF7: as respostas do backend têm envelope `{ data }`; o `TodoService` desenvelopa para `Todo`/`Todo[]`.
- RF8: a interface é **responsiva** (usável em mobile e desktop) e acessível (form/label/aria).

---

## 4. Entradas / Saídas / Erros
- **Entradas:** texto do título; ação "adicionar" (submit); ação "remover" (por tarefa).
- **Saídas:** lista renderizada; estado **vazio** ("Nenhuma tarefa encontrada"); estado **loading**.
- **Erros:** falha HTTP → mensagem visível (`role="alert"`); a lista reflete o servidor (sem otimismo incorreto).

---

## 5. Contratos
```ts
interface Todo { id: number; title: string; completed: boolean; }

interface TodoService {
  getAll(): Observable<Todo[]>;            // GET  /api/tarefas  → desenvelopa { data }
  add(title: string): Observable<Todo>;    // POST /api/tarefas  { title } → { data }
  remove(id: number): Observable<void>;    // DELETE /api/tarefas/{id} → 204
}

// require: title.trim().length > 0 para add()
// ensure:  o estado exibido = respostas do servidor; erros → mensagem, no datos fake
```

---

## 6. Invariantes
- IF1: a lista exibida **reflete o servidor** — nenhum item fabricado localmente.
- IF2: sem subscrições pendentes após destruir o componente (sem fuga de memória).
- IF3: sem `any` no código (tipagem forte, aproveitando `strict`).

---

## 7. Cenários (BDD)
```
Cenário: Carregar e exibir tarefas
  Given a API responde com [ { id:1, title:"Comprar pão", completed:false } ]
  When  o AppComponent inicia
  Then  faz GET /api/tarefas
  And   a UI mostra "Comprar pão"

Cenário: Criar tarefa
  Given o campo de título tem "Estudar Angular"
  When  o usuário confirma a criação
  Then  faz POST /api/tarefas { title: "Estudar Angular" }
  And   a nova tarefa aparece na lista
  And   o campo de título é limpo

Cenário: Não criar com título vazio
  Given o campo de título está vazio
  When  o usuário confirma a criação
  Then  nenhum POST é enviado

Cenário: Remover tarefa
  Given existe uma tarefa com id X na lista
  When  o usuário remove essa tarefa
  Then  faz DELETE /api/tarefas/X
  And   a tarefa some da lista

Cenário: Erro de rede
  Given a API falha ao listar
  When  o AppComponent inicia
  Then  a UI mostra uma mensagem de erro
  And   NÃO mostra tarefas inventadas
```

---

## 8. Exemplos
| entrada | resultado esperado |
|---------|--------------------|
| iniciar com API `[{id:1,title:"A"}]` | lista mostra "A" |
| adicionar "B" | `POST {title:"B"}`; "B" aparece; input limpo |
| adicionar "" | nenhum `POST` |
| remover id 1 | `DELETE /api/tarefas/1`; "A" some |
| API cai no GET | mensagem de erro; 0 tarefas inventadas |

---

## 9. Eventos            <!-- se aplicável -->
Outputs de componentes (comunicação filho→pai): `TodoFormComponent` emite `add(title)`; `TodoItemComponent`/`TodoListComponent` emitem `remove(id)`.

## 10. Modelo de estados  <!-- se aplicável -->
```
inicial → [loading] → [loaded(todos)]         (lista, possivelmente vazia)
                    ↘ [error]                  (mensagem; sem dados fake)
```

## 11. Decisões (ADR)
- ADR-F1: **componentes standalone** com `ChangeDetectionStrategy.OnPush`.
- ADR-F2: **signals** para o estado (`todos`, `loading`, `error`); `inject()` em vez de constructor.
- ADR-F3: **`provideHttpClient()`** em `app.config.ts`; remover `HttpClientModule` do componente (deprecado).
- ADR-F4: **environments** para `apiUrl` (`/api`), com `fileReplacements` no `angular.json` — corrige a URL quebrada.
- ADR-F5: **control flow** `@if`/`@for (… ; track id)`/`@empty` no template.
- ADR-F6: **sem dados fake**; erros exibidos na UI; estado sempre igual ao servidor.
- ADR-F7: **responsividade** com SCSS por componente + `@media`; **acessibilidade** (`<form>`+submit, `<label>`, `aria-*`, `role="alert"`).
- ADR-F8: **ESLint** (angular-eslint) + Prettier para consistência (requisito do README).

---

## 12. Critérios de aceitação
- [ ] Carrega e exibe as tarefas ao iniciar (RF1) — test: flujo `AppComponent` (GET)
- [ ] Cria tarefa e ela aparece (RF2) — test: flujo `AppComponent` (POST)
- [ ] Não cria com título vazio (RF4) — test: `TodoForm`/fluxo
- [ ] Remove tarefa e ela some (RF3) — test: flujo `AppComponent` (DELETE)
- [ ] Erro de rede mostra mensagem, sem dados fake (RF5, IF1) — test: fluxo com `flush(erro)`
- [ ] `TodoService` chama `/api/tarefas` e desenvelopa `data` (RF6, RF7) — test: `TodoService` + `HttpTestingController`
- [ ] Sem `any`; sem subscrições penduradas (IF2, IF3) — verificação: `tsc`/revisão
- [ ] Responsivo e acessível (RF8) — verificação: navegador (≤480/≈768/desktop) + `ng lint`

---

## 13. Rastreabilidade
| Regra / Cenário | Teste | Arquivo de código |
|-------------------|------|-------------------|
| RF1, RF2, RF3 / fluxo | flujo `AppComponent` (`app.component.spec.ts`) | `app.component.ts`, componentes |
| RF4 / título vazio | `TodoForm` / fluxo | `todo-form.component.ts` |
| RF5, IF1 / erro sem fake | fluxo com erro | `app.component.ts` |
| RF6, RF7 / contrato `/api` + envelope | `TodoService` (`todo.service.spec.ts`) | `todo.service.ts`, `environments` |
| RF8 / responsivo + a11y | navegador + `ng lint` | `*.scss`, templates |
