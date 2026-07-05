# Todo App — Frontend

> **Avaliação técnica — Starian** · Vaga: Desenvolvedor Sênior
> Demonstra arquitetura, refatoração, boas práticas de engenharia e qualidade de código.

**Autor:** Pedro Antonio Vargas Lopez — Senior Software Engineer · 📧 pedroanto.94@gmail.com

---

## O que este projeto faz?

Interface de uma *Todo List* em **Angular 17**. Permite **listar, criar e remover** tarefas,
consumindo a API do backend (`/api/tarefas`), com estados de carregamento/erro, validação de
formulário e layout responsivo.

É o resultado de uma refatoração que levou o código legado (um *god component* com `any`,
estilos inline, URL errada e dados "fake") a uma arquitetura moderna de **componentes standalone
+ signals + serviço tipado**.

---

## Metodologia

- **SDD — Spec-Driven Development:** o comportamento foi especificado primeiro no
  [spec](../spec/frontend/todo-app.md) (domínio, contrato com a API, regras, cenários e critérios).
- **TDD — test-first:** uma rede de segurança de testes foi escrita **antes** de refatorar o
  código legado e sobreviveu à extração de serviço e componentes; cada fase foi validada com `ng test`.

---

## Arquitetura

Componentes **standalone** com `OnPush` e estado por **signals**; o `AppComponent` é a casca
(*shell*) que orquestra via `TodoService`. Estrutura **por feature**:

```
src/app/
├── app.component.{ts,html,scss}        # shell: estado (signals), loading/erro
└── todos/                              # feature de tarefas
    ├── models/todo.model.ts            # interface Todo
    ├── services/todo.service.ts        # HTTP + desenvelopa { data }
    └── components/
        ├── todo-form/                  # criar (form nativo + signal, validação)
        ├── todo-list/                  # @for/@empty
        └── todo-item/                  # uma tarefa (input()/output())
```

- **Dados:** `TodoService` (`inject(HttpClient)`) encapsula o HTTP e desenvelopa o `{ data }`
  do backend; a base URL vem de `environments`.
- **Estado:** signals (`todos`, `loading`, `error`) no shell; comunicação filho→pai por `output()`.
- **Template:** control flow moderno (`@if` / `@for` com `track` / `@empty`).

---

## Antes e depois da refatoração

| Antes (legado) | Depois (refatorado) |
|---|---|
| Tudo em `AppComponent` (dados + HTTP + UI) | Componentes standalone (form/list/item) + `TodoService` |
| `any` em todo lado | Modelo `Todo` tipado (`strict`) |
| URL `http://localhost:8000/tarefas` (quebrada) | `environments` → `/api/tarefas` |
| `HttpClientModule` (deprecado) | `provideHttpClient()` |
| `subscribe(next, error)` (deprecado) | *observer object* + signals |
| Dados "fake" no erro | Mensagem de erro na UI; estado reflete o servidor |
| Estilos inline, não responsivo | SCSS por componente + `@media` responsivo |
| `*ngIf` / `*ngFor` | `@if` / `@for (… ; track id)` |
| Change detection padrão | `OnPush` + signals |
| Sem validação/feedback | Validação (obrigatório, limite 255) com tooltip e mensagens |
| Sem testes | 29 testes (fluxo + serviço + cada componente) |

---

## Stack

| Componente | Versão |
|---|---|
| Angular | 17.3 |
| TypeScript | 5.4 |
| RxJS | 7.8 |
| Testes | Karma + Jasmine (`ng test`) |
| Formatação | Prettier 3 (`npm run format`) |

---

## Instalação e configuração local — Como instalo?

> Requisitos: **Node 18+**, **npm** e **Google Chrome** (para rodar os testes via Karma).

```bash
cd frontend
npm install
```

A URL da API fica em `src/environments/environment.ts` (`apiUrl: http://localhost:8000/api`).
Suba o [backend](../backend/README.md) para ter dados reais.

---

## Como executo?

```bash
npm start          # ng serve → http://localhost:4200
```

Ou o stack completo (backend + frontend) a partir da raiz do repositório:

```bash
docker compose up --build
```

---

## Como testo?

```bash
npm test                                          # modo watch (abre o Chrome)
npm test -- --watch=false --browsers=ChromeHeadless   # rodada única (headless)
```

Cobertura: fluxo do `AppComponent` (listar/criar/remover, erros), `TodoService`
(GET/POST/DELETE, contrato `/api`) e cada componente isoladamente.

---

## Formatação (Prettier)

```bash
npm run format         # formata src/**/*.{ts,html,scss,json}
npm run format:check   # verifica sem alterar
```

Config em `.prettierrc.json` (parser `angular` para os templates).

---

## Como está organizado?

- `src/app/app.component.*` — shell (orquestra o estado e os componentes).
- `src/app/todos/` — feature de tarefas: `models/`, `services/`, `components/<cada-componente>`.
- `src/environments/` — `apiUrl` por ambiente (`fileReplacements` no `angular.json`).
- Cada componente tem `ts` + `html` + `scss` + `spec` na sua própria pasta.

Especificação do domínio em [`../spec/frontend/todo-app.md`](../spec/frontend/todo-app.md).

---

## Notas técnicas

- **Contrato com o backend:** o front consome `/api/tarefas` e desenvelopa o `{ data }` do
  API Resource. Alterou a URL? Ajuste `src/environments/environment.ts`.
- **Testes precisam do Chrome:** o Karma usa o Chrome; se não for detectado, aponte o binário
  com `export CHROME_BIN="/caminho/para/chrome"`.
- **tsconfig "solution-style":** o `tsconfig.json` base usa `references` para o editor associar
  os `.spec.ts` ao `tsconfig.spec.json` (tipos do Jasmine).
