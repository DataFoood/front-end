'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { ArrowLeft, ArrowRight, Expand, X } from 'lucide-react'
import type { RestaurantImage } from '@/lib/types'

export function PhotoGallery({ images, name }: { images: RestaurantImage[]; name: string }) {
  const [selected, setSelected] = useState<number | null>(null)
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((photo, index) => (
          <button key={photo.id} type="button" onClick={() => setSelected(index)} aria-label={`Ampliar foto ${index + 1} de ${name}`}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-cream-dark">
            <img src={photo.url} alt={`Foto ${index + 1} de ${name}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-paper/90 text-ink opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"><Expand size={16} aria-hidden /></span>
          </button>
        ))}
      </div>
      {selected !== null && <GalleryDialog images={images} name={name} initial={selected} onDismiss={() => setSelected(null)} />}
    </>
  )
}

function GalleryDialog({ images, name, initial, onDismiss }: { images: RestaurantImage[]; name: string; initial: number; onDismiss: () => void }) {
  const [index, setIndex] = useState(initial)
  const dialog = useRef<HTMLDialogElement>(null)
  const title = useId()
  const move = (direction: number) => setIndex(current => (current + direction + images.length) % images.length)
  useEffect(() => {
    const element = dialog.current
    const previousOverflow = document.body.style.overflow
    element?.showModal()
    document.body.style.overflow = 'hidden'
    return () => { element?.close(); document.body.style.overflow = previousOverflow }
  }, [])
  // StrictMode pode reabrir o dialog antes de entregar o close da limpeza anterior.
  return (
    <dialog ref={dialog} aria-labelledby={title} onClose={event => { if (!event.currentTarget.open) onDismiss() }}
      onClick={event => { if (event.target === event.currentTarget) dialog.current?.close() }}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
        if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
      }}
      className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-[960px] overflow-visible rounded-3xl border border-line bg-paper p-4 shadow-2xl backdrop:bg-ink/75 backdrop:backdrop-blur-md sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4"><div className="min-w-0"><h2 id={title} className="truncate font-serif text-xl">{name}</h2><p className="mt-1 text-xs text-muted" aria-live="polite">Foto {index + 1} de {images.length}</p></div><button type="button" onClick={() => dialog.current?.close()} aria-label="Fechar fotos" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream-dark"><X size={20} aria-hidden /></button></div>
      <div className="relative h-[min(65vh,600px)] overflow-hidden rounded-2xl bg-ink">
        <AnimatePresence mode="wait" initial={false}><m.img key={images[index].id} src={images[index].url} alt={`Foto ${index + 1} de ${name}`} className="h-full w-full object-contain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} /></AnimatePresence>
        {images.length > 1 && <><button type="button" onClick={() => move(-1)} aria-label="Foto anterior" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/95 text-ink"><ArrowLeft size={19} aria-hidden /></button><button type="button" onClick={() => move(1)} aria-label="Próxima foto" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/95 text-ink"><ArrowRight size={19} aria-hidden /></button></>}
      </div>
    </dialog>
  )
}
