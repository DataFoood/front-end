# Integração com a API

Contrato da API: `API_MAP.md` e Swagger (`/api/docs/`) no repo `back`. Tipos
espelhados em `lib/types.ts` — ao mudar um contrato no back, atualize os dois.

## `api()` — `lib/api.ts`

```ts
api<T>(path, { method, body, query, signal })
```

- Base: `NEXT_PUBLIC_API_URL` (embutida no build; default `http://localhost:8000`).
- Toda chamada vai com `credentials: 'include'` (cookies da sessão) e o
  cabeçalho `X-Requested-With: datafood` — é ele que liga o "modo navegador"
  no back e serve de proteção CSRF (o back recusa escrita via cookie sem ele).
- JSON na ida e na volta; `204` → `undefined`.
- `query` ignora `undefined`/`null`/`''` (filtros vazios não viram `?x=`).
- Erro → `ApiError { status, data, fields, message }`:
  - `fields`: erros por campo do DRF (`{ email: 'mensagem' }`) — ligue direto
    no `error` do `<Field>`.
  - `message`: texto pronto para toast (429 com `Retry-After`, 5xx, 404…).
  - `status: 0` = sem conexão.
- `errorMessage(err, fallback)` para toasts.

## Sessão (cookies HttpOnly)

| Item | Valor |
|---|---|
| Onde fica | cookies **HttpOnly** gravados pelo back (`datafood_access`, `datafood_refresh`). O JS nunca vê os tokens |
| `localStorage` | só `datafood.session = '1'` (marcador, sem token): diz se vale chamar `/me` ao abrir e avisa as outras abas |
| Access | 15 min — o `AuthContext` renova sozinho ~1,5 min antes de vencer (e ao voltar para a aba) |
| Refresh | 7 dias, **rotaciona** a cada uso (o antigo vai pra blacklist) |

`refreshSession()` (`lib/api.ts`) é *single-flight* na aba e usa **Web Locks**
entre abas: as abas dividem os cookies, e duas renovando juntas gastariam o
mesmo refresh rotacionado (a segunda cairia). Quem pega a trava depois de
outra aba ter renovado há < 10 s não renova de novo.

Fluxo de um 401 em rota autenticada:

1. `api()` chama `refreshSession()` e repete a requisição se deu certo.
2. Falhou → apaga o marcador e dispara `datafood:session-expired` →
   `AuthContext` zera o usuário → `RequireAuth` manda para o login.

Eventos que encerram a sessão do lado do back (e o front já trata):

| Ação | Back | Front |
|---|---|---|
| Logout | blacklista o refresh e apaga os cookies | apaga o marcador; outras abas saem via `storage` |
| Trocar senha | blacklista **todos** os refresh e grava um par novo em cookie | nada a fazer — esta aba segue logada |
| Encerrar conta | soft delete, revoga tudo, apaga conversas e cookies | `logout()` e volta para `/` |

## Paginação padrão — `usePaginated` (`lib/usePaginated.ts`)

Toda listagem da API vem paginada (`{count, next, previous, results}`). No
front, toda lista usa o mesmo hook e o mesmo rodapé:

```tsx
const { items, count, hasMore, loading, loadingMore, loadMore, reload, update, error } =
  usePaginated<Favorite>('/api/restaurants/favorites/', { q }, 12)
…
<LoadMore shown={items.length} total={count} hasMore={hasMore} loading={loadingMore} onClick={loadMore} noun="salvos" />
```

- O estado é chaveado por `path + query`: trocar filtro recomeça da página 1
  e resposta de consulta antiga nunca entra na lista nova.
- `reload()` volta para a página 1; `update(fn)` ajusta a lista local
  (editou/removeu) sem nova requisição.
- `fetchAll(path)` percorre todas as páginas — só para conjuntos pequenos e
  da própria conta (ids favoritos, restaurantes do dono na barra do painel).

## Tratamento de erro por tela

| Situação | Padrão |
|---|---|
| Formulário | `setErrors(err.fields)` + `toast.error(errorMessage(err))` |
| Carregamento de página | estado `error` chaveado pelo recurso + `EmptyState` com "tentar de novo" |
| Ação pontual (favoritar, remover) | toast; ações otimistas desfazem |
| Busca semântica | 503 → mensagem + link para `/explorar`; 429 → pedir pausa |

## Rotas por tela

| Tela | Chamadas |
|---|---|
| `/` | `GET /api/restaurants/?ordering=rating&page_size=3` |
| `/explorar` | `GET /api/restaurants/taxonomies/` (cache), `GET /api/restaurants/?…` paginado |
| `/restaurante/[slug]` | `GET /api/restaurants/by-slug/<slug>/`, reviews `GET` (paginado)/`POST`/`DELETE`, `GET …/<id>/promotions/active/` |
| `/chat` | `POST /api/search/ { query, limit: 6 }`, conversas em `GET/POST /api/chats/`, `GET/PATCH/DELETE /api/chats/<id>/` |
| `/salvos` | `GET /api/restaurants/favorites/` |
| favoritos (global) | `GET …/favorites/` no login; `POST/DELETE …/<id>/favorite/` |
| `/perfil` | `PATCH /users/me/`, `PATCH /users/consent/`, `GET /preferences/`, `GET /preferences/searches/`, `PATCH /preferences/<dim>/<id>/`, `GET/PATCH /promotions/preferences/`, `POST/DELETE /promotions/preferences/telegram/`, `POST /users/<id>/change-password/`, `DELETE /users/<id>/delete/` |
| `/painel` | `GET /restaurants/mine/`, `GET/PATCH/DELETE /restaurants/<id>/`, `GET …/stats/`, items/hours/images, `GET/POST/PATCH /addresses/`, promoções (`…/<id>/promotions/` + `audience/`, `<pid>/send/`, `<pid>/unschedule/`), `GET /promotions/infra-suggestion/` (só admin) |
| `/promocoes/descadastrar` | `POST /promotions/unsubscribe/ {token}` (sem auth, só no clique) |

O dono abrir a própria página ou o painel não soma visualização (o back
ignora views do dono/admin).
