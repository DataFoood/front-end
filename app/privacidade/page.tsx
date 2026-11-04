import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'

export const metadata: Metadata = { title: 'Política de privacidade' }

export default function PrivacidadePage() {
  return (
    <LegalPage title="Política de privacidade" updated="novembro de 2026">
      <p>Esta política descreve quais dados pessoais o DataFood trata, para quê e quais são os seus direitos, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>

      <h2>Dados que coletamos</h2>
      <ul>
        <li><strong>Cadastro:</strong> nome, e-mail, senha (armazenada apenas como hash), e opcionalmente CPF, telefone, data de nascimento, gênero e foto.</li>
        <li><strong>Uso do serviço:</strong> restaurantes que você salva, avaliações que publica e as conversas da busca inteligente (guardadas na sua conta para você retomá-las em qualquer navegador).</li>
        <li><strong>Promoções (só com seu consentimento):</strong> se você aceitar receber promoções, guardamos a data do aceite, os canais escolhidos (e-mail, Telegram) e o vínculo com o Telegram.</li>
        <li><strong>Personalização (só com seu consentimento):</strong> suas buscas recentes (até 50) e os restaurantes que você visualiza, usados para calcular suas afinidades de cozinha, ambiente e preço.</li>
        <li><strong>Medição de interesse:</strong> registramos aparições em resultados, aberturas de páginas e cliques em contato, cardápio ou rota, sem vincular os eventos à sua conta. Links de campanha identificam a campanha e o canal, não o destinatário. Esses eventos são mantidos por até 180 dias para comparação de períodos.</li>
        <li><strong>Operação:</strong> contagens de requisições, erros e faixas de latência são agregadas por minuto e mantidas por 28 dias. Essa medição não armazena o texto das buscas.</li>
      </ul>

      <h2>Bases legais e finalidades</h2>
      <ul>
        <li>Execução do contrato (art. 7º, V): manter sua conta, autenticação, salvos e avaliações.</li>
        <li>Consentimento (art. 7º, I): histórico de buscas e afinidades para personalizar recomendações. O consentimento é opcional, vem desligado e pode ser revogado a qualquer momento em <em>Perfil → Privacidade</em>.</li>
        <li>Consentimento (art. 7º, I): envio de promoções dos restaurantes que você salvou. Opcional, desligado por padrão e revogável em <em>Perfil → Promoções</em>, pelo link de cada e-mail ou enviando /sair no Telegram.</li>
      </ul>

      <h2>Preferências de medição</h2>
      <p>A medição de interesse não cria identificador persistente no seu navegador e respeita a preferência Do Not Track. Bloqueadores também podem reduzir a medição. Resgates de cupons são confirmados pelo restaurante com uma referência interna, sem solicitar seu CPF ou telefone para essa finalidade.</p>

      <h2>Compartilhamento</h2>
      <p>Não vendemos seus dados. Donos de restaurantes veem apenas números agregados (visualizações, favoritos, notas) e o primeiro nome de quem publicou uma avaliação. Suas conversas de busca só são visíveis para você, e seu telefone nunca é repassado a restaurantes.</p>

      <h2>Seus direitos</h2>
      <p>Você pode acessar e corrigir seus dados no perfil, revogar o consentimento, e encerrar sua conta — o acesso é bloqueado imediatamente e suas conversas de busca são apagadas. Para exercer outros direitos do art. 18 da LGPD (portabilidade, eliminação, informação sobre compartilhamento), fale com o encarregado pelo canal de contato indicado na plataforma.</p>

      <h2>Segurança</h2>
      <p>Tráfego criptografado (HTTPS), senhas com hash, sessão em cookies protegidos (inacessíveis a scripts da página) renovada automaticamente, e limites de tentativa de login.</p>
    </LegalPage>
  )
}
