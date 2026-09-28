# Estado: global por contexts, o resto perto de quem usa

Não há biblioteca de estado (Redux, Zustand, React Query). O app é pequeno o
bastante para React puro, desde que cada tipo de estado fique no lugar certo.

## Onde cada estado mora

| Tipo | Onde | Exemplos |
|---|---|---|
| Sessão e dados usados em todo o app | **Context** em `app/context/` | usuário logado, favoritos, toasts |
| Estado que pode ir num link / voltar com o botão "voltar" | **URL** (`useSearchParams` + `router.replace`) | filtros do `/explorar`, `?r=`/`?aba=` do painel, `?next=` do login |
| Dado de uma tela | `useState` na própria tela | restaurante do detalhe, métricas do painel, formulários |
| Preferência só do navegador | `localStorage` | tokens (`datafood.tokens`), conversas do chat (`datafood.chats.<id>`) |
| Dado estático compartilhado | cache de módulo | taxonomias (`lib/taxonomies.ts`) |

Regra de bolso: **só vira context o que mais de uma rota lê**. Se só uma
página precisa, é estado local, mesmo que a página seja grande.

## Os contexts

Montados em `app/layout.tsx`, nesta ordem (quem está dentro pode usar quem
está fora):

```
ToastProvider → AuthProvider → FavoritesProvider → página
```

### `AuthContext` — `useAuth()`

`{ user, loading, login, register, logout, refreshUser, setUser }`

- `loading` é `true` até a sessão salva ser validada (`GET /me`). Telas
  protegidas usam `<RequireAuth>`, que espera o `loading` e manda para
  `/login?next=` sem usuário.
- Restauração só descarta os tokens se o back **recusar** (401/403); API fora
  do ar não desloga.
- Escuta `datafood:session-expired` (disparado pelo `api()` quando o refresh
  falha) e o evento `storage` (logout em outra aba).
- O value muda quando o usuário muda (login, logout, perfil salvo). Isso é
  raro e esperado; quem só precisa saber "está logado?" pode ler `user`.

### `FavoritesContext` — seletores

O conjunto de favoritos muda a cada clique e é lido por todo card visível.
Colocar o `Set` no value faria **todos** os consumidores re-renderizarem a
cada favorito. Por isso o context carrega só coisas estáveis — um store e as
ações — e cada componente assina a fatia que usa:

| Hook | Re-renderiza quando |
|---|---|
| `useIsFavorite(id)` | aquele restaurante muda |
| `useFavoritesCount()` | o total muda |
| `useFavoriteIds()` | qualquer favorito muda (use só em listas de favoritos) |
| `useFavoriteActions()` → `{ toggle }` | nunca (ações estáveis) |

`toggle` é otimista: atualiza na hora e desfaz com toast se a API falhar.
Os ids são recarregados quando o **id** do usuário muda (não quando o objeto
`user` muda, ex.: ao salvar o perfil).

Medido: favoritar em `/explorar` re-renderizava os 9 botões da tela; agora
re-renderiza 1 botão + o contador do header.

### `ToastContext` — `useToast()`

`{ success, error, info }`, value estável (nunca re-renderiza consumidores).
Mensagens de toast são frases completas com maiúscula e ponto.

## Padrão para um novo context

1. Arquivo em `app/context/NomeContext.tsx`, `'use client'`.
2. `createContext<Value | null>(null)` + hook `useNome()` que lança erro fora
   do provider.
3. Funções no value com `useCallback`; value com `useMemo`.
4. Se uma parte do estado muda com frequência e é lida por muitos
   componentes, siga o modelo dos favoritos: store estável no context +
   hooks com `useSyncExternalStore`.
5. Registre o provider em `app/layout.tsx` e documente aqui.

## Regras contra re-render desnecessário

O React Compiler **não** está ligado (ver [decisoes.md](decisoes.md)); o lint
aplica as regras dele, mas memoização é manual. O que o código já segue:

- **Input que dispara lista vira componente próprio.** `SearchBox` (explorar)
  e `Composer` (chat) guardam o texto digitado; o pai só recebe o valor no
  submit. Antes, 6 letras no `/explorar` = 54 renders de card.
- **Estado chaveado em vez de reset em effect.** Resultado guardado junto da
  chave que o gerou (`{ key: filterKey, items }`, `{ slug, data }`); se a
  chave mudou, "carregando" é derivado — sem `setState` dentro de effect.
- **`key` para recomeçar.** Trocar de restaurante no painel remonta os
  editores (`<div key={restaurant.id}>`); `SearchBox` é chaveado pelo `?q=`.
- **Props que vêm do servidor viram estado local com o padrão "estado
  anterior"** (`if (source !== prop) { setSource(prop); setForm(...) }`),
  como em `InfoForm` e `HoursEditor`.
- **`memo` só onde a lista cresce**: `RestaurantCard` e `AssistantBubble`.
- **Leituras paralelas num único `setState`** (`Promise.all` no perfil).
- **Effects que buscam dados** cancelam (flag `cancelled` ou
  `AbortController`) para resposta velha não sobrescrever a nova.

Para medir, use `final-tests/render-hook.js` (conta renders por componente em
cada commit, igual ao "highlight updates" do React DevTools).
