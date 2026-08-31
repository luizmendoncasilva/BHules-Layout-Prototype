// Registro central de mocks. Cada handler recebe a URL relativa (path + query
// string, sem o prefixo /api/v1) e o método HTTP, e devolve os dados que o
// endpoint real devolveria. Usado por `request()` em src/api/client.js quando
// VITE_MOCK_DATA=true, para que todas as telas rendem cheias sem backend.
const handlers = []

export function mockRoute(pattern, method, handler) {
  handlers.push({ pattern, method: method.toUpperCase(), handler })
}

export function resolveMock(path, method = 'GET') {
  const [pathname] = path.split('?')
  const m = method.toUpperCase()
  for (const h of handlers) {
    if (h.method !== m) continue
    if (h.pattern instanceof RegExp) {
      const match = pathname.match(h.pattern)
      if (match) return h.handler(path, match)
    } else if (typeof h.pattern === 'function') {
      if (h.pattern(pathname)) return h.handler(path)
    } else if (h.pattern === pathname) {
      return h.handler(path)
    }
  }
  return undefined
}

export function paginate(items, page = 1, pageSize = 50) {
  const p = Number(page) || 1
  const size = Number(pageSize) || 50
  const start = (p - 1) * size
  return {
    items: items.slice(start, start + size),
    total: items.length,
    page: p,
    page_size: size,
    total_pages: Math.max(1, Math.ceil(items.length / size)),
  }
}

export function paramsOf(path) {
  const [, qs] = path.split('?')
  return new URLSearchParams(qs || '')
}
