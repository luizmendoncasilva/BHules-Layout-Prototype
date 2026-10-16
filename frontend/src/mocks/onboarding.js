import { mockRoute, paginate, paramsOf } from './registry'
import { MOCK_COMPANIES } from './companies'

// Candidatos de busca (empresas ainda não onboardadas na plataforma) —
// conjunto fixo, desconectado do MOCK_COMPANIES (que já representa
// empresas onboardadas).
const SEARCH_CANDIDATES = [
  { cnpj: '11.222.333/0001-01', razao_social: 'Auto Pecas Bandeira Ltda', uf: 'SP', situacao: 'ATIVA' },
  { cnpj: '22.333.444/0001-02', razao_social: 'Restaurante Sabor Caseiro Eireli', uf: 'MG', situacao: 'ATIVA' },
  { cnpj: '33.444.555/0001-03', razao_social: 'Papelaria Escreva Bem Ltda', uf: 'RJ', situacao: 'ATIVA' },
  { cnpj: '44.555.666/0001-04', razao_social: 'Clinica Odontologica Sorriso Ltda', uf: 'PR', situacao: 'ATIVA' },
  { cnpj: '55.666.777/0001-05', razao_social: 'Distribuidora Norte Sul de Alimentos S.A.', uf: 'SC', situacao: 'ATIVA' },
  { cnpj: '66.777.888/0001-06', razao_social: 'Grafica Impressoes Rapidas Ltda', uf: 'SP', situacao: 'SUSPENSA' },
  { cnpj: '77.888.999/0001-07', razao_social: 'Academia Corpo em Forma Ltda', uf: 'RS', situacao: 'ATIVA' },
  { cnpj: '88.999.000/0001-08', razao_social: 'Materiais de Construcao Forte Ltda', uf: 'BA', situacao: 'ATIVA' },
  { cnpj: '99.000.111/0001-09', razao_social: 'Petshop Amigo Fiel Comercio Ltda', uf: 'SP', situacao: 'BAIXADA' },
  { cnpj: '10.111.222/0001-10', razao_social: 'Livraria e Papelaria Conhecimento Ltda', uf: 'MG', situacao: 'ATIVA' },
]

mockRoute('/onboarding/search', 'GET', (path) => {
  const params = paramsOf(path)
  const q = (params.get('q') || '').toLowerCase()
  const limit = Number(params.get('limit')) || 20
  const filtered = q
    ? SEARCH_CANDIDATES.filter(
        // Só compara CNPJ quando a busca tem dígitos ('' casaria com tudo).
        (c) => c.razao_social.toLowerCase().includes(q)
          || (/\d/.test(q) && c.cnpj.replace(/\D/g, '').includes(q.replace(/\D/g, ''))),
      )
    : SEARCH_CANDIDATES
  // Formato lido por ClientOnboarding (data.results com guid/corporate_name/
  // company_tax_type/status...). Antes vinha um array cru e a busca sempre
  // mostrava "Nenhum resultado encontrado".
  const TAX_TYPES = ['SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL']
  const results = filtered.slice(0, limit).map((c, i) => ({
    ...c,
    guid: `cockpit-${c.cnpj.replace(/\D/g, '')}`,
    corporate_name: c.razao_social,
    company_tax_type: TAX_TYPES[i % TAX_TYPES.length],
    status: c.situacao,
    state_registration: `${100 + i}.${200 + i}.${300 + i}.${400 + i}`,
    city: null,
    city_ibge_code: null,
  }))
  return { results, total: results.length }
})

// Formato lido por ClientOnboarding.handleEnable (status/message/company_id/
// regime_tributario/uf) — sem `message` o toast de sucesso saía vazio.
mockRoute('/onboarding/enable', 'POST', (_path, _m, rawBody) => {
  let body = {}
  try { body = JSON.parse(rawBody || '{}') } catch { /* corpo inválido */ }
  return {
    ok: true,
    status: 'created',
    message: `Empresa ${body.corporate_name || ''} habilitada no motor de regras.`.replace('  ', ' '),
    company_id: 99,
    regime_tributario: body.company_tax_type || 'LUCRO_PRESUMIDO',
    uf: body.uf || null,
  }
})

