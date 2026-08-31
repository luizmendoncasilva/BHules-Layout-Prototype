// Fixtures para SPED Fiscal / EFD Contribuições / EFD-Reinf / Contexto
// Simples Nacional (src/components/sped/SpedManager.jsx). Campos seguem
// exatamente o que a tabela lê (company_name/company_cnpj, sped_type,
// computed_mode, total_c100/total_0200/total_c170/total_a100/total_a170,
// s3_key) e não o nome "ideal" da API — parseEventTypesSummary() em
// SpedManager.jsx exige o formato de string "R-2010(340), R-4020(12)".
import { mockRoute, paginate, paramsOf } from './registry'
import { MOCK_COMPANIES } from './companies'

function company(id) {
  return MOCK_COMPANIES.find((c) => c.id === id) || MOCK_COMPANIES[0]
}

// ---------------------------------------------------------------------
// SPED Fiscal (ICMS/IPI) + EFD Contribuições (PIS/COFINS)
// ---------------------------------------------------------------------
const SPED_COMPANY_IDS = [1, 2, 3, 4, 5, 6]
const PERIODS = [
  ['2026-05-01', '2026-05-31'],
  ['2026-06-01', '2026-06-30'],
  ['2026-07-01', '2026-07-31'],
]

const SPED_FILES = Array.from({ length: 20 }, (_, i) => {
  const companyId = SPED_COMPANY_IDS[i % SPED_COMPANY_IDS.length]
  const c = company(companyId)
  const [periodStart, periodEnd] = PERIODS[i % PERIODS.length]
  const isContrib = i % 3 === 1
  const spedType = isContrib ? 'CONTRIBUICOES' : 'FISCAL'
  const monthTag = periodStart.slice(0, 7).replace('-', '')
  const status = i % 11 === 10 ? 'erro' : i % 7 === 6 ? 'processando' : 'processado'
  return {
    id: i + 1,
    filename: isContrib
      ? `EFDCONTRIB_${c.cnpj.replace(/\D/g, '')}_${monthTag}.txt`
      : `SPEDFISCAL_${c.cnpj.replace(/\D/g, '')}_${monthTag}.txt`,
    company_id: companyId,
    company_name: c.razao_social,
    company_cnpj: c.cnpj,
    company_razao_social: c.razao_social,
    sped_type: spedType,
    mode: i % 2 === 0 ? 'normal' : 'complementar',
    computed_mode: spedType === 'FISCAL' ? (i % 3 === 0 ? 'INDUSTRIAL' : 'COMERCIAL') : null,
    period_start: periodStart,
    period_end: periodEnd,
    // FISCAL: NFs = total_c100, Itens = total_0200. CONTRIBUICOES: NFs =
    // total_c100+total_a100, Itens = total_c170+total_a170 (ver SpedManager.jsx).
    total_c100: spedType === 'FISCAL' ? 180 + i * 7 : 90 + i * 3,
    total_0200: 420 + i * 11,
    total_a100: spedType === 'CONTRIBUICOES' ? 40 + i * 2 : 0,
    total_c170: spedType === 'CONTRIBUICOES' ? 210 + i * 6 : 0,
    total_a170: spedType === 'CONTRIBUICOES' ? 60 + i * 2 : 0,
    event_types_summary: spedType === 'FISCAL'
      ? { C100: 180 + i * 7, C170: 340 + i * 9, '0200': 420 + i * 11 }
      : { A100: 40 + i * 2, A170: 60 + i * 2, C100: 90 + i * 3, C170: 210 + i * 6 },
    uploaded_at: `2026-0${5 + (i % 3)}-${String(2 + (i % 26)).padStart(2, '0')}T${String(8 + (i % 10)).padStart(2, '0')}:15:00Z`,
    status,
    s3_key: i % 4 !== 3 ? `sped/${companyId}/${monthTag}/arquivo_${i + 1}.txt` : null,
  }
})

