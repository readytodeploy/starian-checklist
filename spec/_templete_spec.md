# <Funcionalidade> — <Domínio>

> Objetivo em uma frase. · Estado: rascunho · Data: AAAA-MM-DD · Autor:
> Referências: docs/SDD-… · spec/adr/ADR-… · issue #…

## 1. Contexto e objetivo
<!-- Qual problema resolvemos, para quem, por que agora. 1–2 parágrafos. -->

## 2. Domínio e linguagem ubíqua
<!-- Entidades e termos com sua definição. Mapeia para src/core/domain/<dominio>. -->

## 3. Regras de negócio
<!-- Lista numerada de afirmações verificáveis. -->
- R1:
- R2:

## 4. Entradas / Saídas / Erros
- **Entradas:**
- **Saídas:**
- **Erros:**

## 5. Contratos
```ts
// interface ... 
// require: <precondições>
// ensure:  <pós-condições>
```

## 6. Invariantes
<!-- Regras SEMPRE verdadeiras → testes de invariante. -->
- I1:
- I2:

## 7. Cenários (BDD)
```
Cenário: <nome>
  Dado  <contexto>
  E     <dados>
  Quando <ação>
  Então <resultado observável>
  E     <evento emitido>
```

## 8. Exemplos
| entrada | resultado esperado |
|---------|--------------------|
|         |                    |

## 9. Eventos            <!-- se aplicável -->
<!-- ProdutoCriado, CargaEstivada, ... -->

## 10. Modelo de estados  <!-- se aplicável -->
<!-- CREATED → ... ; transições proibidas -->

## 11. Decisões (ADR)   <!-- se aplicável -->
<!-- link para spec/adr/ADR-XXXX -->

## 12. Critérios de aceitação
- [ ] <critério> (Rn) — teste: <nome do teste>

## 13. Rastreabilidade
| Regra / Cenário | Teste | Arquivo de código |
|-----------------|-------|-------------------|
|                 |       |                   |