// Formato real lido por src/components/onboarding/ClientOnboarding.jsx —
// bem mais rico que um cadastro simples: uf/regime_tributario/
// atividade_principal, flags de módulo (nfe_entrada_enabled,
// nfse_servicos_enabled, motor_regras_enabled,
// recuperacao_tributaria_enabled), contadores de arquivo por tipo
// (sped_count, reinf_count, efd_contribuicoes_count,
// simples_nacional_count), última captura e status de certificado digital.
const ATIVIDADES = [
  'Comércio varejista de cosméticos e produtos de perfumaria',
  'Comércio atacadista de bebidas',
  'Fabricação de artefatos têxteis para uso doméstico',
  'Fabricação de outros produtos de metal',
  'Comércio varejista de produtos farmacêuticos',
  'Construção de edifícios',
  'Transporte rodoviário de carga',
  'Desenvolvimento de programas de computador sob encomenda',
]
const CERT_STATUSES = ['VALIDO', 'VENCE_EM_BREVE', 'VENCIDO', 'NAO_CADASTRADO']

function buildOnboardedCompanies() {
  const list = []
  for (let i = 0; i < 15; i++) {
    const base = MOCK_COMPANIES[i % MOCK_COMPANIES.length]
    const suffix = i >= MOCK_COMPANIES.length ? ` Filial ${i - MOCK_COMPANIES.length + 1}` : ''
    const day = String(1 + (i % 27)).padStart(2, '0')
    const certStatus = CERT_STATUSES[i % CERT_STATUSES.length]
    const nfeEnabled = base.nfe_entrada_enabled
    const nfseEnabled = base.nfse_servicos_enabled
    list.push({
      id: i + 1,
      razao_social: `${base.razao_social}${suffix}`,
      cnpj: base.cnpj,
      uf: base.uf,
      ativo: i % 7 !== 6,
      regime_tributario: base.regime_tributario,
      atividade_principal: ATIVIDADES[i % ATIVIDADES.length],
      onboarded_at: `2026-0${(i % 6) + 1}-${day}T09:30:00Z`,
      nfe_entrada_enabled: nfeEnabled,
      nfse_servicos_enabled: nfseEnabled,
      motor_regras_enabled: i % 8 !== 7,
      recuperacao_tributaria_enabled: i % 3 !== 2,
      sped_count: nfeEnabled ? (i % 5 === 0 ? 0 : 3 + (i % 6)) : 0,
      reinf_count: nfseEnabled ? (i % 4 === 0 ? 0 : 2 + (i % 5)) : 0,
      efd_contribuicoes_count: i % 3 === 0 ? 0 : 2 + (i % 4),
      simples_nacional_count: base.regime_tributario === 'SIMPLES_NACIONAL' ? 1 + (i % 3) : 0,
      last_capture_sync_at: i % 6 === 5 ? null : `2026-07-${day}T${String(6 + (i % 12)).padStart(2, '0')}:00:00Z`,
      certificado_cadastrado: certStatus !== 'NAO_CADASTRADO',
      certificado_status: certStatus,
      certificado_dias_restantes: certStatus === 'VENCE_EM_BREVE' ? 12 : certStatus === 'VALIDO' ? 180 : certStatus === 'VENCIDO' ? -8 : null,
      certificado_vencimento: certStatus === 'NAO_CADASTRADO' ? null : '2027-03-15',
    })
  }
  return list
}

const ONBOARDED_COMPANIES = buildOnboardedCompanies()

mockRoute('/onboarding/companies', 'GET', (path) => {
  const params = paramsOf(path)
  return paginate(ONBOARDED_COMPANIES, params.get('page'), params.get('page_size'))
})

mockRoute('/onboarding/sync-certificates', 'POST', () => ({ ok: true, synced: 12 }))

mockRoute(/^\/onboarding\/companies\/(\d+)\/certificate$/, 'GET', (path, match) => {
  const id = Number(match[1])
  const statuses = ['valido', 'vencendo', 'vencido']
  return {
    valid_until: '2027-03-15',
    issuer: 'AC Certisign RFB G5',
    status: statuses[id % statuses.length],
  }
})
