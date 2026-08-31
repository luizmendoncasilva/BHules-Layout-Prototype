import { mockRoute, paginate, paramsOf } from './registry'
import { MOCK_COMPANIES } from './companies'

// Formato real lido por src/components/recovery/CreditRecovery.jsx — bem
// diferente do rascunho inicial: status usa 'READY' (não 'completed'),
// tipo/urgencia/risco são enums em maiúsculas específicos do domínio
// (MONOFASICO_SN, CRITICO_6M, VERDE/AMARELO/VERMELHO etc.), e o dashboard
// tem campos agregados dedicados (by_tipo, by_urgencia, prescricao_timeline,
// quickwins) em vez de totais simples.

const TIPOS = [
  'MONOFASICO_SN', 'INSUMO_NAO_CREDITADO', 'ICMS_ST_RESSARCIMENTO',
  'ICMS_EXTEMPORANEO', 'NCM_CST_CFOP_PERDA', 'CIAP_NAO_APROVEITADO',
  'PIS_COFINS_DEPRECIACAO', 'ICMS_ACUMULADO_EXPORTADOR',
]
const URGENCIAS = ['CRITICO_6M', 'ALERTA_12M', 'ALERTA_24M', 'NORMAL', 'PRESCRITO']
const RISCOS = ['VERDE', 'AMARELO', 'VERMELHO']
const PROCEDIMENTOS = ['ADMINISTRATIVO', 'JUDICIAL', 'MISTO']

const NARRATIVE =
  'A varredura identificou R$ 184,3 mil em oportunidades de recuperação de créditos tributários nos últimos 60 meses, concentradas ' +
  'principalmente em ICMS (R$ 90 mil) por aproveitamento indevido de alíquotas em operações interestaduais. Recomenda-se priorizar as ' +
  'oportunidades classificadas como urgência crítica (6 meses), que juntas representam a maior parte do valor recuperável com menor risco de glosa.'

function buildScans(companyId) {
  const cid = Number(companyId) || 1
  return [1, 2, 3].map((n) => ({
    id: cid * 10 + n,
    company_id: cid,
    started_at: `2026-0${n + 3}-10T08:00:00Z`,
    finished_at: `2026-0${n + 3}-10T08:14:00Z`,
    status: 'READY',
    months_scanned: 60,
    period_start: '2021-08-01',
    period_end: '2026-07-31',
    invoices_scanned: 1840,
    items_scanned: 7360,
    resumo_narrativo: n === 3 ? NARRATIVE : null,
  }))
}

mockRoute(/^\/recovery\/(\d+)\/scans$/, 'GET', (path, match) => buildScans(match[1]))

mockRoute(/^\/recovery\/(\d+)\/scan$/, 'POST', () => ({ ok: true, scan_id: 501 }))

mockRoute('/recovery/scan-all', 'POST', () => ({ ok: true, scan_id: 501 }))

mockRoute(/^\/recovery\/scans\/(\d+)$/, 'GET', (path, match) => {
  const scanId = Number(match[1])
  return {
    id: scanId,
    company_id: Math.floor(scanId / 10) || 1,
    started_at: '2026-06-10T08:00:00Z',
    finished_at: '2026-06-10T08:14:00Z',
    status: 'READY',
    months_scanned: 60,
    period_start: '2021-08-01',
    period_end: '2026-07-31',
    invoices_scanned: 1840,
    items_scanned: 7360,
    resumo_narrativo: NARRATIVE,
  }
})

function buildOpportunities(scanId) {
  const list = []
  for (let i = 0; i < 24; i++) {
    const tipo = TIPOS[i % TIPOS.length]
    const urgencia = URGENCIAS[i % URGENCIAS.length]
    const risco = RISCOS[i % RISCOS.length]
    const month = String(1 + (i % 12)).padStart(2, '0')
    const diasPrescricao = urgencia === 'CRITICO_6M' ? 60 + i * 3 : urgencia === 'ALERTA_12M' ? 200 + i * 4 : 500 + i * 10
    list.push({
      id: scanId * 100 + i,
      tipo,
      urgencia,
      risco,
      valor_corrigido_selic: Number((3200 + i * 850.4).toFixed(2)),
      valor_nominal: Number((2800 + i * 700.2).toFixed(2)),
      competencia: `2023-${month}`,
      dias_para_prescricao: diasPrescricao,
      procedimento: PROCEDIMENTOS[i % PROCEDIMENTOS.length],
      fundamentacao_legal: 'Art. 168, I do CTN c/c Solução de Consulta COSIT nº 106/2023.',
      acao_recomendada: 'Protocolar pedido de restituição/compensação via PER/DCOMP com memória de cálculo anexa.',
      jurisprudencia: i % 3 === 0 ? 'STJ, REsp 1.221.170/PR (regime de insumos para fins de crédito de PIS/COFINS).' : undefined,
      calculo_detalhado: { base_calculo: Number((15000 + i * 1200).toFixed(2)), aliquota: '9,25%', selic_acumulada: '18,4%' },
    })
  }
  return list
}

