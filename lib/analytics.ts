import { api } from './api'

export type AnalyticsKind = 'result_impression' | 'detail_view' | 'contact_click' | 'menu_click' | 'directions_click'

/** Eventos sem cookie de tracking, sessão persistente, IP ou dados pessoais no payload. */
export function recordEvent(restaurant: number, kind: AnalyticsKind, attribution?: string | null) {
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'false' || navigator.doNotTrack === '1') return
  if (!globalThis.crypto?.randomUUID) return
  void api('/api/insights/events/', {
    method: 'POST', body: { id: crypto.randomUUID(), restaurant, kind, ...(attribution ? { attribution } : {}) },
  }).catch(() => undefined) // medição não pode interromper uma ação do cliente
}

export function recordDetailAction(restaurant: number, kind: AnalyticsKind) {
  recordEvent(restaurant, kind, new URLSearchParams(window.location.search).get('campaign'))
}
