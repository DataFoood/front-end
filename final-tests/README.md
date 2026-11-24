# final-tests (front)

Rodada final de testes de integração com a API e de gerenciamento de estado
(2026-09-28).

| Arquivo | O quê |
|---|---|
| `navigation.mjs` | navegação E2E (Playwright) como visitante, cliente novo e dono, contra front + API reais |
| `promotions.mjs` | E2E das promoções (16 checagens): opt-in no perfil, criar/enviar no painel, link do WhatsApp, vitrine pública, descadastro pelo link do e-mail |
| `render-hook.js` | contador de renders por componente (imita o React DevTools); usado pelo E2E |
| `package.json` | isolado do app: o Playwright não entra nas dependências do front |

## Como rodar

1. Back de pé com seed (ver `back/final-tests/README.md`):
   `seed_demo --demo-users` + `reindex_restaurants`, API em `:8000`.
2. Front em modo **dev** (o contador de renders só funciona no build de dev):
   `bun run dev` na raiz → `:3000`.
3. Aqui:

```bash
cd final-tests
bun install
bunx playwright install chromium   # 1ª vez
bun run e2e                        # HEADED=1 bun run e2e para ver o navegador
API_LOG=/caminho/do/log-da-api bun run e2e:promocoes
```

Cada execução gasta 1 da cota diária de promoções do Dallas (3 por padrão;
remover não devolve a cota): para repetir no mesmo dia, suba a API com
`PROMOTIONS_MAX_PER_DAY=100`.

`e2e:promocoes` lê o log da API para achar o e-mail (backend de console) e
testar o link de descadastro; sem `API_LOG` essa parte é pulada. Com Celery
eager (`CELERY_TASK_ALWAYS_EAGER=True`) o envio acontece na própria
requisição; com worker, ele precisa estar de pé.

Variáveis: `FRONT_URL`, `API_URL`, `HEADED=1`, `CHROMIUM_PATH` (navegador
já instalado). O roteiro faz 3 logins e 1 cadastro: o back limita login a
5/min e cadastro a 10/h por IP — espere 1 min entre execuções ou, em dev,
`redis-cli -n 1 flushdb`.

Efeitos colaterais: cria uma conta `e2e-…@e2e.test` e um restaurante
`E2E Temp …` do dono demo, e remove os dois no fim; edita e restaura a
descrição e salva os horários do restaurante demo.

## O que é verificado (50 checagens)

- **Visitante:** landing com destaques da API; `/explorar` com busca por nome,
  momento digitado na home preservado no redirecionamento para login;
  filtro na URL e "limpar filtros"; detalhe; salvar sem login → login com
  `?next=`; `/perfil`, `/salvos`, `/painel`, `/chat` exigem login; 404; slug
  inexistente.
- **Cliente novo:** validação do cadastro; cadastro já loga; logado não vê
  `/cadastro`; busca semântica; favoritar pelo chat e contador do header;
  conversa salva na conta persiste após recarregar; `/salvos`; avaliar e
  excluir avaliação; salvar perfil; histórico com consentimento; desligar
  consentimento; sessão só em cookies HttpOnly (nada de token no
  `localStorage`); trocar senha **e continuar logado** com o access vencido
  (refresh pelo cookie); logout numa aba desloga a outra; encerrar
  conta e não conseguir entrar de novo.
- **Dono:** painel com métricas; todas as abas (inclusive promoções); salvar informações e horários;
  cadastrar restaurante pelo painel; trocar de restaurante sem herdar o
  endereço do anterior; remover; "editar no painel" na página pública; ver a
  própria página não soma visualização.
- **Renders:** digitar no `/explorar` não re-renderiza a lista; digitar no
  chat não re-renderiza o histórico; favoritar re-renderiza só o botão
  clicado.
- **Runtime:** nenhum erro de console, exceção ou resposta 5xx em toda a
  navegação.

## Medição de renders (antes → depois)

Contagem de componentes que renderizaram durante a interação (build de dev,
9 restaurantes na lista):

| Interação | Antes | Depois |
|---|---|---|
| digitar 6 letras na busca do `/explorar` | 6× `Explorer` + 54× `RestaurantCard` (+ capa, badge, botão de cada card) | 6× `SearchBox` |
| favoritar 1 card no `/explorar` | 9× `FavoriteButton` + `FavoritesProvider` | 1× `FavoriteButton` (+ header, pelo contador) |
| digitar 5 letras no chat com 3 resultados na tela | 5× `ChatApp` + 15× `RestaurantCard` + bolhas | 5× `Composer` |
| abrir a aba privacidade do perfil | 5× `PrivacyPanel` | 2× `PrivacyPanel` |

## Achados e correções no front

