'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useToast } from '@/app/context/ToastContext'
import { Field, Spinner, TextArea, Toggle } from '@/components/ui'
import { api, ApiError, errorMessage } from '@/lib/api'
import { maskPhone, onlyDigits } from '@/lib/format'
import { SALES_CHANNELS, type Restaurant, type SalesChannel, type Taxonomies, type TaxonomyKey } from '@/lib/types'

const TAXONOMY_LABELS: { key: TaxonomyKey; label: string; single?: boolean }[] = [
  { key: 'cuisines', label: 'cozinhas' },
  { key: 'price_ranges', label: 'faixa de preço', single: true },
  { key: 'ambients', label: 'ambientes' },
  { key: 'service_models', label: 'modelo de serviço' },
  { key: 'target_audiences', label: 'público' },
  { key: 'business_models', label: 'modelo de negócio' },
  { key: 'physical_formats', label: 'formato físico' },
]

const CHANNEL_LABELS: Record<SalesChannel, string> = {
  has_dine_in: 'atendimento no salão',
  has_delivery: 'delivery',
  has_take_out: 'retirada no local',
  has_drive_thru: 'drive-thru',
  has_reservation: 'aceita reservas',
  accepts_vale_refeicao: 'aceita vale-refeição',
  accepts_online_order: 'pedido online',
}

let taxonomyCache: Taxonomies | null = null
export function useTaxonomies() {
  const [tax, setTax] = useState<Taxonomies | null>(taxonomyCache)
  useEffect(() => {
    if (taxonomyCache) return
    api<Taxonomies>('/api/restaurants/taxonomies/', { auth: false }).then(t => {
      taxonomyCache = t
      setTax(t)
    })
  }, [])
  return tax
}

function initialState(r: Restaurant) {
  return {
    name: r.name,
    description: r.description,
    phone: maskPhone(r.phone || ''),
    email: r.email,
    website: r.website,
    cover_image: r.cover_image,
    menu_url: r.menu_url,
    cnpj: r.cnpj ?? '',
    ...Object.fromEntries(TAXONOMY_LABELS.map(t => [t.key, (r[t.key] as { id: number }[]).map(x => x.id)])),
    ...Object.fromEntries(SALES_CHANNELS.map(c => [c, r[c]])),
  } as Record<string, string | number[] | boolean>
}

