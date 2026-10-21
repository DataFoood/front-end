# Decisões

Registro append-only. Mais recente no topo. Cada entrada: o que, por quê e
o que foi descartado.

## 2026-10-21 — sessão em cookie, paginação padrão, caixa de frase

**Sessão em cookies HttpOnly, não em `localStorage`.** Token no
`localStorage` é lido por qualquer XSS. Agora o back grava os cookies e
tira os tokens do corpo (inclusive do refresh); o front só roda o refresh.
Proteção CSRF pelo cabeçalho `X-Requested-With` (exige preflight; o CORS só
libera o front). Descartado: BFF no Next (rota `/api` do Next guardando os
tokens) — o app é todo client-side e o deploy ficaria com mais uma peça;
e cookie não-HttpOnly com o token — não resolve o XSS.

**Refresh coordenado entre abas com Web Locks.** As abas dividem os cookies;
sem a trava, duas renovando juntas mandavam o mesmo refresh rotacionado e a
segunda derrubava a sessão. Quem pega a trava logo depois de outra aba ter
renovado não renova de novo.

**Marcador `datafood.session` no `localStorage`.** O JS não sabe se existe
cookie HttpOnly; sem o marcador, todo visitante faria `/me` + refresh à toa
ao abrir o site. Ele não carrega nada sensível.

**Conversas do chat na conta (`/api/chats/`).** No `localStorage` elas não
seguiam a pessoa e sobreviviam ao encerramento da conta. A cópia antiga é
importada uma vez (deduplicada — o efeito roda 2× no StrictMode) e apagada.

**`usePaginated` para toda lista.** Um hook só, chaveado pela consulta, com
`<LoadMore>` padrão. Avaliações saíram do detalhe do restaurante
(`has_reviewed` no lugar) e viraram lista paginada.

**Caixa de frase em vez de tudo minúsculo.** Leitura mais fácil e nomes
próprios (restaurantes, WhatsApp, LGPD) com a grafia certa. Regras em
[estilizacao.md](estilizacao.md#voz).

## 2026-10-20 — revisão geral

**`safeNext` resolve a URL em vez de checar prefixo.** `/\evil.com` passava
por "começa com `/` e não com `//`", mas o navegador trata `\` como `/` e
o login redirecionava para outro site. Agora `new URL(next, base)` e só
aceita a mesma origem. Descartado: lista de rotas permitidas — quebraria
`?next=` para qualquer página nova.

**"carregar mais" só anexa se o filtro não mudou.** A resposta da página 2
chegando depois de trocar o filtro sobrescrevia a lista nova e a tela
ficava carregando para sempre.

## 2026-10-20 — promoções por mensageiros

**WhatsApp por link, não por API.** O painel gera `wa.me/?text=…` e o dono
dispara pela própria lista de transmissão/grupo/status. A Cloud API exige
conta Meta Business, templates aprovados e cobra por conversa; e mandar
para o número de cada cliente vazaria telefones para o dono. Telegram e
e-mail, que têm envio automático grátis, saem pelo back.

**Telegram vinculado por deep link + botão "confirme aqui".** O back devolve
`t.me/<bot>?start=<token>`; mostramos como link (não `window.open` após o
`await`, que bloqueador de pop-up barra) e a pessoa volta e recarrega o
estado. Descartado: polling automático do status — o vínculo é raro e o
long polling do back já tem atraso de até 10 s.

**Descadastro só com clique.** A página `/promocoes/descadastrar` não chama a
API ao carregar: leitores de link dos provedores de e-mail abrem a URL
sozinhos e descadastrariam a pessoa.

**Aba de promoções acompanha o envio por polling (3 s) só enquanto há uma
promoção `enviando`.** O envio roda no worker; sem isso o dono veria
"enviando" até recarregar.

**`formatDate` lê `AAAA-MM-DD` no fuso local.** `new Date('2026-10-20')` é
meia-noite UTC — no Brasil aparecia o dia anterior (gráfico do painel e
validade das promoções).

## 2026-09-28 — rodada de testes finais

**Favoritos via store + `useSyncExternalStore` dentro do context.**
Favoritar re-renderizava todos os consumidores do context (todos os botões
da tela). O context passou a carregar um store estável e cada componente
assina a fatia que lê (`useIsFavorite(id)`, `useFavoritesCount()`).
Descartado: dividir em dois contexts (estado/ações) — o `FavoriteButton`
precisa do estado, então continuaria re-renderizando todos; e adotar
Zustand/Jotai — uma dependência para um único caso.

**React Compiler continua desligado.** O lint já aplica as regras do
compiler, então o código está pronto para ele. Ligar exige
`babel-plugin-react-compiler` (ou o port Rust experimental do Turbopack) e
deixa o build mais lento; com os ajustes manuais (inputs isolados, memo nos
cards, favoritos por seletor) os cenários medidos já não têm render em
cascata. Reavaliar quando o port Rust sair do experimental.

**Inputs com estado próprio** (`SearchBox`, `Composer`). Digitar
re-renderizava a lista/histórico inteiro a cada tecla.

**Cores só por token.** ~250 usos de `text-[#999]` e afins viraram tokens
no `@theme` com os mesmos valores (screenshots antes/depois idênticos pixel
a pixel). Novo valor de cor = novo token.

**Troca de senha mantém a sessão atual.** O back passou a revogar todos os
refresh tokens na troca de senha e devolver um par novo; o front guarda esse
par. Sem isso, a própria aba cairia no próximo refresh.

**Sessão resiliente.** Restauração só descarta tokens em 401/403 (API fora
do ar não desloga); logout numa aba reflete nas outras (`storage`); refresh
concorrente entre abas reaproveita o par que a outra aba acabou de gravar.

**Taxonomias com cache de módulo** (`lib/taxonomies.ts`). Dado estático do
seed; uma requisição por aba em vez de uma por visita.

**`typecheck` roda `next typegen` antes do `tsc`.** Num clone limpo o
`next-env.d.ts` (gitignored) não existe e o `tsc` falhava no import de SVG.

## 2026-09-24 — integração com a API

- Mocks removidos; todas as telas falam com a API Django.
- Tokens em `localStorage` (não cookie httpOnly): a API é outro domínio e
  usa Bearer; CSRF não se aplica. Risco aceito: XSS leria o token — mitigado
  por não renderizar HTML vindo da API e por URLs `javascript:` serem
  rejeitadas no back.
- Conversas do chat só no navegador (por usuário). O histórico no servidor
  existe apenas com consentimento LGPD e aparece no perfil.
- TypeScript 6 / ESLint 9: versões mais novas suportadas pelo
  `eslint-config-next` (ver README).
