// Injetado antes do React carregar (page.addInitScript). Finge ser o
// React DevTools: a cada commit percorre a árvore de fibers e conta quais
// componentes de função realmente renderizaram (flag PerformedWork, o mesmo
// critério do DevTools/"highlight updates"). Só funciona no build de dev.
//
// Subárvores que o React pulou (bailout) continuam apontando para os mesmos
// objetos fiber do commit anterior, com flags antigas: por isso só conta
// fibers que não estavam na árvore do commit anterior.
//
//   window.__renders.reset()          zera os contadores
//   window.__renders.snapshot()       { NomeDoComponente: nº de renders }
;(() => {
  const PERFORMED_WORK = 1
  const FUNCTION_TAGS = new Set([0, 11, 14, 15]) // Function, ForwardRef, Memo, SimpleMemo
  let counts = {}
  let commits = 0
  let previous = new WeakSet()

  const nameOf = fiber => {
    const t = fiber.type
    if (!t) return null
    return t.displayName || t.name || (t.render && (t.render.displayName || t.render.name)) || (t.type && (t.type.displayName || t.type.name)) || null
  }

  const walk = fiber => {
    const seen = new WeakSet()
    const stack = [fiber]
    while (stack.length) {
      const f = stack.pop()
      if (!f) continue
      seen.add(f)
      if (!previous.has(f) && FUNCTION_TAGS.has(f.tag) && (f.flags & PERFORMED_WORK) === PERFORMED_WORK) {
        const name = nameOf(f)
        if (name) counts[name] = (counts[name] || 0) + 1
      }
      if (f.sibling) stack.push(f.sibling)
      if (f.child) stack.push(f.child)
    }
    previous = seen
  }

  window.__renders = {
    reset() {
      counts = {}
      commits = 0
    },
    snapshot() {
      return { commits, counts: { ...counts } }
    },
  }

  const renderers = new Map()
  let nextId = 1
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    renderers,
    supportsFiber: true,
    isDisabled: false,
    inject(renderer) {
      const id = nextId++
      renderers.set(id, renderer)
      return id
    },
    checkDCE() {},
    onScheduleFiberRoot() {},
    onCommitFiberRoot(_id, root) {
      commits++
      walk(root.current.child)
    },
    onCommitFiberUnmount() {},
    onPostCommitFiberRoot() {},
  }
})()
