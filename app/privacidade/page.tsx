import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'

export const metadata: Metadata = { title: 'Política de privacidade' }

export default function PrivacidadePage() {
  return (
    <LegalPage title="política de privacidade" updated="setembro de 2026">
      <p>Esta política descreve quais dados pessoais o datafood trata, para quê e quais são os seus direitos, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>

      <h2>dados que coletamos</h2>
      <ul>
        <li><strong>Cadastro:</strong> nome, e-mail, senha (armazenada apenas como hash), e opcionalmente CPF, telefone, data de nascimento, gênero e foto.</li>
        <li><strong>Uso do serviço:</strong> restaurantes que você salva e avaliações que publica.</li>
        <li><strong>Personalização (só com seu consentimento):</strong> suas buscas recentes (até 50) e os restaurantes que você visualiza, usados para calcular suas afinidades de cozinha, ambiente e preço.</li>
        <li><strong>Métricas agregadas:</strong> contamos visualizações de cada página de restaurante sem vincular a quem visualizou.</li>
      </ul>

      <h2>bases legais e finalidades</h2>
      <ul>
        <li>Execução do contrato (art. 7º, V): manter sua conta, autenticação, salvos e avaliações.</li>
        <li>Consentimento (art. 7º, I): histórico de buscas e afinidades para personalizar recomendações. O consentimento é opcional, vem desligado e pode ser revogado a qualquer momento em <em>perfil → privacidade</em>.</li>
      </ul>

      <h2>compartilhamento</h2>
      <p>Não vendemos seus dados. Donos de restaurantes veem apenas números agregados (visualizações, favoritos, notas) e o primeiro nome de quem publicou uma avaliação. Suas conversas de busca ficam salvas apenas no seu navegador.</p>

      <h2>seus direitos</h2>
      <p>Você pode acessar e corrigir seus dados no perfil, revogar o consentimento, e encerrar sua conta — o acesso é bloqueado imediatamente. Para exercer outros direitos do art. 18 da LGPD (portabilidade, eliminação, informação sobre compartilhamento), fale com o encarregado pelo canal de contato indicado na plataforma.</p>

      <h2>segurança</h2>
      <p>Tráfego criptografado (HTTPS), senhas com hash, tokens de sessão de curta duração e limites de tentativa de login.</p>
    </LegalPage>
  )
}