mockRoute(/^\/recovery\/scans\/(\d+)\/opportunities$/, 'GET', (path, match) => {
  const scanId = Number(match[1])
  const params = paramsOf(path)
  let items = buildOpportunities(scanId)
  const tipo = params.get('tipo')
  const urgencia = params.get('urgencia')
  const risco = params.get('risco')
  const tributo = params.get('tributo')
  if (tipo) items = items.filter((o) => o.tipo === tipo)
  if (urgencia) items = items.filter((o) => o.urgencia === urgencia)
  if (risco) items = items.filter((o) => o.risco === risco)
  if (tributo) items = items.filter((o) => o.tipo === tributo)
  return paginate(items, params.get('page'), params.get('page_size'))
})

mockRoute(/^\/recovery\/scans\/(\d+)\/opportunities\/(\d+)$/, 'GET', (path, match) => {
  const scanId = Number(match[1])
  const oppId = Number(match[2])
  const all = buildOpportunities(scanId)
  return all.find((o) => o.id === oppId) || all[0]
})

mockRoute(/^\/recovery\/scans\/(\d+)\/dashboard$/, 'GET', (path, match) => {
  const scanId = Number(match[1])
  const opps = buildOpportunities(scanId)
  const totalNominal = opps.reduce((s, o) => s + o.valor_nominal, 0)
  const totalCorrigido = opps.reduce((s, o) => s + o.valor_corrigido_selic, 0)
  const byTipo = TIPOS.map((tipo) => ({
    tipo,
    valor_corrigido: opps.filter((o) => o.tipo === tipo).reduce((s, o) => s + o.valor_corrigido_selic, 0),
  }))
  const byUrgencia = URGENCIAS.map((urgencia) => ({
    urgencia,
    valor_corrigido: opps.filter((o) => o.urgencia === urgencia).reduce((s, o) => s + o.valor_corrigido_selic, 0),
  }))
  const prescricaoTimeline = ['Ago/26', 'Set/26', 'Out/26', 'Nov/26', 'Dez/26', 'Jan/27'].map((mes, i) => ({
    mes,
    valor_prescrevendo: 8000 + i * 2100,
    count: 2 + (i % 3),
  }))
  return {
    total_valor_nominal: Number(totalNominal.toFixed(2)),
    total_valor_corrigido: Number(totalCorrigido.toFixed(2)),
    total_opportunities: opps.length,
    total_prescrevendo_6m: opps.filter((o) => o.urgencia === 'CRITICO_6M').length,
    by_tipo: byTipo,
    by_urgencia: byUrgencia,
    prescricao_timeline: prescricaoTimeline,
    quickwins: opps.filter((o) => o.risco === 'VERDE' && o.urgencia !== 'PRESCRITO').slice(0, 5),
  }
})

mockRoute(/^\/recovery\/scans\/(\d+)\/narrative$/, 'POST', () => ({ narrative: NARRATIVE }))

mockRoute(/^\/recovery\/opportunities\/(\d+)\/review$/, 'PATCH', () => ({ ok: true }))

mockRoute('/recovery/dashboard/portfolio', 'GET', (path) => {
  const params = paramsOf(path)
  const limit = Number(params.get('limit')) || 50
  const list = MOCK_COMPANIES.map((c, i) => ({
    company_id: c.id,
    razao_social: c.razao_social,
    total_valor_corrigido: 45000 + i * 18250.3,
    total_opportunities: 12 + i * 3,
    by_urgencia: { CRITICO_6M: 1 + (i % 4), ALERTA_12M: 2 + (i % 5), ALERTA_24M: 2 + (i % 3), NORMAL: 3 + (i % 4) },
    last_scan_at: `2026-0${(i % 6) + 1}-15T09:00:00Z`,
  }))
  return list.slice(0, limit)
})
