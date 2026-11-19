# datafood — frontend

Aplicativo de recomendação de restaurantes por momento. Next.js 16 (App Router, Turbopack) +
React 19 + TypeScript 6 + Tailwind CSS 4, integrado à API Django do repositório `back`.
Runtime: **Node.js 22** (`nvm use`). Gerenciador de pacotes: **Bun 1.4.4**.

## Rodando local

Pré-requisito: a API do `back` rodando em `http://localhost:8000`
(`docker compose up -d --build` lá; para dados de exemplo, `seed_demo --demo-users`).

```bash
bun install
bun run dev                    # http://localhost:3000
```

Sem `.env`, o front aponta para `http://localhost:8000`. Para outra URL:
`cp .env.example .env.local` e ajuste `NEXT_PUBLIC_API_URL`.

Contas de demonstração (criadas pelo `seed_demo --demo-users` do back):
`cliente@datafood.demo` e `dono@datafood.demo`, senha `Demo@12345`.

## Scripts

| Comando | O quê |
|---|---|
| `bun run dev` | desenvolvimento (Turbopack) |
| `bun run build` / `bun run start` | build e servidor de produção |
| `bun run lint` | ESLint (regras do Next + React Compiler) |
| `bun run typecheck` | TypeScript sem emitir |
| `bun run test` | validação da configuração de deploy |

## Páginas

| Rota | Acesso | O quê |
|---|---|---|
| `/` | público | landing + destaques reais |
| `/explorar` | público | lista com filtros (cozinha, ambiente, preço, delivery, ordem) |
| `/restaurante/[slug]` | público (interagir: logado) | detalhe, promoções ativas, cardápio, horários, fotos, avaliações, salvar, contato/WhatsApp |
| `/login`, `/cadastro` | público | JWT; cadastro escolhe pessoa/restaurante e consentimento LGPD |
| `/chat` | logado | conversa com filtros acumulados, contagem real e recomendações em tela cheia; conversas salvas na conta |
| `/salvos` | logado | favoritos |
| `/perfil` | logado | dados, privacidade (consentimento, afinidades, histórico), promoções (opt-in, e-mail, vincular Telegram), senha, encerrar conta |
| `/painel` | logado | dono: métricas, informações, cardápio, horários, endereço, fotos, promoções (Telegram/e-mail/WhatsApp, agendamento, sugestão de infra no fim de semana); cadastro de restaurante |
| `/promocoes/descadastrar` | público | link do fim dos e-mails de promoção |
| `/privacidade`, `/termos` | público | textos legais (revisar com jurídico) |

## Estrutura

```
app/            páginas (App Router) + contexts (auth, favoritos, toasts)
components/     UI compartilhada, cards, header, painel do dono
lib/api.ts      cliente HTTP: Bearer, refresh automático c/ rotação, erros DRF
lib/types.ts    tipos do contrato da API
lib/format.ts   formatação (preço, horários, telefone, CPF…)
docs/           padrões: estilização, estado global, integração, decisões
final-tests/    navegação E2E (Playwright) + contador de renders
```

Sessão: tokens em **cookies HttpOnly** gravados pelo back (o JS não os vê);
o front renova sozinho antes do access vencer e num 401 (um refresh por vez,
coordenado entre abas); falhou → sessão encerrada. Toda listagem usa a
paginação padrão (`lib/usePaginated.ts` + `<LoadMore>`).

Antes de mexer em estilo ou estado compartilhado, leia [`docs/`](docs/README.md).
Para testar a navegação ponta a ponta: [`final-tests/README.md`](final-tests/README.md).

## Por que TypeScript 6 e ESLint 9?

Já existem TypeScript 7 e ESLint 10, mas o `eslint-config-next` depende do
`typescript-eslint` (que ainda só suporta TS < 6.1) e do `eslint-plugin-react`
(que quebra no ESLint 10). Ficamos nas versões mais novas que o Next suporta.

O override de `minimatch` se aplica somente ao `@typescript-eslint/typescript-estree`
para corrigir o alerta GHSA-g3hv-75wg-m249 enquanto o upstream exige a série 10.
Ele preserva a série 3 usada pelo ESLint. O lockfile com esse override exige
Bun 1.4.4; remova-o quando o upstream adotar uma versão corrigida.

## Produção

O build exige `NEXT_PUBLIC_API_URL` com a origem HTTPS pública da API, sem
`/api`, credenciais, query ou fragmento. A ausência da variável, HTTP e
endereços locais interrompem o build. O fallback `http://localhost:8000`
continua disponível no desenvolvimento com `bun run dev`.

### Vercel

