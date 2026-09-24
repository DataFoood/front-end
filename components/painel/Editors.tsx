'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useToast } from '@/app/context/ToastContext'
import { Field, Spinner, TextArea } from '@/components/ui'
import { api, ApiError, errorMessage } from '@/lib/api'
import { DAYS, formatPrice } from '@/lib/format'
import type { Address, BusinessHour, MenuItem, Restaurant } from '@/lib/types'

const MAX_ITEMS = 6

/* ─── Cardápio (até 6 pratos em destaque) ─────────────────────────────── */

function ItemForm({ initial, onSubmit, onCancel }: { initial?: MenuItem; onSubmit: (data: Partial<MenuItem>) => Promise<void>; onCancel?: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial?.price ?? '')
  const [saving, setSaving] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSubmit({ name: name.trim(), description: description.trim(), price: price === '' ? null : String(price).replace(',', '.') })
    setSaving(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
        <Field label="nome do prato" name="item-name" value={name} onChange={e => setName(e.target.value)} required />
        <Field label="preço (R$)" name="item-price" inputMode="decimal" value={price ?? ''} onChange={e => setPrice(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="opcional" />
      </div>
      <TextArea label="descrição" name="item-desc" value={description} onChange={e => setDescription(e.target.value)} className="[&_textarea]:min-h-[70px]" />
      <div className="flex gap-2">
        <button type="submit" disabled={saving || !name.trim()} className="btn-primary py-2">
          {saving ? <Spinner className="h-4 w-4 border-[#555] border-t-white" /> : initial ? 'salvar' : 'adicionar prato'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost py-2">
            cancelar
          </button>
        )}
      </div>
    </form>
  )
}

export function MenuEditor({ restaurant, onChange }: { restaurant: Restaurant; onChange: () => void }) {
  const toast = useToast()
  const [editing, setEditing] = useState<number | null>(null)
  const items = restaurant.items
  const base = `/api/restaurants/${restaurant.id}/items/`

  const save = async (data: Partial<MenuItem>, id?: number) => {
    try {
      if (id) await api(`${base}${id}/`, { method: 'PATCH', body: data })
      else await api(base, { method: 'POST', body: { ...data, position: items.length } })
      toast.success(id ? 'Prato atualizado.' : 'Prato adicionado.')
      setEditing(null)
      onChange()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const remove = async (item: MenuItem) => {
    if (!confirm(`Remover "${item.name}"?`)) return
    try {
      await api(`${base}${item.id}/`, { method: 'DELETE' })
      onChange()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[13px] text-[#777]">
        até {MAX_ITEMS} pratos em destaque. eles aparecem na sua página e ajudam a busca (&quot;onde comer feijoada?&quot;).
      </p>
      <div className="flex flex-col gap-3">
        {items.map(item => (
          <div key={item.id} className="card p-4">
            {editing === item.id ? (
              <ItemForm initial={item} onSubmit={d => save(d, item.id)} onCancel={() => setEditing(null)} />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[15px]">
                    {item.name} {formatPrice(item.price) && <span className="ml-2 text-[13px] text-rust">{formatPrice(item.price)}</span>}
                  </p>
                  {item.description && <p className="mt-1 text-[13px] text-[#666]">{item.description}</p>}
                </div>
                <div className="flex shrink-0 gap-3 text-xs">
                  <button onClick={() => setEditing(item.id)} className="text-[#777] hover:text-ink">
                    editar
                  </button>
                  <button onClick={() => remove(item)} className="text-[#aaa] hover:text-[#c53030]">
                    remover
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {items.length < MAX_ITEMS ? (
        <div className="card border-dashed p-4">
          <ItemForm key={items.length} onSubmit={d => save(d)} />
        </div>
      ) : (
        <p className="text-xs text-[#999]">limite de {MAX_ITEMS} pratos atingido.</p>
      )}
    </div>
  )
}

/* ─── Horários ────────────────────────────────────────────────────────── */

interface DayState {
  id?: number
  closed: boolean
  intervals: [string, string][]
}

function toState(hours: BusinessHour[]): DayState[] {
  return DAYS.map((_, i) => {
    const h = hours.find(x => x.day_week === i)
    if (!h) return { closed: true, intervals: [] }
    return { id: h.id, closed: h.is_closed, intervals: Object.values(h.meta_interval).map(([s, e]) => [s.slice(0, 5), e.slice(0, 5)] as [string, string]) }
  })
}

export function HoursEditor({ restaurant, onChange }: { restaurant: Restaurant; onChange: () => void }) {
  const toast = useToast()
  const [days, setDays] = useState(() => toState(restaurant.business_hours))
  const [saving, setSaving] = useState(false)

  const [source, setSource] = useState(restaurant.business_hours)
  if (source !== restaurant.business_hours) {
    setSource(restaurant.business_hours)
    setDays(toState(restaurant.business_hours))
  }

  const update = (i: number, fn: (d: DayState) => DayState) => setDays(prev => prev.map((d, j) => (j === i ? fn(d) : d)))

  const copyToAll = (i: number) => setDays(prev => prev.map(d => ({ ...d, closed: prev[i].closed, intervals: prev[i].intervals.map(x => [...x] as [string, string]) })))

  const save = async () => {
    // valida antes de mandar: fim > início (o back não aceita virar a meia-noite)
    for (let i = 0; i < days.length; i++) {
      const d = days[i]
      if (d.closed) continue
      for (const [s, e] of d.intervals) {
        if (!s || !e || e <= s) {
          toast.error(`${DAYS[i]}: o horário de fim deve ser depois do início (para depois da meia-noite use 23:59).`)
          return
        }
      }
    }
    setSaving(true)
    try {
      await Promise.all(
        days.map((d, i) => {
          const closed = d.closed || d.intervals.length === 0
          const body = {
            day_week: i,
            is_closed: closed,
            meta_interval: closed ? {} : Object.fromEntries(d.intervals.map(([s, e], k) => [`turno${k + 1}`, [`${s}:00`, e === '23:59' ? '23:59:59' : `${e}:00`]])),
          }
          const base = `/api/restaurants/${restaurant.id}/hours/`
          return d.id ? api(`${base}${d.id}/`, { method: 'PATCH', body }) : api(base, { method: 'POST', body })
        }),
      )
      toast.success('Horários salvos.')
      onChange()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card divide-y divide-[#f0ece4]">
        {days.map((d, i) => (
          <div key={DAYS[i]} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex w-32 items-center justify-between gap-3 sm:justify-start">
              <span className="text-[13px] font-medium">{DAYS[i]}</span>
            </div>
            <label className="flex items-center gap-2 text-xs text-[#666]">
              <input
                type="checkbox"
                checked={!d.closed}
                onChange={e => update(i, x => ({ ...x, closed: !e.target.checked, intervals: e.target.checked && !x.intervals.length ? [['11:00', '15:00']] : x.intervals }))}
                className="h-4 w-4 accent-ink"
              />
              aberto
            </label>
            {!d.closed && (
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {d.intervals.map(([s, e], k) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <input type="time" value={s} onChange={ev => update(i, x => ({ ...x, intervals: x.intervals.map((iv, j) => (j === k ? [ev.target.value, iv[1]] : iv)) }))} className="input w-auto px-2 py-1.5" aria-label={`${DAYS[i]} início`} />
                    <span className="text-xs text-[#aaa]">–</span>
                    <input type="time" value={e} onChange={ev => update(i, x => ({ ...x, intervals: x.intervals.map((iv, j) => (j === k ? [iv[0], ev.target.value] : iv)) }))} className="input w-auto px-2 py-1.5" aria-label={`${DAYS[i]} fim`} />
                    {d.intervals.length > 1 && (
                      <button onClick={() => update(i, x => ({ ...x, intervals: x.intervals.filter((_, j) => j !== k) }))} className="px-1 text-[#bbb] hover:text-[#c53030]" aria-label="remover turno">
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {d.intervals.length < 3 && (
                  <button onClick={() => update(i, x => ({ ...x, intervals: [...x.intervals, ['19:00', '23:00']] }))} className="text-xs text-rust">
                    + turno
                  </button>
                )}
              </div>
            )}
            <button onClick={() => copyToAll(i)} className="text-[11px] text-[#aaa] hover:text-ink sm:ml-auto">
              copiar p/ todos
            </button>
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving} className="btn-primary self-start">
        {saving ? <Spinner className="h-4 w-4 border-[#555] border-t-white" /> : 'salvar horários'}
      </button>
    </div>
  )
}

/* ─── Endereço ────────────────────────────────────────────────────────── */

const EMPTY_ADDRESS = { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipcode: '' }

export function AddressEditor({ restaurant, onChange }: { restaurant: Restaurant; onChange: () => void }) {
  const toast = useToast()
  const [address, setAddress] = useState<Address | null>(null)
  const [form, setForm] = useState(EMPTY_ADDRESS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    api<Address[]>('/api/addresses/')
      .then(list => {
        const mine = list.filter(a => a.entity_type === 'restaurant' && a.object_id === restaurant.id)
        const current = mine.find(a => a.is_default) ?? mine[0] ?? null
        setAddress(current)
        if (current) setForm(Object.fromEntries(Object.keys(EMPTY_ADDRESS).map(k => [k, (current as unknown as Record<string, string>)[k] ?? ''])) as typeof EMPTY_ADDRESS)
      })
      .finally(() => setLoading(false))
  }, [restaurant.id])

  // CEP -> endereço (ViaCEP, público)
  const lookupCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) return
      setForm(f => ({ ...f, street: data.logradouro || f.street, neighborhood: data.bairro || f.neighborhood, city: data.localidade || f.city, state: data.uf || f.state }))
    } catch {
      /* preenchimento manual */
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      if (address) {
        await api(`/api/addresses/${address.id}/`, { method: 'PATCH', body: form })
      } else {
        const created = await api<Address>('/api/addresses/', {
          method: 'POST',
          body: { ...form, entity_type: 'restaurant', object_id: restaurant.id, is_default: true },
        })
        setAddress(created)
      }
      toast.success('Endereço salvo.')
      onChange()
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields)
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />
  const set = (k: keyof typeof EMPTY_ADDRESS) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4 p-5 sm:p-6">
      <p className="text-[13px] text-[#777]">o endereço do restaurante é público e aparece na sua página.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
        <Field className="sm:col-span-2" label="cep" name="zipcode" value={form.zipcode} onChange={set('zipcode')} onBlur={e => lookupCep(e.target.value)} error={errors.zipcode} required />
        <Field className="sm:col-span-4" label="rua" name="street" value={form.street} onChange={set('street')} error={errors.street} required />
        <Field className="sm:col-span-2" label="número" name="number" value={form.number} onChange={set('number')} error={errors.number} />
        <Field className="sm:col-span-4" label="complemento" name="complement" value={form.complement} onChange={set('complement')} error={errors.complement} />
        <Field className="sm:col-span-2" label="bairro" name="neighborhood" value={form.neighborhood} onChange={set('neighborhood')} error={errors.neighborhood} />
        <Field className="sm:col-span-3" label="cidade" name="city" value={form.city} onChange={set('city')} error={errors.city} required />
        <Field className="sm:col-span-1" label="uf" name="state" value={form.state} onChange={set('state')} error={errors.state} maxLength={2} required />
      </div>
      <button type="submit" disabled={saving} className="btn-primary self-start">
        {saving ? <Spinner className="h-4 w-4 border-[#555] border-t-white" /> : 'salvar endereço'}
      </button>
    </form>
  )
}

/* ─── Fotos ───────────────────────────────────────────────────────────── */

export function PhotosEditor({ restaurant, onChange }: { restaurant: Restaurant; onChange: () => void }) {
  const toast = useToast()
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const base = `/api/restaurants/${restaurant.id}/images/`

  const add = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api(base, { method: 'POST', body: { url: url.trim() } })
      setUrl('')
      onChange()
    } catch (err) {
      toast.error(err instanceof ApiError && err.fields.url ? 'URL de imagem inválida.' : errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    try {
      await api(`${base}${id}/`, { method: 'DELETE' })
      onChange()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const setCover = async (src: string) => {
    try {
      await api(`/api/restaurants/${restaurant.id}/`, { method: 'PATCH', body: { cover_image: src } })
      toast.success('Capa atualizada.')
      onChange()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
        <input type="url" required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://… (link público da foto)" className="input" aria-label="url da foto" />
        <button type="submit" disabled={saving || !url.trim()} className="btn-primary shrink-0">
          adicionar foto
        </button>
      </form>
      {restaurant.images.length === 0 ? (
        <p className="text-[13px] text-[#999]">nenhuma foto ainda. sem capa, sua página usa uma ilustração.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {restaurant.images.map(img => (
            <div key={img.id} className="card overflow-hidden">
              <img src={img.url} alt="" className="aspect-square w-full object-cover" loading="lazy" />
              <div className="flex justify-between px-3 py-2 text-[11px]">
                {restaurant.cover_image === img.url ? (
                  <span className="text-rust">capa atual</span>
                ) : (
                  <button onClick={() => setCover(img.url)} className="text-[#777] hover:text-ink">
                    usar como capa
                  </button>
                )}
                <button onClick={() => remove(img.id)} className="text-[#aaa] hover:text-[#c53030]">
                  remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
