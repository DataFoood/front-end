import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'

export const metadata: Metadata = { title: 'Termos de uso' }

export default function TermosPage() {
  return (
    <LegalPage title="termos de uso" updated="setembro de 2026">
      <p>Ao criar uma conta no datafood você concorda com estes termos.</p>
      <h2>o serviço</h2>
      <p>O datafood recomenda restaurantes a partir de descrições em linguagem natural. As recomendações são sugestões: informações como horários, preços e cardápio são mantidas pelos próprios restaurantes e podem mudar sem aviso.</p>
      <h2>sua conta</h2>
      <ul>
        <li>Você é responsável por manter sua senha em sigilo e pelas atividades feitas na sua conta.</li>
        <li>As informações de cadastro devem ser verdadeiras.</li>
      </ul>
      <h2>avaliações e conteúdo</h2>
      <ul>
        <li>Avaliações devem refletir experiências reais. Não é permitido conteúdo ofensivo, discriminatório, ilegal ou avaliar o próprio restaurante.</li>
        <li>Podemos remover conteúdo que viole estes termos.</li>
      </ul>
      <h2>restaurantes</h2>
      <p>Donos de restaurante são responsáveis pela veracidade das informações publicadas e por ter direito de uso das imagens cadastradas.</p>
      <h2>encerramento</h2>
      <p>Você pode encerrar sua conta a qualquer momento no perfil. Podemos suspender contas que violem estes termos.</p>
    </LegalPage>
  )
}
