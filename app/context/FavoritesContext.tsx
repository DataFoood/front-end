'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Definição do tipo do Restaurante
interface Restaurant {
  id: string
  name: string
  bairro: string
  vibe: string
  desc: string
}

interface FavoritesContextType {
  favorites: Restaurant[]
  toggleFavorite: (restaurant: Restaurant) => void
  isFavorite: (id: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Restaurant[]>([])

  // Carrega os favoritos salvos no navegador ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem('datafood_favorites')
    if (saved) setFavorites(JSON.parse(saved))
  }, [])

  // Salva ou remove um restaurante da lista
  const toggleFavorite = (restaurant: Restaurant) => {
    let updated: Restaurant[]
    if (favorites.some(item => item.id === restaurant.id)) {
      updated = favorites.filter(item => item.id !== restaurant.id)
    } else {
      updated = [...favorites, restaurant]
    }
    setFavorites(updated)
    localStorage.setItem('datafood_favorites', JSON.stringify(updated))
  }

  const isFavorite = (id: string) => favorites.some(item => item.id === id)

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites deve ser usado dentro de FavoritesProvider')
  return context
}