mockRoute('/sped/by-company', 'GET', () => {
  const groups = new Map()
  for (const f of SPED_FILES) {
    if (!groups.has(f.company_id)) {
      const c = company(f.company_id)
      groups.set(f.company_id, {
        company_id: f.company_id,
        company_name: c.razao_social,
        company_cnpj: c.cnpj,
        total_files: 0,
        fiscal_files: 0,
        contribuicoes_files: 0,
      })
    }
    const g = groups.get(f.company_id)
    g.total_files += 1
    if (f.sped_type === 'FISCAL') g.fiscal_files += 1
    else g.contribuicoes_files += 1
  }
  return Array.from(groups.values())
})

mockRoute(/^\/sped\/files-paginated$/, 'GET', (path) => {
  const params = paramsOf(path)
  const search = (params.get('search') || '').trim().toLowerCase()
  const companyId = params.get('company_id')
  const periodStart = params.get('period_start')
  const periodEnd = params.get('period_end')
  const spedType = params.get('sped_type')
  const page = params.get('page') || 1
  const pageSize = params.get('page_size') || 50

  let filtered = SPED_FILES
  if (companyId) filtered = filtered.filter((f) => String(f.company_id) === String(companyId))
  if (spedType) filtered = filtered.filter((f) => f.sped_type === spedType)
  if (periodStart) filtered = filtered.filter((f) => f.period_end >= periodStart)
  if (periodEnd) filtered = filtered.filter((f) => f.period_start <= periodEnd)
  if (search) {
    filtered = filtered.filter((f) =>
      f.filename.toLowerCase().includes(search) ||
      f.company_name.toLowerCase().includes(search) ||
      f.company_cnpj.toLowerCase().includes(search)
    )
  }
  return paginate(filtered, page, pageSize)
})

mockRoute(/^\/sped\/files\/(\d+)$/, 'DELETE', () => ({ ok: true }))

// ---------------------------------------------------------------------
// EFD-Reinf
// ---------------------------------------------------------------------
const REINF_COMPANY_IDS = [1, 2, 4, 5, 6, 8]
const REINF_EVENT_TYPES = ['R-2010', 'R-4020']

const REINF_FILES = Array.from({ length: 12 }, (_, i) => {
  const companyId = REINF_COMPANY_IDS[i % REINF_COMPANY_IDS.length]
  const c = company(companyId)
  const [periodStart, periodEnd] = PERIODS[i % PERIODS.length]
  const monthTag = periodStart.slice(0, 7)
  const r2010 = 200 + i * 15
  const r4020 = 10 + i * 3
  return {
    id: i + 1,
    filename: `REINF_${c.cnpj.replace(/\D/g, '')}_${monthTag.replace('-', '')}.xml`,
    company_id: companyId,
    company_name: c.razao_social,
    company_cnpj: c.cnpj,
    company_razao_social: c.razao_social,
    period_start: periodStart,
    period_end: periodEnd,
    periodo_apuracao: monthTag,
    total_events: r2010 + r4020,
    // Formato exigido por parseEventTypesSummary() em SpedManager.jsx:
    // "R-2010(200), R-4020(10)"
    event_types_summary: `R-2010(${r2010}), R-4020(${r4020})`,
    uploaded_at: `2026-0${5 + (i % 3)}-${String(3 + (i % 25)).padStart(2, '0')}T${String(9 + (i % 8)).padStart(2, '0')}:00:00Z`,
    status: i % 9 === 8 ? 'erro' : 'processado',
    s3_key: i % 3 !== 2 ? `reinf/${companyId}/${monthTag}/arquivo_${i + 1}.xml` : null,
  }
})

mockRoute('/reinf/by-company', 'GET', () => {
  const groups = new Map()
  for (const f of REINF_FILES) {
    if (!groups.has(f.company_id)) {
      const c = company(f.company_id)
      groups.set(f.company_id, {
        company_id: f.company_id,
        company_name: c.razao_social,
        company_cnpj: c.cnpj,
        total_files: 0,
        total_events: 0,
      })
    }
    const g = groups.get(f.company_id)
    g.total_files += 1
    g.total_events += f.total_events
  }
  return Array.from(groups.values())
})

