# Estrutura

```
app/                      rotas (App Router)
  layout.tsx              providers globais + metadata
  globals.css             tokens (@theme) + classes de componente
  context/                AuthContext, FavoritesContext, ToastContext
  page.tsx                landing
  explorar/ restaurante/[slug]/ chat/ salvos/ perfil/ painel/
  login/ cadastro/ privacidade/ termos/
  error.tsx not-found.tsx
components/
  ui.tsx                  primitivos (Field, Toggle, Spinner, EmptyState…)
  SiteHeader.tsx          header + footer
  RestaurantCard.tsx      card, FavoriteButton, OpenBadge, CardGrid
  RequireAuth.tsx         guarda de rota no cliente
  AuthShell.tsx LegalPage.tsx Illustration.tsx
  painel/                 Overview, InfoForm/CreateRestaurant, Editors
lib/
  api.ts                  cliente HTTP + sessão
  types.ts                contrato da API
  format.ts               formatação e máscaras (preço, telefone, CPF…)
  nav.ts                  safeNext (anti open-redirect), homeFor
  taxonomies.ts           useTaxonomies (cache de módulo)
  usePaginated.ts         paginação padrão de toda lista (+ fetchAll)
final-tests/              navegação E2E + contador de renders
docs/                     esta documentação
```

## Como uma página é montada

Todas as páginas são Client Components (`'use client'`): dependem da sessão
do navegador (cookie da API + marcador no `localStorage`), que o servidor do
Next não enxerga. O esqueleto se repete:

```tsx
export default function XPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-8">
        <p className="eyebrow mb-3">sobretítulo</p>
        <h1 className="mb-8 font-serif text-4xl">título</h1>
        <RequireAuth>        {/* só em rota protegida */}
          <Conteudo />
        </RequireAuth>
      </main>
      <SiteFooter />
    </div>
  )
}
```

- Quem lê `useSearchParams` fica dentro de `<Suspense>` (exigência do Next).
- Rotas protegidas: `RequireAuth` no cliente. O back é quem garante a
  autorização de verdade — o guarda só evita mostrar tela vazia.
- Estados de carregamento: `PageLoader`/`Spinner`; vazio/erro: `EmptyState`.

## Convenções

- Componentes em PascalCase, um componente principal por arquivo; subpeças
  da mesma tela ficam no mesmo arquivo acima do export.
- Imports com alias `@/` (ex.: `@/lib/api`), exceto contexts importados
  por páginas vizinhas (`../context/...`), como já está no código.
- Sem `any`; tipos da API em `lib/types.ts`.
- Comentários explicam o porquê (decisão, armadilha), não o quê.