Importe este repositório usando o preset **Next.js** e Node.js **22.x**.
O `vercel.json` fixa Bun 1.4.4 nos comandos de instalação e build para ler
o lockfile com overrides. Mantenha esses comandos e o diretório de saída
padrão do preset.

Antes do deploy, configure `NEXT_PUBLIC_API_URL=https://api.seudominio.com.br`
em **Production** e **Preview**, apontando cada um para sua API correspondente.
Para desligar a medição, configure `NEXT_PUBLIC_ANALYTICS_ENABLED=false`.
Essas variáveis são públicas e embutidas no build; alterá-las exige novo deploy.
O backend Django é hospedado separadamente.

O navegador não fala direto com a API: chama `/api/*` no próprio domínio do
front e o `proxy.ts` repassa para `NEXT_PUBLIC_API_URL`. Assim os cookies de
sessão são first-party mesmo com o front em `*.vercel.app` e a API em outro
domínio (chamada direta entre sites tem os cookies bloqueados pelo navegador e
a sessão cai no primeiro 401). Configure também `API_PROXY_SECRET` (sem
`NEXT_PUBLIC_`) com o mesmo valor de `FRONTEND_PROXY_SECRET` da API: com ele o
proxy repassa o IP real do usuário e o rate limit de login/cadastro não é
dividido por todos que passam pela Vercel.

Prefira front e API no mesmo domínio principal (por exemplo,
`app.seudominio.com.br` e `api.seudominio.com.br`), ambos em HTTPS. Na API,
autorize as origens exatas do front em `CORS_ALLOWED_ORIGINS`, habilite CORS
com credenciais e permita o cabeçalho `X-Requested-With`. Os cookies de sessão
devem ser `HttpOnly` e `Secure`, com `SameSite` adequado à topologia. Front em
`*.vercel.app` e API em outro domínio funcionam pelo proxy acima; não use
`SameSite=None`, que o navegador pode bloquear mesmo com `Secure`.

Antes de liberar o domínio de produção, execute os E2E de
[`final-tests/`](final-tests/README.md) em ambiente de homologação controlado,
com API disponível. Confirme login, renovação da sessão, logout, favoritos,
chat e painel nos domínios finais; os testes criam e alteram dados demo.

### Docker

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.seudominio.com.br -t datafood-front .
docker run -p 3000:3000 datafood-front
```
`NEXT_PUBLIC_API_URL` é embutida no build. O `docker-compose.prod.yml` do repo
`back` já builda e serve este front atrás do Caddy (HTTPS). Lembre de incluir a
origem do front em `CORS_ALLOWED_ORIGINS` na API.

## Design

Paleta creme `#F5F0E8`, preto `#0D0D0D`, terracota `#C0603A`; Playfair Display +
Noto Sans JP. Tokens no bloco `@theme` de `app/globals.css` (Tailwind 4 não usa mais `tailwind.config.js`);
cor sempre por token, nunca `text-[#hex]` — ver [`docs/estilizacao.md`](docs/estilizacao.md).

## Resultados e dados de origem

A busca aceita cidade e proximidade, com localização opcional. Dados externos
mostram procedência; registros demo são identificados. O painel acompanha eventos
observados, campanhas e resgates confirmados, sem tratar contato como venda.
Há filtros de 7/30/90 dias e CSV; sem histórico suficiente, a comparação é
indicada como indisponível. `NEXT_PUBLIC_ANALYTICS_ENABLED=false` desliga a coleta
de interesse no build; Do Not Track também é respeitado.

Confirme as migrações da API ao atualizar. Os passos e pendências do catálogo real
estão em `back/docs/implementation-status.md`. O E2E específico de BI é
`bun run e2e:bi` em `final-tests` (somente ambiente demo/controlado).

## Modo escolha

Em **Perfil → Meus dados**, habilite **Modo escolha**. A preferência fica salva
na conta e vale para a exploração por filtros. Também é possível alternar o modo
diretamente na exploração, mantendo a consulta atual.

No chat, **Ver recomendações (N)** sempre abre a seleção em tela cheia. É possível
continuar refinando a conversa antes de abrir e voltar sem perder o rascunho ou
o progresso dos cards. O backend precisa das rotas conversacionais e da geração
local habilitada; consulte `back/docs/conversation.md`. Free usa a conversa;
premium acrescenta contexto da própria conta quando autorizado no perfil.

Arraste o card para a esquerda para recusar ou para a direita para escolher e
salvar nos favoritos. As fotos têm setas próprias; mudar de foto não decide.
No desktop, use os botões ou as setas do teclado com o card em foco. Escolher
um favorito existente não o remove. Recusas são temporárias nessa lista e
não alteram os favoritos. Sem fotos, aparece uma ilustração identificada.

A API precisa aplicar a migração `users/0004_user_choice_mode` antes do uso.