mockRoute(/^\/reinf\/files-paginated$/, 'GET', (path) => {
  const params = paramsOf(path)
  const search = (params.get('search') || '').trim().toLowerCase()
  const companyId = params.get('company_id')
  const periodStart = params.get('period_start')
  const periodEnd = params.get('period_end')
  const page = params.get('page') || 1
  const pageSize = params.get('page_size') || 50

  let filtered = REINF_FILES
  if (companyId) filtered = filtered.filter((f) => String(f.company_id) === String(companyId))
  if (periodStart) filtered = filtered.filter((f) => f.period_end >= periodStart)
  if (periodEnd) filtered = filtered.filter((f) => f.period_start <= periodEnd)
  if (search) {
    filtered = filtered.filter((f) =>
      f.filename.toLowerCase().includes(search) ||
      f.company_name.toLowerCase().includes(search) ||
      f.company_cnpj.toLowerCase().includes(search)
    )
  }
  return paginate(filtered, page, pageSize)
})

mockRoute(/^\/reinf\/files\/(\d+)\/events$/, 'GET', (path, match) => {
  const fileId = Number(match[1])
  const file = REINF_FILES.find((f) => f.id === fileId) || REINF_FILES[0]
  return Array.from({ length: 8 }, (_, i) => ({
    tipo: REINF_EVENT_TYPES[i % REINF_EVENT_TYPES.length],
    competencia: file.periodo_apuracao,
    valor: Number((450.75 + i * 123.4).toFixed(2)),
  }))
})

mockRoute(/^\/reinf\/files\/(\d+)$/, 'DELETE', () => ({ ok: true }))

// ---------------------------------------------------------------------
// Contexto Simples Nacional
// ---------------------------------------------------------------------
const SN_COMPANY_IDS = [3, 5, 8]

const SIMPLES_NACIONAL_FILES = Array.from({ length: 8 }, (_, i) => {
  const companyId = SN_COMPANY_IDS[i % SN_COMPANY_IDS.length]
  const c = company(companyId)
  const [periodStart, periodEnd] = PERIODS[i % PERIODS.length]
  const monthTag = periodStart.slice(0, 7)
  const entradas = 30 + i * 4
  const saidas = 55 + i * 6
  return {
    id: i + 1,
    filename: `CONTEXTO_SN_${c.cnpj.replace(/\D/g, '')}_${monthTag.replace('-', '')}.xlsx`,
    company_id: companyId,
    company_name: c.razao_social,
    company_cnpj: c.cnpj,
    company_razao_social: c.razao_social,
    period_start: periodStart,
    period_end: periodEnd,
    total_entradas: entradas,
    total_saidas: saidas,
    total_items: entradas + saidas,
    uploaded_at: `2026-0${5 + (i % 3)}-${String(5 + (i % 22)).padStart(2, '0')}T10:30:00Z`,
    status: 'processado',
    s3_key: `simples-nacional/${companyId}/${monthTag}/arquivo_${i + 1}.xlsx`,
  }
})

mockRoute(/^\/simples-nacional\/files-paginated$/, 'GET', (path) => {
  const params = paramsOf(path)
  const search = (params.get('search') || '').trim().toLowerCase()
  const companyId = params.get('company_id')
  const periodStart = params.get('period_start')
  const periodEnd = params.get('period_end')
  const page = params.get('page') || 1
  const pageSize = params.get('page_size') || 50

  let filtered = SIMPLES_NACIONAL_FILES
  if (companyId) filtered = filtered.filter((f) => String(f.company_id) === String(companyId))
  if (periodStart) filtered = filtered.filter((f) => f.period_end >= periodStart)
  if (periodEnd) filtered = filtered.filter((f) => f.period_start <= periodEnd)
  if (search) {
    filtered = filtered.filter((f) =>
      f.filename.toLowerCase().includes(search) ||
      f.company_name.toLowerCase().includes(search) ||
      f.company_cnpj.toLowerCase().includes(search)
    )
  }
  return paginate(filtered, page, pageSize)
})

mockRoute(/^\/simples-nacional\/files\/(\d+)$/, 'DELETE', () => ({ ok: true }))
