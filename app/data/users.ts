export interface User {
  id: string
  name: string
  email: string
  password: string
  type: 'pessoa' | 'restaurante'
  restaurantSlug?: string
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
    name: 'Dallas Restaurante',
    email: 'testerestaurante@datafood.com',
    password: 'Teste@123',
    type: 'restaurante',
    restaurantSlug: 'restaurante-dallas',
  },
]

export function authenticateUser(email: string, password: string): User | null {
  return USERS.find(u => u.email === email && u.password === password) ?? null
}