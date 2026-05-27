export type Illustration = 'bowl' | 'glass' | 'plate'

export interface MenuItem {
  name: string
  price: number
  description: string
  tags: string[]
  illustration: Illustration
}

export interface Schedule {
  day: string
  hours: string
  highlight?: boolean
}

export interface Restaurant {
  slug: string
  name: string
  neighborhood: string
  cuisine: string
  price: string
  match: number
  description: string
  longDescription: string[]
  illustration: Illustration
  address: string
  capacity: number
  capacityNote: string
  ticketAvg: string
  ticketNote: string
  phone: string
  phoneNote: string
  tags: string[]
  isOpen: boolean
  menu: MenuItem[]
  schedule: Schedule[]
}

export const RESTAURANTS: Record<string, Restaurant> = {
  tuju: {
    slug: 'tuju',
    name: 'tuju',
    neighborhood: 'vila madalena',
    cuisine: 'contemporâneo',
    price: '$$$$',
    match: 96,
    description: 'iluminação baixa, mesas espaçadas. carta de vinhos curada por sommelier.',
    longDescription: [
      'tuju nasceu em 2014 com a proposta de traduzir ingredientes brasileiros em uma linguagem contemporânea. iluminação baixa, mesas de madeira espaçadas e atendimento atento criam o ambiente certo para conversas longas.',
      'o chef trabalha exclusivamente com produtores diretos — pequenos sítios em são paulo, paraná e minas. o menu muda a cada estação.',
    ],
    illustration: 'bowl',
    address: 'r. fradique coutinho, 1248\nvila madalena · sp',
    capacity: 38,
    capacityNote: 'reserva recomendada',
    ticketAvg: 'R$ 220',
    ticketNote: 'sem bebida',
    phone: '(11) 4555-1248',
    phoneNote: 'whatsapp disponível',
    tags: ['vila madalena', 'contemporâneo', '$$$$', 'aberto agora'],
    isOpen: true,
    menu: [
      {
        name: 'moqueca de palmito',
        price: 92,
        description: 'palmito pupunha grelhado, leite de coco caseiro, dendê e arroz de jasmim.',
        tags: ['vegetariano', 'principal'],
        illustration: 'plate',
      },
      {
        name: 'barriga de porco',
        price: 118,
        description: 'cozimento lento de 14h, mandioquinha defumada, jus de maracujá-do-mato.',
        tags: ['principal', 'assinatura'],
        illustration: 'bowl',
      },
      {
        name: 'doce de leite & cupuaçu',
        price: 38,
        description: 'ganache de cupuaçu, doce de leite caramelado, biscoito de polvilho.',
        tags: ['sobremesa'],
        illustration: 'glass',
      },
    ],
    schedule: [
      { day: 'segunda', hours: 'fechado' },
      { day: 'terça · hoje', hours: '19:00 – 23:30', highlight: true },
      { day: 'quarta', hours: '19:00 – 23:30' },
      { day: 'quinta', hours: '19:00 – 23:30' },
      { day: 'sexta', hours: '19:00 – 00:30' },
      { day: 'sábado', hours: '12:30 – 16:00 · 19:00 – 00:30' },
      { day: 'domingo', hours: '12:30 – 16:00' },
    ],
  },

  'a-casa-do-porco': {
    slug: 'a-casa-do-porco',
    name: 'a casa do porco',
    neighborhood: 'centro',
    cuisine: 'brasileiro',
    price: '$$$',
    match: 91,
    description: 'ambiente íntimo no segundo andar, luz quente. reservar com antecedência.',
    longDescription: [
      'eleito um dos melhores restaurantes do mundo, a casa do porco celebra o suíno em todas as formas. o chef jefferson rueda transforma cortes inteiros em experiências gastronômicas únicas.',
      'o segundo andar abriga um salão mais reservado, perfeito para jantares longos. o menu degustação percorre desde a charcutaria até a sobremesa, com harmonização disponível.',
    ],
    illustration: 'glass',
    address: 'r. araújo, 124\nrepública · sp',
    capacity: 60,
    capacityNote: 'reserva obrigatória',
    ticketAvg: 'R$ 180',
    ticketNote: 'menu degustação',
    phone: '(11) 3258-2578',
    phoneNote: 'reservas online',
    tags: ['centro', 'brasileiro', '$$$', 'aberto agora'],
    isOpen: true,
    menu: [
      {
        name: 'porchetta fatiada',
        price: 76,
        description: 'leitão assado por 8h, ervas frescas, mostarda artesanal e pão de fermentação.',
        tags: ['entrada', 'assinatura'],
        illustration: 'bowl',
      },
      {
        name: 'costela ao tucupi',
        price: 145,
        description: 'costela bovina braseada, caldo de tucupi, jambu e farinha d\'água torrada.',
        tags: ['principal'],
        illustration: 'plate',
      },
      {
        name: 'pudim de toucinho',
        price: 42,
        description: 'pudim cremoso com calda de rapadura e farofa de bacon crocante.',
        tags: ['sobremesa', 'assinatura'],
        illustration: 'glass',
      },
    ],
    schedule: [
      { day: 'segunda', hours: 'fechado' },
      { day: 'terça', hours: 'fechado' },
      { day: 'quarta · hoje', hours: '12:00 – 15:00 · 19:00 – 23:00', highlight: true },
      { day: 'quinta', hours: '12:00 – 15:00 · 19:00 – 23:00' },
      { day: 'sexta', hours: '12:00 – 15:00 · 19:00 – 00:00' },
      { day: 'sábado', hours: '12:00 – 16:00 · 19:00 – 00:00' },
      { day: 'domingo', hours: '12:00 – 16:00' },
    ],
  },

  evvai: {
    slug: 'evvai',
    name: 'evvai',
    neighborhood: 'jardins',
    cuisine: 'italiano',
    price: '$$$$',
    match: 88,
    description: 'salão pequeno, atendimento atento. cozinha de autor.',
    longDescription: [
      'evvai é a expressão mais pessoal do chef luiz filipe souza. o salão comporta apenas 30 pessoas, criando uma experiência quase privativa. cada prato é pensado como uma sequência de memórias italianas reinterpretadas.',
      'a carta de vinhos, com mais de 200 rótulos italianos, é uma das mais completas da cidade. o serviço de sala é conduzido pelo próprio chef nas noites de maior movimento.',
    ],
    illustration: 'plate',
    address: 'r. joaquim antunes, 108\njardins · sp',
    capacity: 30,
    capacityNote: 'reserva obrigatória',
    ticketAvg: 'R$ 290',
    ticketNote: 'sem bebida',
    phone: '(11) 3062-1505',
    phoneNote: 'whatsapp disponível',
    tags: ['jardins', 'italiano', '$$$$', 'aberto agora'],
    isOpen: true,
    menu: [
      {
        name: 'cacio e pepe trufado',
        price: 98,
        description: 'tonnarelli artesanal, pecorino romano DOP, pimenta-do-reino e trufa negra ralada na hora.',
        tags: ['massa', 'assinatura'],
        illustration: 'bowl',
      },
      {
        name: 'agnello al forno',
        price: 165,
        description: 'pernil de cordeiro assado lentamente, polenta cremosa e gremolata de limão-siciliano.',
        tags: ['principal'],
        illustration: 'plate',
      },
      {
        name: 'panna cotta al caffè',
        price: 48,
        description: 'creme de baunilha, calda de espresso concentrado e amaretti esfarelado.',
        tags: ['sobremesa'],
        illustration: 'glass',
      },
    ],
    schedule: [
      { day: 'segunda', hours: 'fechado' },
      { day: 'terça', hours: 'fechado' },
      { day: 'quarta · hoje', hours: '19:30 – 23:00', highlight: true },
      { day: 'quinta', hours: '19:30 – 23:00' },
      { day: 'sexta', hours: '19:30 – 00:00' },
      { day: 'sábado', hours: '12:30 – 15:30 · 19:30 – 00:00' },
      { day: 'domingo', hours: '12:30 – 15:30' },
    ],
  },

  // Café results
  'coffee-lab': {
    slug: 'coffee-lab',
    name: 'coffee lab',
    neighborhood: 'vila madalena',
    cuisine: 'café especialidade',
    price: '$$',
    match: 94,
    description: 'wifi rápido, tomadas em todas as mesas. silêncio respeitado pela galera.',
    longDescription: [
      'referência em café de especialidade em são paulo, o coffee lab recebe produtores, baristas e entusiastas em um espaço pensado para quem leva o café a sério — mas sem arrogância.',
      'wifi estável, tomadas em todas as mesas e uma política tácita de silêncio fazem do coffee lab o lugar favorito de freelancers e times remotos da cidade.',
    ],
    illustration: 'glass',
    address: 'r. fradique coutinho, 1340\nvila madalena · sp',
    capacity: 45,
    capacityNote: 'sem reserva',
    ticketAvg: 'R$ 32',
    ticketNote: 'por pessoa',
    phone: '(11) 3375-7400',
    phoneNote: 'whatsapp disponível',
    tags: ['vila madalena', 'café especialidade', '$$'],
    isOpen: true,
    menu: [
      {
        name: 'coado chemex',
        price: 18,
        description: 'método de filtro que realça acidez e clareza. grão de origem única da fazenda recanto, MG.',
        tags: ['café', 'filtrado'],
        illustration: 'glass',
      },
      {
        name: 'espresso duplo',
        price: 12,
        description: 'blend exclusivo da casa, notas de chocolate amargo e caramelo, cremoso e encorpado.',
        tags: ['café', 'clássico'],
        illustration: 'bowl',
      },
      {
        name: 'bolo de banana com café',
        price: 16,
        description: 'bolo úmido de banana, cobertura de ganache de café e nozes tostadas.',
        tags: ['food', 'vegano'],
        illustration: 'plate',
      },
    ],
    schedule: [
      { day: 'segunda', hours: '08:00 – 20:00' },
      { day: 'terça · hoje', hours: '08:00 – 20:00', highlight: true },
      { day: 'quarta', hours: '08:00 – 20:00' },
      { day: 'quinta', hours: '08:00 – 20:00' },
      { day: 'sexta', hours: '08:00 – 21:00' },
      { day: 'sábado', hours: '09:00 – 21:00' },
      { day: 'domingo', hours: '09:00 – 18:00' },
    ],
  },

  'nespresso-boutique': {
    slug: 'nespresso-boutique',
    name: 'nespresso boutique',
    neighborhood: 'itaim',
    cuisine: 'café',
    price: '$$$',
    match: 89,
    description: 'espaço amplo, luz natural, atendimento discreto. perfeito para reuniões.',
    longDescription: [
      'a boutique do itaim foi reformada com foco em espaço de trabalho e reuniões. mesas amplas, luz natural e acústica controlada tornam o ambiente ideal para quem precisa de concentração ou de um encontro profissional.',
      'o atendimento é discreto e eficiente. os cafés são preparados com equipamentos de última geração e servidos com a precisão característica da marca.',
    ],
    illustration: 'bowl',
    address: 'r. jerônimo da veiga, 384\nitaim bibi · sp',
    capacity: 70,
    capacityNote: 'sem reserva',
    ticketAvg: 'R$ 45',
    ticketNote: 'por pessoa',
    phone: '0800 722 3300',
    phoneNote: 'central de atendimento',
    tags: ['itaim', 'café', '$$$'],
    isOpen: true,
    menu: [
      {
        name: 'flat white',
        price: 22,
        description: 'espresso duplo com leite vaporizado sedoso, textura cremosa e sabor equilibrado.',
        tags: ['café', 'clássico'],
        illustration: 'bowl',
      },
      {
        name: 'cold brew tônica',
        price: 28,
        description: 'extrato de café frio concentrado, água tônica premium e casca de laranja.',
        tags: ['café', 'gelado'],
        illustration: 'glass',
      },
      {
        name: 'croissant de amêndoas',
        price: 24,
        description: 'massa folhada amanteigada, creme frangipane e amêndoas laminadas tostadas.',
        tags: ['food', 'padaria'],
        illustration: 'plate',
      },
    ],
    schedule: [
      { day: 'segunda', hours: '07:00 – 21:00' },
      { day: 'terça · hoje', hours: '07:00 – 21:00', highlight: true },
      { day: 'quarta', hours: '07:00 – 21:00' },
      { day: 'quinta', hours: '07:00 – 21:00' },
      { day: 'sexta', hours: '07:00 – 21:00' },
      { day: 'sábado', hours: '08:00 – 20:00' },
      { day: 'domingo', hours: '09:00 – 18:00' },
    ],
  },

  madreselva: {
    slug: 'madreselva',
    name: 'madreselva',
    neighborhood: 'pinheiros',
    cuisine: 'café e bistrô',
    price: '$$',
    match: 85,
    description: 'jardim interno, mesas separadas, playlist baixa. bolo de cenoura excepcional.',
    longDescription: [
      'o madreselva ocupa uma casa dos anos 1940 reformada com cuidado. o jardim interno com ipê-amarelo é o coração do espaço — mesas separadas por canteiros criam bolsões de privacidade raros na cidade.',
      'a cozinha é simples e honesta: tortas, quiches, saladas e o famoso bolo de cenoura com cobertura de chocolate amargo que virou ponto de peregrinação entre os moradores de pinheiros.',
    ],
    illustration: 'plate',
    address: 'r. wisard, 489\npinheiros · sp',
    capacity: 35,
    capacityNote: 'sem reserva',
    ticketAvg: 'R$ 55',
    ticketNote: 'por pessoa',
    phone: '(11) 3081-2244',
    phoneNote: 'whatsapp disponível',
    tags: ['pinheiros', 'café e bistrô', '$$'],
    isOpen: true,
    menu: [
      {
        name: 'bolo de cenoura',
        price: 18,
        description: 'cenoura ralada na hora, calda de chocolate amargo 70%, porção generosa.',
        tags: ['doce', 'assinatura'],
        illustration: 'plate',
      },
      {
        name: 'quiche de alho-poró',
        price: 34,
        description: 'massa amanteigada, recheio cremoso de alho-poró, queijo gruyère e noz-moscada.',
        tags: ['salgado', 'vegetariano'],
        illustration: 'bowl',
      },
      {
        name: 'latte de lavanda',
        price: 20,
        description: 'espresso, leite vaporizado e xarope artesanal de lavanda orgânica.',
        tags: ['café', 'especial'],
        illustration: 'glass',
      },
    ],
    schedule: [
      { day: 'segunda', hours: 'fechado' },
      { day: 'terça · hoje', hours: '09:00 – 19:00', highlight: true },
      { day: 'quarta', hours: '09:00 – 19:00' },
      { day: 'quinta', hours: '09:00 – 19:00' },
      { day: 'sexta', hours: '09:00 – 20:00' },
      { day: 'sábado', hours: '09:00 – 20:00' },
      { day: 'domingo', hours: '10:00 – 17:00' },
    ],
  },

  // Aniversário results
  charco: {
    slug: 'charco',
    name: 'charco',
    neighborhood: 'pinheiros',
    cuisine: 'contemporâneo',
    price: '$$$',
    match: 97,
    description: 'mesa longa disponível, chef presente na sala. experiência gastronômica completa.',
    longDescription: [
      'charco é o projeto mais ambicioso do chef rafael gomes. o salão principal tem uma mesa comunitária para até 12 pessoas, ideal para celebrações em grupo. a cozinha é aberta e o chef circula entre as mesas com frequência.',
      'o menu muda semanalmente conforme a oferta do mercado. a carta de vinhos naturais é uma das mais cuidadosas da cidade, com seleção pessoal do sommelier residente.',
    ],
    illustration: 'plate',
    address: 'r. artur de azevedo, 542\npinheiros · sp',
    capacity: 50,
    capacityNote: 'reserva recomendada',
    ticketAvg: 'R$ 195',
    ticketNote: 'sem bebida',
    phone: '(11) 3062-2890',
    phoneNote: 'whatsapp disponível',
    tags: ['pinheiros', 'contemporâneo', '$$$', 'aberto agora'],
    isOpen: true,
    menu: [
      {
        name: 'ceviche de peixe branco',
        price: 68,
        description: 'peixe do dia, leite de tigre de maracujá, crocante de quinoa e coentro fresco.',
        tags: ['entrada', 'frutos do mar'],
        illustration: 'glass',
      },
      {
        name: 'picanha maturada 45 dias',
        price: 145,
        description: 'corte dry aged, acompanha arroz de cogumelos e molho chimichurri da casa.',
        tags: ['principal', 'assinatura'],
        illustration: 'bowl',
      },
      {
        name: 'torta de chocolate & flor de sal',
        price: 44,
        description: 'ganache 68% de cacau, base de castanha-do-pará e flor de sal de guérande.',
        tags: ['sobremesa'],
        illustration: 'plate',
      },
    ],
    schedule: [
      { day: 'segunda', hours: 'fechado' },
      { day: 'terça · hoje', hours: '19:00 – 23:30', highlight: true },
      { day: 'quarta', hours: '19:00 – 23:30' },
      { day: 'quinta', hours: '19:00 – 23:30' },
      { day: 'sexta', hours: '19:00 – 00:30' },
      { day: 'sábado', hours: '12:30 – 16:00 · 19:00 – 00:30' },
      { day: 'domingo', hours: '12:30 – 16:00' },
    ],
  },

  chou: {
    slug: 'chou',
    name: 'chou',
    neighborhood: 'jardins',
    cuisine: 'francês',
    price: '$$$$',
    match: 92,
    description: 'salão intimista com reserva de ambiente privativo para grupos.',
    longDescription: [
      'chou traz a elegância da brasserie parisiense para dentro de uma casa jardins. o ambiente privativo no térreo comporta até oito pessoas e pode ser reservado para ocasiões especiais com menu exclusivo.',
      'a cozinha clássica francesa é executada com rigor: molhos de longa cocção, técnica apurada e ingredientes importados convivem com produtos nacionais de excelência.',
    ],
    illustration: 'glass',
    address: 'r. lorena, 1696\njardins · sp',
    capacity: 45,
    capacityNote: 'reserva obrigatória',
    ticketAvg: 'R$ 280',
    ticketNote: 'sem bebida',
    phone: '(11) 3062-6987',
    phoneNote: 'reservas online',
    tags: ['jardins', 'francês', '$$$$', 'aberto agora'],
    isOpen: true,
    menu: [
      {
        name: 'foie gras poêlé',
        price: 128,
        description: 'foie gras grelhado, brioche tostado, geleia de figo e fleur de sel.',
        tags: ['entrada', 'assinatura'],
        illustration: 'plate',
      },
      {
        name: 'coq au vin',
        price: 148,
        description: 'frango caipira braseado no borgonha, cogumelos paris e purê de batata trufado.',
        tags: ['principal', 'clássico'],
        illustration: 'bowl',
      },
      {
        name: 'crème brûlée',
        price: 52,
        description: 'creme de baunilha de madagascar, açúcar caramelado na hora, frutas vermelhas frescas.',
        tags: ['sobremesa', 'clássico'],
        illustration: 'glass',
      },
    ],
    schedule: [
      { day: 'segunda', hours: 'fechado' },
      { day: 'terça', hours: 'fechado' },
      { day: 'quarta · hoje', hours: '19:30 – 23:30', highlight: true },
      { day: 'quinta', hours: '19:30 – 23:30' },
      { day: 'sexta', hours: '19:30 – 00:30' },
      { day: 'sábado', hours: '12:00 – 16:00 · 19:30 – 00:30' },
      { day: 'domingo', hours: '12:00 – 16:00' },
    ],
  },

  banzeiro: {
    slug: 'banzeiro',
    name: 'banzeiro',
    neighborhood: 'itaim',
    cuisine: 'amazônico',
    price: '$$$',
    match: 87,
    description: 'cardápio único com ingredientes raros. experiência que o grupo não vai esquecer.',
    longDescription: [
      'banzeiro é a porta de entrada da culinária amazônica para os paulistanos. o chef jefferson rueda traz peixes, ervas e frutas únicas da floresta em preparações que respeitam a origem e surpreendem pelo sabor.',
      'o salão é decorado com arte indígena e o serviço apresenta cada ingrediente com história. ideal para grupos que querem uma experiência diferente e inesquecível.',
    ],
    illustration: 'bowl',
    address: 'r. fidêncio ramos, 65\nville olímpia · sp',
    capacity: 55,
    capacityNote: 'reserva recomendada',
    ticketAvg: 'R$ 165',
    ticketNote: 'sem bebida',
    phone: '(11) 3078-4566',
    phoneNote: 'whatsapp disponível',
    tags: ['itaim', 'amazônico', '$$$', 'aberto agora'],
    isOpen: true,
    menu: [
      {
        name: 'tacacá moderno',
        price: 58,
        description: 'tucupi com jambu, camarão seco crocante e gel de tucupi gelado. servido em cuia.',
        tags: ['entrada', 'assinatura'],
        illustration: 'glass',
      },
      {
        name: 'pirarucu assado',
        price: 138,
        description: 'filé de pirarucu, farofa de castanha-do-pará, pirão amazônico e vinagrete de açaí.',
        tags: ['principal', 'peixe'],
        illustration: 'plate',
      },
      {
        name: 'sorvete de cupuaçu',
        price: 36,
        description: 'sorvete artesanal de cupuaçu, calda de mel de abelha nativa e baunilha do cerrado.',
        tags: ['sobremesa'],
        illustration: 'bowl',
      },
    ],
    schedule: [
      { day: 'segunda', hours: 'fechado' },
      { day: 'terça · hoje', hours: '12:00 – 15:00 · 19:00 – 23:00', highlight: true },
      { day: 'quarta', hours: '12:00 – 15:00 · 19:00 – 23:00' },
      { day: 'quinta', hours: '12:00 – 15:00 · 19:00 – 23:00' },
      { day: 'sexta', hours: '12:00 – 15:00 · 19:00 – 00:00' },
      { day: 'sábado', hours: '12:00 – 16:00 · 19:00 – 00:00' },
      { day: 'domingo', hours: '12:00 – 16:00' },
    ],
  },
}

export function getRestaurant(slug: string): Restaurant | null {
  return RESTAURANTS[slug] ?? null
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}