export function InfoForm({ restaurant, onSaved, onDeleted }: { restaurant: Restaurant; onSaved: (r: Restaurant) => void; onDeleted: () => void }) {
  const toast = useToast()
  const taxonomies = useTaxonomies()
  const [form, setForm] = useState(() => initialState(restaurant))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const [source, setSource] = useState(restaurant)
  if (source !== restaurant) {
    setSource(restaurant)
    setForm(initialState(restaurant))
  }

  const set = (k: string, v: string | number[] | boolean) => setForm(f => ({ ...f, [k]: v }))

  const toggleTax = (key: TaxonomyKey, id: number, single?: boolean) => {
    const current = form[key] as number[]
    if (single) set(key, current.includes(id) ? [] : [id])
    else set(key, current.includes(id) ? current.filter(x => x !== id) : [...current, id])
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      const saved = await api<Restaurant>(`/api/restaurants/${restaurant.id}/`, {
        method: 'PATCH',
        body: { ...form, phone: onlyDigits(form.phone as string), cnpj: onlyDigits(form.cnpj as string) || null },
      })
      onSaved(saved)
      toast.success('Informações salvas.')
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields)
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm(`Remover "${restaurant.name}" do datafood? Ele deixa de aparecer nas buscas.`)) return
    try {
      await api(`/api/restaurants/${restaurant.id}/`, { method: 'DELETE' })
      toast.info('Restaurante removido.')
      onDeleted()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="card flex flex-col gap-4 p-5 sm:p-6">
        <h3 className="text-[15px] font-medium">dados básicos</h3>
        <Field label="nome" name="name" value={form.name as string} onChange={e => set('name', e.target.value)} error={errors.name} required />
        <TextArea
          label="descrição"
          name="description"
          value={form.description as string}
          onChange={e => set('description', e.target.value)}
          error={errors.description}
          placeholder="conte o que torna o lugar especial: clima, pratos, ocasiões. a busca inteligente usa este texto."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="telefone / whatsapp" name="phone" value={form.phone as string} onChange={e => set('phone', maskPhone(e.target.value))} error={errors.phone} />
          <Field label="e-mail" name="email" type="email" value={form.email as string} onChange={e => set('email', e.target.value)} error={errors.email} />
          <Field label="site" name="website" type="url" value={form.website as string} onChange={e => set('website', e.target.value)} error={errors.website} placeholder="https://" />
          <Field label="link do cardápio completo" name="menu_url" type="url" value={form.menu_url as string} onChange={e => set('menu_url', e.target.value)} error={errors.menu_url} placeholder="https://" />
          <Field label="foto de capa (url)" name="cover_image" type="url" value={form.cover_image as string} onChange={e => set('cover_image', e.target.value)} error={errors.cover_image} placeholder="https://" />
          <Field label="cnpj (opcional)" name="cnpj" inputMode="numeric" value={form.cnpj as string} onChange={e => set('cnpj', e.target.value.replace(/[^\d./-]/g, ''))} error={errors.cnpj} />
        </div>
      </div>

      <div className="card flex flex-col gap-5 p-5 sm:p-6">
        <div>
          <h3 className="text-[15px] font-medium">categorias</h3>
          <p className="text-[12px] text-[#999]">ajudam a busca a entender quando recomendar você.</p>
        </div>
        {!taxonomies ? (
          <Spinner />
        ) : (
          TAXONOMY_LABELS.map(t => (
            <fieldset key={t.key}>
              <legend className="label">{t.label}</legend>
              <div className="flex flex-wrap gap-2">
                {taxonomies[t.key].map(opt => {
                  const on = (form[t.key] as number[]).includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleTax(t.key, opt.id, t.single)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${on ? 'border-ink bg-ink text-white' : 'border-[#ddd] bg-white text-[#555] hover:border-[#999]'}`}
                    >
                      {opt.name}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))
        )}
      </div>

      <div className="card p-5 sm:p-6">
        <h3 className="mb-4 text-[15px] font-medium">atendimento</h3>
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {SALES_CHANNELS.map(c => (
            <div key={c} className="flex items-center justify-between gap-3 text-[13px] text-[#444]">
              {CHANNEL_LABELS[c]}
              <Toggle checked={form[c] as boolean} onChange={v => set(c, v)} label={CHANNEL_LABELS[c]} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Spinner className="h-4 w-4 border-[#555] border-t-white" /> : 'salvar informações'}
        </button>
        <button type="button" onClick={remove} className="text-xs text-[#aaa] hover:text-[#c53030]">
          remover restaurante
        </button>
      </div>
    </form>
  )
}

export function CreateRestaurant({ onCreated }: { onCreated: (id: number) => void }) {
  const toast = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrors({ name: 'informe o nome do restaurante.' })
      return
    }
    setSaving(true)
    try {
      const created = await api<{ id: number }>('/api/restaurants/', {
        method: 'POST',
        body: { name: name.trim(), description: description.trim(), phone: onlyDigits(phone) },
      })
      toast.success('Restaurante cadastrado! Agora complete as informações.')
      onCreated(created.id)
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields)
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto flex max-w-xl flex-col gap-4 p-6 sm:p-8">
      <h2 className="font-serif text-3xl">cadastre seu restaurante</h2>
      <p className="text-[13px] leading-relaxed text-[#777]">comece pelo básico — você completa cardápio, horários, endereço e fotos em seguida.</p>
      <Field label="nome do restaurante" name="name" value={name} onChange={e => setName(e.target.value)} error={errors.name} />
      <TextArea label="descrição" name="description" value={description} onChange={e => setDescription(e.target.value)} error={errors.description} placeholder="clima, pratos, ocasiões ideais…" />
      <Field label="telefone / whatsapp" name="phone" value={phone} onChange={e => setPhone(maskPhone(e.target.value))} error={errors.phone} />
      <button type="submit" disabled={saving} className="btn-primary self-start">
        {saving ? <Spinner className="h-4 w-4 border-[#555] border-t-white" /> : 'cadastrar'}
      </button>
    </form>
  )
}
