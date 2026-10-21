import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'

export const metadata: Metadata = { title: 'Termos de uso' }

export default function TermosPage() {
  return (
    <LegalPage title="Termos de uso" updated="setembro de 2026">
      <p>Ao criar uma conta no DataFood você concorda com estes termos.</p>
      <h2>O serviço</h2>
      <p>O DataFood recomenda restaurantes a partir de descrições em linguagem natural. As recomendações são sugestões: informações como horários, preços e cardápio são mantidas pelos próprios restaurantes e podem mudar sem aviso.</p>
      <h2>Sua conta</h2>
      <ul>
        <li>Você é responsável por manter sua senha em sigilo e pelas atividades feitas na sua conta.</li>
        <li>As informações de cadastro devem ser verdadeiras.</li>
      </ul>
      <h2>Avaliações e conteúdo</h2>
      <ul>
        <li>Avaliações devem refletir experiências reais. Não é permitido conteúdo ofensivo, discriminatório, ilegal ou avaliar o próprio restaurante.</li>
        <li>Podemos remover conteúdo que viole estes termos.</li>
      </ul>
      <h2>Restaurantes</h2>
      <p>Donos de restaurante são responsáveis pela veracidade das informações publicadas e por ter direito de uso das imagens cadastradas.</p>
      <h2>Encerramento</h2>
      <p>Você pode encerrar sua conta a qualquer momento no perfil. Podemos suspender contas que violem estes termos.</p>
    </LegalPage>
  )
}
