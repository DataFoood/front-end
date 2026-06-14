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

  'canto-da-serra': {
    slug: 'canto-da-serra',
    name: 'canto da serra',
    neighborhood: 'centro',
    cuisine: 'brasileiro',
    price: '$$',
    match: 96,
    description: 'churrasco e frango caipira em ambiente familiar. ambiente amplo e sem pressa.',
    longDescription: [
      'referência em Marília para quem busca comida caseira bem feita. o frango caipira assado na brasa é o carro-chefe da casa, servido com arroz, feijão tropeiro e couve refogada na gordura de porco.',
      'o salão comporta grupos grandes e o atendimento é informal e acolhedor. almoço executivo durante a semana com prato feito por preço fixo.',
    ],
    illustration: 'bowl',
    address: 'r. quinze de novembro, 340\ncentro · marília · sp',
    capacity: 80,
    capacityNote: 'sem reserva',
    ticketAvg: 'R$ 45',
    ticketNote: 'por pessoa · almoço',
    phone: '(14) 3422-1870',
    phoneNote: 'whatsapp disponível',
    tags: ['centro', 'brasileiro', '$$', 'aberto agora'],
    isOpen: true,
    menu: [
      {
        name: 'frango caipira na brasa',
        price: 52,
        description: 'meio frango caipira assado lentamente na brasa, acompanha arroz, feijão tropeiro e couve.',
        tags: ['principal', 'assinatura'],
        illustration: 'plate',
      },
      {
        name: 'costelinha de porco',
        price: 68,
        description: 'costelinha temperada na véspera, assada por 3h, com mandioca frita e vinagrete.',
        tags: ['principal'],
        illustration: 'bowl',
      },
      {
        name: 'pudim de leite condensado',
        price: 18,
        description: 'pudim caseiro, calda de caramelo escuro, porção generosa.',
        tags: ['sobremesa'],
        illustration: 'glass',
      },
    ],
    schedule: [
      { day: 'segunda', hours: '11:00 – 15:00' },
      { day: 'terça · hoje', hours: '11:00 – 15:00', highlight: true },
      { day: 'quarta', hours: '11:00 – 15:00' },
      { day: 'quinta', hours: '11:00 – 15:00' },
      { day: 'sexta', hours: '11:00 – 15:00 · 19:00 – 23:00' },
      { day: 'sábado', hours: '11:00 – 16:00' },
      { day: 'domingo', hours: '11:00 – 15:00' },
    ],
  },

  'mr-beer-marilia': {
    slug: 'mr-beer-marilia',
    name: 'mr. beer marília',
    neighborhood: 'centro',
    cuisine: 'bar e petiscos',
    price: '$$',
    match: 91,
    description: 'happy hour com chopps gelados e petiscos fartos. ambiente animado no centro.',
    longDescription: [
      'o Mr. Beer é o ponto de encontro do happy hour em Marília. chopps bem tirados, porções fartas e um ambiente descontraído que funciona tanto para uma roda de amigos quanto para confraternizações.',
      'as porções de frango à passarinho e calabresa acebolada são as mais pedidas. aos finais de semana tem música ao vivo e o salão enche cedo.',
    ],
    illustration: 'glass',
    address: 'av. sampaio vidal, 752\ncentro · marília · sp',
    capacity: 120,
    capacityNote: 'sem reserva · pode lotar',
    ticketAvg: 'R$ 55',
    ticketNote: 'por pessoa com bebida',
    phone: '(14) 3433-4020',
    phoneNote: 'whatsapp disponível',
    tags: ['centro', 'bar e petiscos', '$$', 'aberto agora'],
    isOpen: true,
    menu: [
      {
        name: 'frango à passarinho',
        price: 48,
        description: 'frango crocante frito, temperado com alho e limão, porção para 2 pessoas.',
        tags: ['petisco', 'assinatura'],
        illustration: 'plate',
      },
      {
        name: 'calabresa acebolada',
        price: 42,
        description: 'calabresa fatiada na chapa com cebola caramelada e pimenta dedo-de-moça.',
        tags: ['petisco'],
        illustration: 'bowl',
      },
      {
        name: 'chopp pilsen 500ml',
        price: 14,
        description: 'chopp gelado tirado na hora, colarinho perfeito.',
        tags: ['bebida', 'chopp'],
        illustration: 'glass',
      },
    ],
    schedule: [
      { day: 'segunda', hours: 'fechado' },
      { day: 'terça · hoje', hours: '17:00 – 00:00', highlight: true },
      { day: 'quarta', hours: '17:00 – 00:00' },
      { day: 'quinta', hours: '17:00 – 00:00' },
      { day: 'sexta', hours: '17:00 – 01:00' },
      { day: 'sábado', hours: '12:00 – 01:00' },
      { day: 'domingo', hours: '12:00 – 22:00' },
    ],
  },

  'dallas-restaurante': {
    slug: 'restaurante-dallas',
    name: 'dallas restaurante',
    neighborhood: 'centro',
    cuisine: 'contemporâneo',
    price: '$$$',
    match: 94,
    description: 'jantar com ambiente sofisticado. melhor opção para ocasiões especiais em Marília.',
    longDescription: [
      'o Dallas é referência em Marília para quem busca uma experiência gastronômica mais elaborada. o salão tem iluminação baixa, mesas bem espaçadas e serviço atento — diferente do padrão da cidade.',
      'o cardápio combina cortes nobres com massas artesanais e um menu de sobremesas que surpreende. a carta de vinhos é a mais completa de Marília, com rótulos nacionais e importados.',
    ],
    illustration: 'plate',
    address: 'r. bahia, 144\ncentro · marília · sp',
    capacity: 60,
    capacityNote: 'reserva recomendada',
    ticketAvg: 'R$ 120',
    ticketNote: 'sem bebida',
    phone: '(14) 3422-5588',
    phoneNote: 'reservas pelo whatsapp',
    tags: ['centro', 'contemporâneo', '$$$', 'aberto agora'],
    isOpen: true,
    menu: [
      {
        name: 'filé ao molho de vinho',
        price: 98,
        description: 'filé mignon grelhado ao ponto, molho de vinho tinto reduzido, risoto de cogumelos.',
        tags: ['principal', 'assinatura'],
        illustration: 'plate',
      },
      {
        name: 'massa ao funghi secchi',
        price: 72,
        description: 'tagliatelle artesanal com creme de funghi secchi, parmesão e salsinha.',
        tags: ['massa', 'vegetariano'],
        illustration: 'bowl',
      },
      {
        name: 'petit gateau',
        price: 32,
        description: 'bolinho quente de chocolate meio amargo com sorvete de creme e calda de framboesa.',
        tags: ['sobremesa', 'assinatura'],
        illustration: 'glass',
      },
    ],
    schedule: [
      { day: 'segunda', hours: 'fechado' },
      { day: 'terça', hours: 'fechado' },
      { day: 'quarta · hoje', hours: '19:00 – 23:00', highlight: true },
      { day: 'quinta', hours: '19:00 – 23:00' },
      { day: 'sexta', hours: '19:00 – 00:00' },
      { day: 'sábado', hours: '12:00 – 15:30 · 19:00 – 00:00' },
      { day: 'domingo', hours: '12:00 – 15:30' },
    ],
  },

  'ki-sushi-marilia': {
    slug: 'ki-sushi-marilia',
    name: 'ki sushi',
    neighborhood: 'vila universitária',
    cuisine: 'japonês',
    price: '$$',
    match: 89,
    description: 'rodízio de sushi e temaki bem avaliado. opção popular entre universitários.',
    longDescription: [
      'o Ki Sushi é a opção de culinária japonesa mais popular de Marília, especialmente entre o público universitário. o rodízio oferece grande variedade de peças, temakis e pratos quentes por um preço acessível.',
      'o ambiente é animado e o serviço é ágil. recomendado para grupos que querem variedade sem gastar muito. reserva é aconselhada nos finais de semana.',
    ],
    illustration: 'plate',
    address: 'av. das esmeraldas, 512\nvila universitária · marília · sp',
    capacity: 90,
    capacityNote: 'reserva recomendada fins de semana',
    ticketAvg: 'R$ 68',
    ticketNote: 'rodízio por pessoa',
    phone: '(14) 3415-2200',
    phoneNote: 'whatsapp disponível',
    tags: ['vila universitária', 'japonês', '$$', 'aberto agora'],
    isOpen: true,
    menu: [
      {
        name: 'temaki de salmão',
        price: 0,
        description: 'cone de alga com arroz temperado, salmão fresco, cream cheese e cebolinha. incluso no rodízio.',
        tags: ['sushi', 'rodízio'],
        illustration: 'glass',
      },
      {
        name: 'hot roll de camarão',
        price: 0,
        description: 'uramaki empanado e frito, recheio de camarão e cream cheese, molho tarê. incluso no rodízio.',
        tags: ['sushi', 'frito', 'rodízio'],
        illustration: 'bowl',
      },
      {
        name: 'guioza na chapa',
        price: 0,
        description: 'pastel japonês recheado de carne e repolho, tostado na chapa, molho ponzu. incluso no rodízio.',
        tags: ['entrada', 'quente', 'rodízio'],
        illustration: 'plate',
      },
    ],
    schedule: [
      { day: 'segunda', hours: 'fechado' },
      { day: 'terça · hoje', hours: '18:30 – 23:00', highlight: true },
      { day: 'quarta', hours: '18:30 – 23:00' },
      { day: 'quinta', hours: '18:30 – 23:00' },
      { day: 'sexta', hours: '18:30 – 00:00' },
      { day: 'sábado', hours: '12:00 – 15:30 · 18:30 – 00:00' },
      { day: 'domingo', hours: '12:00 – 15:30' },
    ],
  },

  'pizza-del-rei': {
    slug: 'pizza-del-rei',
    name: 'pizza del rei',
    neighborhood: 'jardim califórnia',
    cuisine: 'pizzaria',
    price: '$$',
    match: 88,
    description: 'pizzaria tradicional com massa fina e forno a lenha. entrega e salão.',
    longDescription: [
      'a Pizza Del Rei é uma das pizzarias mais antigas de Marília, conhecida pela massa fina e crocante assada em forno a lenha. os sabores tradicionais são executados com consistência há mais de 20 anos.',
      'o ambiente é familiar e o serviço é tranquilo. além do salão, a entrega cobre boa parte da cidade. as pizzas doces, especialmente a de banana com canela, têm fila de fãs.',
    ],
    illustration: 'bowl',
    address: 'r. joaquim nabuco, 889\njardim califórnia · marília · sp',
    capacity: 70,
    capacityNote: 'sem reserva',
    ticketAvg: 'R$ 58',
    ticketNote: 'pizza média por pessoa',
    phone: '(14) 3422-8844',
    phoneNote: 'delivery e salão',
    tags: ['jardim califórnia', 'pizzaria', '$$', 'aberto agora'],
    isOpen: true,
    menu: [
      {
        name: 'calabresa com alho',
        price: 62,
        description: 'pizza média, massa fina, calabresa fatiada, alho tostado, azeitona preta e orégano.',
        tags: ['pizza', 'tradicional'],
        illustration: 'plate',
      },
      {
        name: 'quatro queijos',
        price: 68,
        description: 'mussarela, provolone, gorgonzola e parmesão gratinados. borda recheada disponível.',
        tags: ['pizza', 'queijo'],
        illustration: 'bowl',
      },
      {
        name: 'banana com canela',
        price: 58,
        description: 'pizza doce com banana, canela, açúcar mascavo e leite condensado. clássico da casa.',
        tags: ['pizza', 'doce', 'assinatura'],
        illustration: 'glass',
      },
    ],
    schedule: [
      { day: 'segunda', hours: 'fechado' },
      { day: 'terça · hoje', hours: '18:00 – 23:30', highlight: true },
      { day: 'quarta', hours: '18:00 – 23:30' },
      { day: 'quinta', hours: '18:00 – 23:30' },
      { day: 'sexta', hours: '18:00 – 00:30' },
      { day: 'sábado', hours: '18:00 – 00:30' },
      { day: 'domingo', hours: '18:00 – 23:00' },
    ],
  },

  'cafe-oficina': {
    slug: 'cafe-oficina',
    name: 'café oficina',
    neighborhood: 'centro',
    cuisine: 'café e bistrô',
    price: '$$',
    match: 87,
    description: 'café especial e brunch em ambiente descolado. wi-fi rápido e mesas confortáveis.',
    longDescription: [
      'o Café Oficina é o espaço de trabalho favorito dos marilienses que buscam um café de qualidade fora do padrão. o ambiente reutiliza móveis e objetos de oficina mecânica na decoração, criando um espaço único na cidade.',
      'wi-fi estável, tomadas em todas as mesas e um cardápio de brunches e lanches que vai além do café com leite. o flat white e o croissant de presunto e queijo são os mais pedidos.',
    ],
    illustration: 'glass',
    address: 'r. said nacib cury, 210\ncentro · marília · sp',
    capacity: 40,
    capacityNote: 'sem reserva',
    ticketAvg: 'R$ 38',
    ticketNote: 'por pessoa',
    phone: '(14) 99812-3344',
    phoneNote: 'whatsapp disponível',
    tags: ['centro', 'café e bistrô', '$$'],
    isOpen: true,
    menu: [
      {
        name: 'flat white',
        price: 16,
        description: 'espresso duplo com leite vaporizado em microespuma, grão de origem única da região do cerrado.',
        tags: ['café', 'assinatura'],
        illustration: 'glass',
      },
      {
        name: 'brunch completo',
        price: 42,
        description: 'ovos mexidos, croissant, frios, geleia artesanal, suco e café. para um.',
        tags: ['brunch', 'completo'],
        illustration: 'plate',
      },
      {
        name: 'bolo de fubá com goiabada',
        price: 14,
        description: 'bolo de fubá úmido, fatia generosa, goiabada artesanal de Marília.',
        tags: ['doce', 'caseiro'],
        illustration: 'bowl',
      },
    ],
    schedule: [
      { day: 'segunda', hours: '08:00 – 18:00' },
      { day: 'terça · hoje', hours: '08:00 – 18:00', highlight: true },
      { day: 'quarta', hours: '08:00 – 18:00' },
      { day: 'quinta', hours: '08:00 – 18:00' },
      { day: 'sexta', hours: '08:00 – 20:00' },
      { day: 'sábado', hours: '09:00 – 16:00' },
      { day: 'domingo', hours: 'fechado' },
    ],
  },

  'espeto-do-alemao': {
    slug: 'espeto-do-alemao',
    name: 'espeto do alemão',
    neighborhood: 'jardim europa',
    cuisine: 'churrasco e espetos',
    price: '$',
    match: 85,
    description: 'espetinhos na brasa em ambiente aberto. ponto de encontro do bairro aos fins de semana.',
    longDescription: [
      'o Espeto do Alemão é a pedida certa para uma noite descontraída em Marília. espetinhos de carne, frango, coração e queijo coalho feitos na brasa na hora, servidos com pão de alho e vinagrete.',
      'o espaço é aberto, com mesinhas e ambiente casual. muito popular entre moradores do jardim europa e bairros vizinhos. não tem reserva, por isso chegue cedo nos finais de semana.',
    ],
    illustration: 'bowl',
    address: 'r. pioneiro sebastião garcia, 455\njardim europa · marília · sp',
    capacity: 50,
    capacityNote: 'sem reserva · informal',
    ticketAvg: 'R$ 30',
    ticketNote: 'por pessoa com bebida',
    phone: '(14) 99654-7788',
    phoneNote: 'só whatsapp',
    tags: ['jardim europa', 'churrasco e espetos', '$'],
    isOpen: false,
    menu: [
      {
        name: 'espeto de fraldinha',
        price: 12,
        description: 'espeto de fraldinha temperada, grelhada na brasa, ponto ao pedido.',
        tags: ['espeto', 'carne'],
        illustration: 'bowl',
      },
      {
        name: 'espeto de queijo coalho',
        price: 10,
        description: 'queijo coalho grelhado com orégano e manteiga de garrafa.',
        tags: ['espeto', 'vegetariano'],
        illustration: 'plate',
      },
      {
        name: 'pão de alho na brasa',
        price: 8,
        description: 'pão francês com manteiga de alho e ervas, tostado na brasa.',
        tags: ['acompanhamento'],
        illustration: 'glass',
      },
    ],
    schedule: [
      { day: 'segunda', hours: 'fechado' },
      { day: 'terça · hoje', hours: 'fechado', highlight: false },
      { day: 'quarta', hours: 'fechado' },
      { day: 'quinta', hours: '18:00 – 23:00' },
      { day: 'sexta', hours: '18:00 – 00:00' },
      { day: 'sábado', hours: '17:00 – 00:00' },
      { day: 'domingo', hours: '16:00 – 22:00' },
    ],
  },

  'laguna-restaurante': {
    slug: 'laguna-restaurante',
    name: 'laguna restaurante',
    neighborhood: 'mirante',
    cuisine: 'frutos do mar',
    price: '$$$',
    match: 92,
    description: 'frutos do mar frescos e vista para a represa. melhor jantar romântico da cidade.',
    longDescription: [
      'o Laguna é o restaurante mais especial de Marília para um jantar a dois. localizado às margens da represa, o salão tem janelas que enquadram a água e as árvores ao redor, com iluminação baixa e música suave.',
      'o cardápio foca em frutos do mar e peixes, com destaque para a moqueca de camarão e o polvo grelhado. a carta de drinks é bem resolvida e o serviço é um dos mais atenciosos da cidade.',
    ],
    illustration: 'glass',
    address: 'estrada municipal da represa, km 3\nmirante · marília · sp',
    capacity: 45,
    capacityNote: 'reserva obrigatória fins de semana',
    ticketAvg: 'R$ 140',
    ticketNote: 'sem bebida',
    phone: '(14) 3412-9900',
    phoneNote: 'reservas pelo whatsapp',
    tags: ['mirante', 'frutos do mar', '$$$', 'aberto agora'],
    isOpen: true,
    menu: [
      {
        name: 'moqueca de camarão',
        price: 98,
        description: 'camarão cinza no leite de coco, azeite de dendê, pimentões e coentro. arroz e pirão.',
        tags: ['principal', 'assinatura'],
        illustration: 'bowl',
      },
      {
        name: 'polvo grelhado',
        price: 115,
        description: 'polvo português cozido e grelhado, azeite, alho, batatas ao murro e rúcula.',
        tags: ['principal', 'frutos do mar'],
        illustration: 'plate',
      },
      {
        name: 'mousse de maracujá',
        price: 28,
        description: 'mousse cremosa, calda de maracujá fresco e raspas de limão siciliano.',
        tags: ['sobremesa'],
        illustration: 'glass',
      },
    ],
    schedule: [
      { day: 'segunda', hours: 'fechado' },
      { day: 'terça', hours: 'fechado' },
      { day: 'quarta · hoje', hours: '19:00 – 23:00', highlight: true },
      { day: 'quinta', hours: '19:00 – 23:00' },
      { day: 'sexta', hours: '19:00 – 00:00' },
      { day: 'sábado', hours: '12:00 – 16:00 · 19:00 – 00:00' },
      { day: 'domingo', hours: '12:00 – 16:00' },
    ],
  },

  'chopperia-marilia': {
    slug: 'chopperia-marilia',
    name: 'chopperia marília',
    neighborhood: 'vila são francisco',
    cuisine: 'bar e petiscos',
    price: '$$',
    match: 86,
    description: 'chopps artesanais e tábuas fartíssimas. encontro obrigatório de amigos em marília.',
    longDescription: [
      'a Chopperia Marília é um dos bares mais movimentados da cidade, especialmente depois das 20h. a variedade de chopps artesanais — sempre com 4 torneiras diferentes — é o diferencial da casa.',
      'as tábuas de frios e o frango empanado com molho da casa são os mais pedidos. o ambiente é animado, com música ao vivo às sextas e sábados.',
    ],
    illustration: 'glass',
    address: 'av. princesa d\'oeste, 1240\nvila são francisco · marília · sp',
    capacity: 100,
    capacityNote: 'sem reserva',
    ticketAvg: 'R$ 60',
    ticketNote: 'por pessoa com bebida',
    phone: '(14) 3433-7755',
    phoneNote: 'whatsapp disponível',
    tags: ['vila são francisco', 'bar e petiscos', '$$', 'aberto agora'],
    isOpen: true,
    menu: [
      {
        name: 'tábua de frios premium',
        price: 72,
        description: 'presunto cru, salame, queijo gouda, gorgonzola, pão artesanal e geleia de pimenta. para 2.',
        tags: ['petisco', 'compartilhar'],
        illustration: 'plate',
      },
      {
        name: 'frango empanado da casa',
        price: 52,
        description: 'tiras de frango empanadas na farinha panko, molho secreto da casa, porção para 2.',
        tags: ['petisco', 'assinatura'],
        illustration: 'bowl',
      },
      {
        name: 'chopp artesanal weiss',
        price: 18,
        description: 'chopp de trigo, notas frutadas e levemente adocicado. 400ml bem gelado.',
        tags: ['bebida', 'artesanal'],
        illustration: 'glass',
      },
    ],
    schedule: [
      { day: 'segunda', hours: 'fechado' },
      { day: 'terça · hoje', hours: '17:00 – 00:00', highlight: true },
      { day: 'quarta', hours: '17:00 – 00:00' },
      { day: 'quinta', hours: '17:00 – 00:00' },
      { day: 'sexta', hours: '17:00 – 01:30' },
      { day: 'sábado', hours: '14:00 – 01:30' },
      { day: 'domingo', hours: '14:00 – 22:00' },
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