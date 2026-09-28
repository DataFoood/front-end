# Integração com a API

Contrato da API: `API_MAP.md` e Swagger (`/api/docs/`) no repo `back`. Tipos
espelhados em `lib/types.ts` — ao mudar um contrato no back, atualize os dois.

## `api()` — `lib/api.ts`

```ts
api<T>(path, { method, body, query, auth = true, signal })
```

- Base: `NEXT_PUBLIC_API_URL` (embutida no build; default `http://localhost:8000`).
- JSON na ida e na volta; `204` → `undefined`.
- `query` ignora `undefined`/`null`/`''` (filtros vazios não viram `?x=`).
- `auth: false` para rotas públicas de auth (login, register, logout,
  taxonomias). O resto manda o Bearer se houver sessão.
- Erro → `ApiError { status, data, fields, message }`:
  - `fields`: erros por campo do DRF (`{ email: 'mensagem' }`) — ligue direto
    no `error` do `<Field>`.
  - `message`: texto pronto para toast (429 com `Retry-After`, 5xx, 404…).
  - `status: 0` = sem conexão.
- `errorMessage(err, fallback)` para toasts.

## Sessão JWT

| Item | Valor |
|---|---|
| Armazenamento | `localStorage['datafood.tokens'] = { access, refresh }` |
| Access | 15 min |
| Refresh | 7 dias, **rotaciona** a cada uso (o antigo vai pra blacklist) |

Fluxo de um 401 em rota autenticada:

1. `api()` chama `refreshAccess()` — *single-flight*: várias requisições com
   401 ao mesmo tempo esperam o mesmo refresh.
2. Sucesso → guarda o par novo e repete a requisição.
3. Falha → se outra aba já rotacionou (o storage tem um refresh diferente do
   que tentamos), usa o par novo; senão limpa os tokens e dispara
   `datafood:session-expired` → `AuthContext` zera o usuário →
   `RequireAuth` manda para o login.

Eventos que encerram a sessão do lado do back (e o front já trata):

| Ação | Back | Front |
|---|---|---|
| Logout | blacklista o refresh | limpa tokens; outras abas saem via `storage` |
| Trocar senha | blacklista **todos** os refresh e devolve par novo | guarda o par novo (`tokenStore.set`) — esta aba segue logada |
| Encerrar conta | soft delete + blacklista todos os refresh | `logout()` e volta para `/` |

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
| `/restaurante/[slug]` | `GET /api/restaurants/by-slug/<slug>/`, reviews `POST/DELETE` |
| `/chat` | `POST /api/search/ { query, limit: 6 }` |
| `/salvos` | `GET /api/restaurants/favorites/` |
| favoritos (global) | `GET …/favorites/` no login; `POST/DELETE …/<id>/favorite/` |
| `/perfil` | `PATCH /users/me/`, `PATCH /users/consent/`, `GET /preferences/`, `GET /preferences/searches/`, `PATCH /preferences/<dim>/<id>/`, `POST /users/<id>/change-password/`, `DELETE /users/<id>/delete/` |
| `/painel` | `GET /restaurants/mine/`, `GET/PATCH/DELETE /restaurants/<id>/`, `GET …/stats/`, items/hours/images, `GET/POST/PATCH /addresses/` |

O dono abrir a própria página ou o painel não soma visualização (o back
ignora views do dono/admin).
