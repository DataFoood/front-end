'use client'

import { useState } from 'react'

export function LocationFilter({ city, radius, nearby, onChange }: {
  city: string; radius: string; nearby: boolean
  onChange: (values: Record<string, string>) => void
}) {
  const [draft, setDraft] = useState(city)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const locate = () => {
    if (!navigator.geolocation) { setMessage('Localização indisponível. Informe uma cidade.'); return }
    setBusy(true)
    navigator.geolocation.getCurrentPosition(position => {
      setBusy(false)
      setMessage('Localização aproximada aplicada. Restaurantes sem coordenadas ficam fora do raio.')
      onChange({ city: '', lat: position.coords.latitude.toFixed(3), lon: position.coords.longitude.toFixed(3), radius_km: radius || '10', ordering: 'distance' })
    }, () => {
      setBusy(false)
      setMessage('Não foi possível obter a localização. Você pode informar a cidade.')
    }, { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false })
  }
  return (
    <div className="card mb-5 p-4">
      <form className="flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); onChange({ city: draft.trim(), lat: '', lon: '', radius_km: '' }) }}>
        <label className="flex min-w-40 flex-1 flex-col"><span className="label">Cidade</span><input className="input" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Ex.: Marília" /></label>
        <button className="btn-ghost" type="submit">Aplicar cidade</button>
        <button className="btn-ghost" type="button" disabled={busy} onClick={locate}>{busy ? 'Localizando…' : 'Perto de mim'}</button>
        <label className="flex flex-col"><span className="label">Raio</span><select className="input" aria-label="Raio de busca" value={radius || '10'} disabled={!nearby} onChange={e => onChange({ radius_km: e.target.value })}>
          {[2, 5, 10, 20, 50].map(km => <option key={km} value={km}>{km} km</option>)}
        </select></label>
      </form>
      {message && <p className="mt-2 text-xs text-muted" role="status">{message}</p>}
    </div>
  )
}
