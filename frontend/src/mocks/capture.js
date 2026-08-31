import { mockRoute, paginate, paramsOf } from './registry'
import { MOCK_COMPANIES } from './companies'

// CaptureDashboard.jsx lê `dashboard.companies` (não `dashboard.items`) +
// `dashboard.global_totals` para os KPIs — paginate() sozinho não serve
// aqui, precisamos moldar a resposta no formato específico que a tela espera.

function buildSyncDashboard() {
  const list = []
  for (let i = 0; i < 12; i++) {
    const c = MOCK_COMPANIES[i % MOCK_COMPANIES.length]
    const day = String(1 + (i % 27)).padStart(2, '0')
    const statusCycle = ['recente', 'recente', 'recente', 'desatualizado', 'nunca']
    const cycle = statusCycle[i % statusCycle.length]
    // "Hoje" no app é 2026-07-31 — datas de 30/31 dão "Em dia", ~28-29 dão
    // "Desatualizado" (>1 e <=3 dias), mais antigas dão "Critico".
    const lastSync = cycle === 'nunca'
      ? null
      : cycle === 'desatualizado'
        ? '2026-07-29T09:00:00Z'
        : `2026-07-${['30', '31', '31'][i % 3]}T14:20:00Z`
    list.push({
      company_id: c.id,
      razao_social: c.razao_social,
      cnpj: c.cnpj,
      motor_regras_enabled: c.nfe_entrada_enabled !== false,
      recuperacao_tributaria_enabled: i % 2 === 0,
      last_sync: lastSync,
      nfe_entrada: 90 + i * 3,
      nfe_saida: 30 + i * 2,
      nfse_tomados: 20 + i,
      nfse_prestados: 10 + i,
      total_notas: 150 + i * 6,
    })
  }
  return list
}

const SYNC_DASHBOARD = buildSyncDashboard()

mockRoute('/capture/sync/dashboard', 'GET', (path) => {
  const params = paramsOf(path)
  const search = (params.get('search') || '').toLowerCase()
  const filtered = search
    ? SYNC_DASHBOARD.filter((c) => c.razao_social.toLowerCase().includes(search) || c.cnpj.includes(search))
    : SYNC_DASHBOARD
  const page = paginate(filtered, params.get('page'), params.get('page_size'))
  const globalTotals = SYNC_DASHBOARD.reduce((acc, c) => ({
    nfe_entrada: acc.nfe_entrada + c.nfe_entrada,
    nfe_saida: acc.nfe_saida + c.nfe_saida,
    nfse_tomados: acc.nfse_tomados + c.nfse_tomados,
    nfse_prestados: acc.nfse_prestados + c.nfse_prestados,
    total: acc.total + c.total_notas,
  }), { nfe_entrada: 0, nfe_saida: 0, nfse_tomados: 0, nfse_prestados: 0, total: 0 })
  return {
    companies: page.items,
    total: page.total,
    page: page.page,
    page_size: page.page_size,
    total_pages: page.total_pages,
    global_totals: globalTotals,
  }
})

mockRoute(/^\/capture\/sync\/status\/(\d+)$/, 'GET', (path, match) => {
  const id = Number(match[1])
  return (
    SYNC_DASHBOARD.find((s) => s.company_id === id) || {
      company_id: id,
      razao_social: MOCK_COMPANIES.find((c) => c.id === id)?.razao_social || 'Empresa não encontrada',
      last_sync: '2026-07-28T10:00:00Z',
      motor_regras_enabled: true,
      recuperacao_tributaria_enabled: false,
      nfe_entrada: 100,
      nfe_saida: 40,
      nfse_tomados: 25,
      nfse_prestados: 15,
      total_notas: 180,
    }
  )
})

mockRoute('/capture/sync', 'POST', () => ({ ok: true, job_id: 'job-mock-1' }))
mockRoute('/capture/sync-all', 'POST', () => ({ ok: true, job_id: 'job-mock-1' }))
mockRoute('/capture/sync-historical', 'POST', () => ({
  ok: true,
  job_id: 'job-mock-1',
  summary: { imported: 342, already_in_db: 58 },
}))

const TYPES = ['NFE_ENTRADA', 'NFE_SAIDA', 'NFSE_TOMADO', 'NFSE_PRESTADO']

function buildCapturedInvoices() {
  const list = []
  for (let i = 0; i < 15; i++) {
    const c = MOCK_COMPANIES[i % MOCK_COMPANIES.length]
    const day = String(1 + (i % 27)).padStart(2, '0')
    list.push({
      id: 5000 + i,
      type: TYPES[i % TYPES.length],
      company_id: c.id,
      numero: String(100000 + i),
      valor: 1200.5 + i * 340.25,
      data: `2026-07-${day}`,
    })
  }
  return list
}

const CAPTURED_INVOICES = buildCapturedInvoices()

mockRoute('/capture/invoices', 'GET', (path) => {
  const params = paramsOf(path)
  return paginate(CAPTURED_INVOICES, params.get('page'), params.get('page_size'))
})
