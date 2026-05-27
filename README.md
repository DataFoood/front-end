# datafood

Aplicativo de recomendação de restaurantes por momento — Next.js 14 + TypeScript + Tailwind CSS.

## Páginas

| Rota | Página |
|------|--------|
| `/` | Landing page (com planos, como funciona, para restaurantes) |
| `/chat` | App de chat com sidebar retrátil |
| `/login` | Tela de login |
| `/cadastro` | Tela de criação de conta |

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em desenvolvimento
npm run dev

# 3. Abrir no browser
# http://localhost:3000
```

## Estrutura

```
datafood/
├── app/
│   ├── layout.tsx        # Root layout (fontes, metadata)
│   ├── globals.css       # CSS global + variáveis + animações
│   ├── page.tsx          # Landing page (/)
│   ├── chat/
│   │   └── page.tsx      # Chat com sidebar retrátil (/chat)
│   ├── login/
│   │   └── page.tsx      # Login (/login)
│   └── cadastro/
│       └── page.tsx      # Cadastro (/cadastro)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Funcionalidades implementadas

- **Chat**: sidebar retrátil, histórico de chats, sugestões de prompt, respostas mock animadas, typing indicator
- **Login**: validação, loading state, redirecionamento para `/chat`
- **Cadastro**: form completo com checkbox de termos, dropdown de cidades, loading state
- **Landing**: nav com âncoras, seção de planos, como funciona, insights para restaurantes, manifesto

## Design

- Paleta: creme `#F5F0E8`, preto `#0D0D0D`, terracota `#C0603A`
- Tipografia: Playfair Display (serif) + DM Sans (sans-serif)
- Animações CSS puras (fadeIn, slideIn, typing dots)
