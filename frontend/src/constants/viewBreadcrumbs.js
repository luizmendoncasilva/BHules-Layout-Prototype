import { INTEGRADAS_TABS } from './integradasTabs'
import { SPED_TABS } from './spedTabs'
import { CRAWLER_TABS, BHUBTAX_TABS } from '../components/layout/Sidebar'

// Metadados de breadcrumb por "view" (o mesmo identificador usado em
// currentView no App.jsx). `subTabs`, quando presente, é a lista de
// sub-telas do módulo (mesma fonte usada pela sidebar) — o valor atual de
// subViews[view] vira o último item do breadcrumb. `parent` encadeia pra
// uma view "pai" quando a tela é um desdobramento de outra (ex: detalhe de
// nota volta pra lista, diagnóstico de reforma volta pro diagnóstico).
export const VIEW_BREADCRUMBS = {
  list: { label: 'Notas Fiscais' },
  detail: { label: 'Detalhe da Nota', parent: 'list' },
  batch: { label: 'Resolução em Lote' },
  integradas: { label: 'Notas Integradas', subTabs: INTEGRADAS_TABS },
  crawler: { label: 'Legislação', subTabs: CRAWLER_TABS },
  'tax-alerts': { label: 'Alertas Tributários' },
  exceptions: { label: 'Fila de Exceções', parent: 'tax-alerts' },
  sped: { label: 'Dados SPED', subTabs: SPED_TABS },
  bhubtax: { label: 'BHub Tax', subTabs: BHUBTAX_TABS },
  audit: { label: 'Auditoria' },
  diagnosis: { label: 'Diagnóstico Fiscal' },
  'reform-diagnosis': { label: 'Reforma Tributária', parent: 'diagnosis' },
  recovery: { label: 'Recuperação de Créditos' },
  capture: { label: 'Captura de Notas' },
  onboarding: { label: 'Habilitar Clientes' },
  'cfop-rules': { label: 'Regras CFOP' },
}
