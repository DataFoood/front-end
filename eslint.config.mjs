import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const config = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // capas/fotos vêm de URLs arbitrárias cadastradas pelos donos
      '@next/next/no-img-element': 'off',
      'no-restricted-globals': ['error', {
        checkGlobalObject: true,
        globals: [
          { name: 'alert', message: 'Use useToast() para mensagens na interface.' },
          { name: 'confirm', message: 'Use useConfirm() de components/ConfirmDialog para confirmações na interface.' },
          { name: 'prompt', message: 'Use um formulário ou dialog na interface.' },
        ],
      }],
    },
  },
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
]

export default config