| # | Tipo | Problema | Correção |
|---|---|---|---|
| 1 | integração | Com a revogação de sessões na troca de senha (correção do back), a aba atual cairia no próximo refresh. | Front guarda o par novo devolvido pelo back. |
| 2 | estado | Favoritos no value do context → todo consumidor re-renderizava a cada clique. | Store estável + seletores com `useSyncExternalStore`. |
| 3 | estado | Favoritos eram rebuscados a cada `setUser` (salvar perfil, consentimento): o effect dependia do objeto `user`. | Depende só do id. |
| 4 | render | Inputs de busca (explorar, chat) re-renderizavam a lista a cada tecla. | `SearchBox` e `Composer` com estado próprio; `memo` em cards e bolhas. |
| 5 | sessão | API fora do ar na hora de restaurar a sessão deslogava o usuário. | Só descarta tokens em 401/403. |
| 6 | sessão | Logout em outra aba não refletia; se acontecesse durante a restauração, a resposta do `/me` relogava a aba sem tokens. | Evento `storage` + checagem de tokens antes do `setUser`. |
| 7 | sessão | Duas abas renovando ao mesmo tempo: a segunda usava o refresh já rotacionado (blacklist) e deslogava. | Se o storage já tem um par novo, usa ele. |
| 8 | painel | Trocar de restaurante na aba endereço mantinha o formulário do anterior. | Editores chaveados pelo id do restaurante. |
| 9 | painel | Um erro de carregamento travava o painel até recarregar a página; falha no GET de endereços virava unhandled rejection. | Erro por restaurante; toast no endereço. |
| 10 | UX | Admin não podia avaliar pela interface (o back permite); `/cadastro` aparecia para quem já estava logado; slider de afinidade mandava 2 PATCH no touch. | Regras alinhadas ao back; redirect; `onPointerUp`. |
| 11 | padrão | ~250 cores hex arbitrárias fora dos tokens do `@theme`. | Tokens com os mesmos valores (screenshots idênticos pixel a pixel). |
| 12 | tooling | `bun run typecheck` falhava num clone limpo (sem `next-env.d.ts`). | Roda `next typegen` antes. |

Padrões resultantes documentados em [`../docs/`](../docs/README.md).

## BI, atribuição e resgates

`bun run e2e:bi` usa as contas e restaurante demo. Publica uma campanha sem
canais externos, abre o link assinado como visitante, registra contato sem
realizar ligação, confirma um resgate pelo painel, confere a atribuição, CSV e
layout móvel. Não rode contra produção. O resgate permanece na auditoria demo.
Variáveis: `FRONT_URL`, `API_URL`, `CHROMIUM_PATH`, `SCREENSHOT_PATH` opcional.
Repetições gastam a cota diária mesmo removendo a campanha; use configuração
local de testes com `PROMOTIONS_MAX_PER_DAY` alto. Não altere o padrão de produção.

## Modo escolha

O trecho de chat simula somente a geração do turno; a conversa de teste é criada
na API, e seleção, cookies e favoritos usam o backend real. A conversa é removida
ao terminar. O teste não mede a qualidade ou o desempenho do modelo local.

`bun run e2e:escolha` usa somente as contas demo. Liga a preferência pelo perfil,
confere persistência em outro navegador, adiciona duas imagens temporárias ao
restaurante demo e testa fotos, swipes reais via Chromium/CDP, rolagem vertical,
arraste curto, teclado, escolha de favorito existente, erro ao salvar e retorno
à grade. Restaura a preferência, favoritos acrescentados e fotos ao terminar.
Não execute contra produção. Variáveis: `FRONT_URL`, `API_URL`, `CHROMIUM_PATH`
e `SCREENSHOT_PATH` opcional.

## Confirmações na interface

`bun run e2e:confirmacoes` usa respostas controladas no navegador, sem alterar
o backend. Confere exclusão de pratos, avaliações, restaurantes e promoções,
além da publicação de campanhas, em telas de 320, 390 e 1440 px. Valida foco,
Escape, cancelamento pelo fundo, saída da tela, falha e nova tentativa de envio,
confirmação única e ausência de diálogos do navegador. Variáveis: `FRONT_URL`,
`CHROMIUM_PATH` e `SCREENSHOT_DIR` opcional.

## Conversa e recomendações em tela cheia

`bun run e2e:chat` precisa somente do frontend. Usa API e contas simuladas em
contextos de navegador isolados, sem escrever no backend. Cobre free/premium,
contagem 12→4, abertura sob demanda, swipe real/teclado, fotos, fechar/Escape,
rascunho, foco, progresso, erro e nova tentativa de seleção/favorito, troca de
conversa e recarga, em 390×844, 1440×1000 e 320×640. Verifica o console.
Variáveis: `FRONT_URL`, `CHROMIUM_PATH`, `SCREENSHOT_DIR` opcional. A inferência
é simulada; o ensaio real no Ollama da VPS continua necessário.

Também cobre início pelos gostos em premium no celular/desktop, acesso às
preferências, explicação da seleção e próximos pedidos retornados pelo servidor.
Somente o último turno oferece os refinamentos; clicar continua a conversa
preservando o acesso aos cards anteriores. A escolha dos refinamentos e as
regras de consentimento são verificadas com banco nos testes do backend.

## Cupom premium

`bun run e2e:cupom` testa o perfil em 390 e 1440 pixels com API simulada:
código inválido, correção, ativação, recarga e reconhecimento do plano no chat,
sem mudar consentimento ou permissões. Precisa do frontend rodando;
`FRONT_URL` e `CHROMIUM_PATH` opcionais. O teste não usa o cupom real.
