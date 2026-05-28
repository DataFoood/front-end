export interface User {
  id: string
  name: string
  email: string
  password: string
  type: 'pessoa' | 'restaurante'
  restaurantSlug?: string // só para type === 'restaurante'
}

export const USERS: User[] = [
  {
    id: '1',
    name: 'Ana Moraes',
    email: 'testepessoa@datafood.com',
    password: 'Teste@123',
    type: 'pessoa',
  },
  {
    id: '2',
    name: 'Restaurante Tuju',
    email: 'testerestaurante@datafood.com',
    password: 'Teste@123',
    type: 'restaurante',
    restaurantSlug: 'tuju',
  },
]

export function authenticateUser(email: string, password: string): User | null {
  return USERS.find(u => u.email === email && u.password === password) ?? null
}
