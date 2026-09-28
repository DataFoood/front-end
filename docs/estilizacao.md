# Estilização

Tailwind CSS 4, configurado **no CSS** (`app/globals.css`), sem
`tailwind.config.js`. Três camadas, nesta ordem de preferência:

1. **Tokens** (`@theme`) — cores, fontes, animações. Viram utilitários
   automaticamente (`--color-rust` → `bg-rust`, `text-rust`, `border-rust`,
   `fill-rust`…).
2. **Classes de componente** (`@layer components`) — padrões repetidos em
   várias telas (`.btn-primary`, `.input`, `.card`…).
3. **Utilitários no `className`** — layout e ajustes locais.

Valor arbitrário (`text-[13px]`, `tracking-[0.12em]`, `rounded-t-[4px]`) é
aceito para medidas pontuais. **Cor arbitrária não** (`text-[#999]`): se a
cor não existe como token, crie o token.

## Tokens de cor

| Grupo | Tokens | Uso |
|---|---|---|
| Marca | `cream` `cream-dark` `rust` `rust-dark` `rust-soft` `rust-deep` `ink` | fundo creme, destaque terracota, texto principal |
| Escala neutra | `ink-800` `ink-700` `ink-600` `ink-500` `muted` (#777) `ink-350` `ink-300` `ink-250` `ink-200` `ink-150` `ink-100` `ink-50` | texto secundário, bordas, placeholders (maior = mais escuro) |
| Linhas | `line` `line-soft` `line-warm` `line-warm-strong` | divisórias e bordas sobre o creme |
| Superfície escura | `dark-bg` `dark-panel` `dark-line` `dark-ring` `dark-ring-soft` `dark-text` | painel do login, seção "para restaurantes" |
| Estados | `error` `danger` `danger-bg` `danger-line` · `success` `success-bright` `success-bg` `success-line` · `saved-bg` `saved-line` | validação, ações destrutivas, "aberto agora", botão salvo |
| Interação | `surface-hover` | hover de botões claros |

Guia rápido para texto:

| Papel | Token |
|---|---|
| título / texto principal | `text-ink` (padrão do `body`) |
| corpo de card, descrição | `text-ink-600` |
| texto de apoio | `text-muted` / `text-ink-500` |
| legenda, data, contador | `text-ink-300` / `text-ink-250` |
| placeholder, desabilitado | `text-ink-200` / `text-ink-150` |
| erro de campo | `text-error` |
| ação destrutiva | `text-danger` |

Exceções documentadas:
- `components/Illustration.tsx`: arte vetorial com paleta própria (não é UI).
- `app/layout.tsx` → `viewport.themeColor`: metadata não lê CSS; o valor é o
  mesmo de `--color-cream` (há comentário no código).

SVG de interface usa `currentColor` ou utilitários (`fill-rust stroke-rust`),
não hex no atributo.

## Classes de componente (`@layer components`)

| Classe | Onde |
|---|---|
| `.btn-primary` `.btn-accent` `.btn-ghost` `.btn-danger` | botões (preto, terracota, contorno, destrutivo); `.btn` é a base neutra |
| `.input` `.input-error` | campos de texto/select/textarea |
| `.label` | rótulo de campo (caixa alta pequena) |
| `.card` | caixa branca com borda `line` |
| `.eyebrow` | sobretítulo em caixa alta acima de títulos |
| `.chip` | etiqueta arredondada (tags do restaurante) |

Estão em `@layer components` de propósito: um utilitário no `className`
sempre vence (`<button className="btn-primary py-2">`).

Componentes React equivalentes em `components/ui.tsx`: `Field`, `TextArea`,
`Checkbox`, `Toggle`, `Spinner`, `PageLoader`, `EmptyState`, `SectionTitle`,
`Stars`, `Avatar`, `Logo`. Use-os em vez de remontar o markup.

## Tipografia

- `font-serif` (Playfair Display) para títulos e números grandes (métricas).
- `font-sans` (Noto Sans JP) para todo o resto — é o padrão do `body`.
- Tamanhos de corpo pequenos e precisos (`text-[13px]`, `text-[11px]`) são
  intencionais no layout editorial; títulos usam `clamp()` para escalar.

## Voz

Textos da interface em **minúsculas** ("explorar restaurantes", "salvar
alterações"), inclusive nomes de restaurante em títulos (`lowercase`).
Exceções: toasts, que são frases completas ("Dados atualizados."), e o
logotipo DATAFOOD.

## Layout e responsividade

- Contêiner de página: `mx-auto max-w-6xl px-4 sm:px-8` (formulários e
  detalhe usam `max-w-3xl`/`max-w-5xl`).
- Mobile first; breakpoints usados: `sm` (640), `md` (768, navegação
  desktop), `lg` (1024, sidebar do chat e grade do painel).
- Grade de cards: `CardGrid` (1 → 2 → 3 colunas).

## Imagens

Capas e fotos são URLs arbitrárias cadastradas pelos donos → `<img>` comum
(`@next/next/no-img-element` desligado no ESLint). Sem capa, `Cover` mostra
uma `Illustration` escolhida pelo id. `next/image` só para assets locais
(logo, hero).

## Animação

`animate-fade-in` (entrada de cards e mensagens, com `animationDelay`
escalonado) e `.typing-dot` (indicador "buscando"). Nada além disso.
