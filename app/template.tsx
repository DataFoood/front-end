'use client'

import { m } from 'motion/react'

export default function Template({ children }: { children: React.ReactNode }) {
  // Opacidade preserva a referência dos filhos com position fixed/sticky.
  return <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>{children}</m.div>
}
