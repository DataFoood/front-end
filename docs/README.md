# datafood front — documentação

Decisões e padrões do frontend (Next.js 16 + React 19 + Tailwind 4). O
README da raiz explica como rodar; aqui fica o **porquê** e o **como fazer
igual** ao que já existe.

| Página | Quando ler |
|---|---|
| [estilizacao.md](estilizacao.md) | antes de escrever qualquer `className`: tokens, classes de componente, tipografia, voz |
| [estado-global.md](estado-global.md) | antes de criar estado compartilhado: contexts, URL, estado local, regras anti re-render |
| [integracao-api.md](integracao-api.md) | antes de chamar a API: cliente `api()`, sessão JWT, erros, contratos |
| [estrutura.md](estrutura.md) | onde cada coisa mora e como uma página é montada |
| [decisoes.md](decisoes.md) | registro datado das decisões (append-only, mais recente no topo) |

Testes de navegação e de renders: [`../final-tests/README.md`](../final-tests/README.md).

## Regras curtas (o resto está nas páginas)

1. Cor só por token (`text-ink-300`, `bg-rust`), nunca `text-[#999]`.
2. Estado que só uma tela usa fica na tela. Estado que várias telas usam vai
   para um context **com value estável**; dado que muda muito é lido por
   seletor (ver favoritos).
3. Filtro, aba e seleção que alguém pode querer compartilhar ou voltar com o
   botão do navegador ficam na URL (`useSearchParams`).
4. Input que re-renderiza uma lista a cada tecla vira componente próprio com
   estado local (`SearchBox`, `Composer`).
5. Toda chamada HTTP passa por `api()` de `lib/api.ts`.
6. `bun run lint && bun run typecheck` antes de commitar (o lint inclui as
   regras do React Compiler do `eslint-plugin-react-hooks`).
