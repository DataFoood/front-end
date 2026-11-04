'use client'

import { useEffect, useRef } from 'react'
import { recordDetailAction } from '@/lib/analytics'

export function DetailTelemetry({ restaurantId }: { restaurantId: number }) {
  const last = useRef<number | null>(null)
  useEffect(() => {
    if (last.current !== restaurantId) {
      last.current = restaurantId
      recordDetailAction(restaurantId, 'detail_view')
    }
  }, [restaurantId])
  return null
}
