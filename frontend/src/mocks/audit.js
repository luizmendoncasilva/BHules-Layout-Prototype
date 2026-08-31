import { mockRoute, paramsOf, paginate } from './registry'

// Fixture do log de auditoria consolidado (cross-nota/empresa) — alimenta
// src/components/audit/AuditLog.jsx via api.getAuditEvents(). Usa os
// mesmos event_type de src/components/invoices/auditEventTypes.js para
// que rótulos/ícones fiquem consistentes entre o AuditTab (por nota) e
// este log global.

let seed = 99
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}
function randInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)]
}
function pad(n, len) {
  return String(n).padStart(len, '0')
}
function isoDate(daysAgo) {
  const d = new Date('2026-07-31T00:00:00')
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

const ANALISTAS = ['ana.silva@bhub.ai', 'carlos.souza@bhub.ai', 'juliana.pereira@bhub.ai', 'ricardo.alves@bhub.ai']

const EVENT_DEFS = [
  { type: 'invoice.ingested', actorType: 'system', actor: () => 'system' },
  { type: 'invoice.engine.status_changed', actorType: 'motor', actor: () => 'motor' },
  { type: 'invoice.feedback.upvote', actorType: 'analyst', actor: () => pick(ANALISTAS) },
  { type: 'invoice.feedback.downvote', actorType: 'analyst', actor: () => pick(ANALISTAS) },
  { type: 'invoice.auto_review.published', actorType: 'motor', actor: () => 'motor' },
  { type: 'invoice.escrituracao.enviada_onvio', actorType: 'analyst', actor: () => pick(ANALISTAS) },
  { type: 'invoice.integration.locked', actorType: 'system', actor: () => 'system' },
  { type: 'invoice.integration.unlocked', actorType: 'analyst', actor: () => pick(ANALISTAS) },
  { type: 'invoice.escrituracao.run_manual', actorType: 'analyst', actor: () => pick(ANALISTAS) },
  { type: 'invoice.escrituracao.feedback_submitted', actorType: 'analyst', actor: () => pick(ANALISTAS) },
  { type: 'invoice.escrituracao.undone', actorType: 'analyst', actor: () => pick(ANALISTAS) },
  { type: 'invoice.escrituracao.problem_reported', actorType: 'analyst', actor: () => pick(ANALISTAS) },
  { type: 'invoice.override.submitted', actorType: 'analyst', actor: () => pick(ANALISTAS) },
  { type: 'invoice.approved.as_feedback', actorType: 'analyst', actor: () => pick(ANALISTAS) },
]

function buildPayload(type, invoiceId) {
  switch (type) {
    case 'invoice.ingested':
      return { api_source: 'DOMINIO', document_type: 'NFE' }
    case 'invoice.engine.status_changed':
      return { from: 'PENDENTE', to: pick(['CONFORME', 'REQUER_REVISAO', 'BLOQUEADO']), rules_count: randInt(4, 24) }
    case 'invoice.feedback.upvote':
      return { comment: null }
    case 'invoice.feedback.downvote':
      return { comment: '[cfop] CFOP divergente do esperado para a operação.' }
    case 'invoice.integration.locked':
      return { endpoint: '/dominio/nfe/entrada' }
    case 'invoice.escrituracao.run_manual':
      return { prev_status: 'PENDENTE', new_status: 'ESCRITURADA', force: rand() > 0.7 }
    case 'invoice.escrituracao.feedback_submitted':
      return { items_count: randInt(3, 6), corrections_count: randInt(0, 2) }
    case 'invoice.escrituracao.undone':
      return { batch_size: randInt(1, 5) }
    case 'invoice.escrituracao.problem_reported':
      return { comment: 'Divergência de NCM identificada na conferência manual.' }
    case 'invoice.override.submitted':
      return { invoice_id: invoiceId, fields_changed: ['cfop', 'cst_icms'] }
    default:
      return null
  }
}

const TOTAL_EVENTS = 34

const AUDIT_EVENTS = Array.from({ length: TOTAL_EVENTS }, (_, i) => {
  const def = EVENT_DEFS[i % EVENT_DEFS.length]
  const invoiceId = randInt(1, 60)
  const daysAgo = randInt(0, 90)
  return {
    id: i + 1,
    created_at: `${isoDate(daysAgo)}T${pad(randInt(7, 20), 2)}:${pad(randInt(0, 59), 2)}:${pad(randInt(0, 59), 2)}Z`,
    event_type: def.type,
    actor: def.actor(),
    actor_type: def.actorType,
    invoice_id: invoiceId,
    payload: buildPayload(def.type, invoiceId),
  }
}).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

mockRoute('/audit/events', 'GET', (path) => {
  const params = paramsOf(path)
  let out = AUDIT_EVENTS
  const eventType = params.get('event_type')
  if (eventType) out = out.filter((e) => e.event_type === eventType)
  const actor = params.get('actor')
  if (actor) out = out.filter((e) => (e.actor || '').toLowerCase().includes(actor.toLowerCase()))
  const actorType = params.get('actor_type')
  if (actorType) out = out.filter((e) => e.actor_type === actorType)
  const startDate = params.get('start_date')
  if (startDate) out = out.filter((e) => e.created_at.slice(0, 10) >= startDate)
  const endDate = params.get('end_date')
  if (endDate) out = out.filter((e) => e.created_at.slice(0, 10) <= endDate)
  const limit = Number(params.get('limit')) || 100
  const offset = Number(params.get('offset')) || 0
  // limit/offset -> page/pageSize para devolver a forma paginada
  // {items, total, page, page_size, total_pages} esperada pelo <Pagination/>.
  const pageSize = limit
  const page = Math.floor(offset / limit) + 1
  return paginate(out, page, pageSize)
})
