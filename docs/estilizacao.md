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

Para pedir confirmação antes de uma ação, use `useConfirm()` de
`components/ConfirmDialog.tsx` e renderize `confirmation` na tela que possui a ação.
`await confirm({ title, description, confirmLabel, tone: 'danger' })` devolve
`true` somente ao confirmar. Cancelar, Escape, clicar no fundo ou desmontar a
tela devolve `false`. O dialog mantém o foco dentro dele, começa no botão de
cancelar e devolve o foco à ação de origem. O estado fica local à tela.
Use `useToast()` para avisar sucesso ou erro depois da requisição.
O ESLint bloqueia `alert()`, `confirm()` e `prompt()` do navegador.

## Tipografia

- `font-serif` (Playfair Display) para títulos e números grandes (métricas).
- `font-sans` (DM Sans) para todo o resto — é o padrão do `body`.
- Fontes locais em `public/fonts/`, incluindo licenças, sem requisições ao Google Fonts em runtime.
- Tamanhos de corpo pequenos e precisos (`text-[13px]`, `text-[11px]`) são
  intencionais no layout editorial; títulos usam `clamp()` para escalar.

## Voz

**Caixa de frase** em toda a interface: só a primeira letra maiúscula, como
numa frase ("Explorar restaurantes", "Salvar alterações", "Nova
promoção"). Vale para títulos, botões, rótulos, abas, placeholders,
mensagens de erro e toasts.

- Nomes próprios e siglas mantêm a grafia: DataFood, WhatsApp, Telegram,
  LGPD, CPF, CNPJ, CEP, URL, UF.
- Nome de restaurante e de taxonomia aparecem **como cadastrados** — nada de
  `lowercase`/`capitalize`/`toLowerCase()` em dado vindo da API.
- `.label` e `.eyebrow` usam caixa de frase, com peso e cor para hierarquia.
- Continuação de frase depois de `·` ou `—` segue minúscula
  ("Cupom SEXTOU · válida até 25 out.").
- Logotipo: `datafood.` em Playfair Display, acompanhado do símbolo da marca;
  o link mantém o nome acessível "DataFood — início".

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

Motion for React é configurado em `components/Motion.tsx`, com `LazyMotion`,
`domMax` e `MotionConfig reducedMotion="user"`. Use `m` em vez de `motion`
para reutilizar o pacote de funcionalidades do provider. A transição padrão
usa a curva `[0.22, 1, 0.36, 1]`.

- A home tem entrada sequenciada do título e fotografias, paralaxe suave e
  `Reveal` nas seções. Não aplique animações contínuas a conteúdo de leitura.
- Navegação e abas usam `layoutId` dentro de `LayoutGroup`. Formulários e
  conteúdo de abas fazem transição por opacidade, preservando seu comportamento.
- Favoritos e toasts usam `AnimatePresence` para confirmar ações; gráficos
  revelam suas barras quando entram na tela.
- A galeria usa um `<dialog>` nativo para foco, Escape e navegação por teclado.
- `app/template.tsx` anima somente opacidade: transforms em um ancestral
  mudariam a referência dos elementos fixos do chat e dos menus.
- `prefers-reduced-motion` também desliga animações CSS e rolagem suave.

Novos tokens: `sage`/`olive` para superfícies secundárias, `butter` para
destaques, `peach` para feedback e `paper` para cards e campos. O creme da
marca é `#faf7f0` e a terracota é `#c4512f`.

Fotos editoriais ficam em `public/images/` em WebP. São usadas apenas nas
seções institucionais; fotos de restaurantes continuam vindo da API.
Sem foto cadastrada, mantenha a ilustração identificada.

Fotos editoriais obtidas do Unsplash:
[mesa compartilhada](https://images.unsplash.com/photo-1555939594-58d7cb561ad1),
[massa fresca](https://images.unsplash.com/photo-1473093226795-af9932fe5856),
[café](https://images.unsplash.com/photo-1511081692775-05d0f180a065) e
[ambiente de restaurante](https://images.unsplash.com/photo-1517248135467-4c7edcad34c4).
As licenças das fontes estão junto aos arquivos em `public/fonts/`.
