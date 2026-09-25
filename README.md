# datafood — frontend

Aplicativo de recomendação de restaurantes por momento. Next.js 16 (App Router) +
React 19 + TypeScript + Tailwind CSS, integrado à API Django do repositório `back`.

## Rodando local

Pré-requisito: a API do `back` rodando em `http://localhost:8000`
(`docker compose up -d --build` lá; para dados de exemplo, `seed_demo --demo-users`).

```bash
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev                    # http://localhost:3000
```

Contas de demonstração (criadas pelo `seed_demo --demo-users` do back):
`cliente@datafood.demo` e `dono@datafood.demo`, senha `Demo@12345`.

## Scripts

| Comando | O quê |
|---|---|
| `npm run dev` | desenvolvimento |
| `npm run build` / `npm start` | build e servidor de produção |
| `npm run lint` | ESLint (regras do Next + React Compiler) |
| `npm run typecheck` | TypeScript sem emitir |

## Páginas

| Rota | Acesso | O quê |
|---|---|---|
| `/` | público | landing + destaques reais |
| `/explorar` | público | lista com filtros (cozinha, ambiente, preço, delivery, ordem) |
| `/restaurante/[slug]` | público (interagir: logado) | detalhe, cardápio, horários, fotos, avaliações, salvar, contato/WhatsApp |
| `/login`, `/cadastro` | público | JWT; cadastro escolhe pessoa/restaurante e consentimento LGPD |
| `/chat` | logado | busca semântica em linguagem natural (conversas salvas no navegador) |
| `/salvos` | logado | favoritos |
| `/perfil` | logado | dados, privacidade (consentimento, afinidades, histórico), senha, encerrar conta |
| `/painel` | logado | dono: métricas, informações, cardápio, horários, endereço, fotos; cadastro de restaurante |
| `/privacidade`, `/termos` | público | textos legais (revisar com jurídico) |

## Estrutura

```
app/            páginas (App Router) + contexts (auth, favoritos, toasts)
components/     UI compartilhada, cards, header, painel do dono
lib/api.ts      cliente HTTP: Bearer, refresh automático c/ rotação, erros DRF
lib/types.ts    tipos do contrato da API
lib/format.ts   formatação (preço, horários, telefone, CPF…)
```

Sessão: tokens em `localStorage`; um 401 dispara um único refresh
(o back rotaciona o refresh token); falhou → sessão encerrada.

## Produção

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.seudominio.com.br -t datafood-front .
docker run -p 3000:3000 datafood-front
```
`NEXT_PUBLIC_API_URL` é embutida no build. O `docker-compose.prod.yml` do repo
`back` já builda e serve este front atrás do Caddy (HTTPS). Lembre de incluir a
origem do front em `CORS_ALLOWED_ORIGINS` na API.

## Design

Paleta creme `#F5F0E8`, preto `#0D0D0D`, terracota `#C0603A`; Playfair Display +
Noto Sans JP. Tokens em `tailwind.config.js` e `app/globals.css`.
