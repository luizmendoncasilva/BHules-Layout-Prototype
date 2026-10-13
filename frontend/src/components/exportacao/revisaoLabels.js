// Rótulos e leitores do contrato de revisão de exportação (design.md §5.4).
// `valores_nota` é o snapshot de CAMPOS_DECISAO gravado na abertura da revisão.

export const STATUS_REVISAO = {
  PENDENTE: 'Pendente',
  EXPIRADA: 'Expirada',
  DECIDIDA_EXPORTACAO: 'Exportação',
  DECIDIDA_INTERNO: 'Mercado interno',
}

export const GATILHO_REVISAO = {
  LEIAUTE_ANTIGO_DECLARA_EXPORTACAO: 'Leiaute antigo declara exportação',
  TOMADOR_EXTERIOR_SEM_CADASTRO: 'Tomador no exterior sem cadastro',
}

export const FORMAS_RECEBIMENTO = [
  ['CONTRATO_CAMBIO', 'Contrato de Câmbio (Swift/Bacen)'],
  ['CARTAO_CREDITO', 'Cartão de Crédito Internacional'],
  ['PLATAFORMA_INTERNACIONAL', 'Plataforma Internacional (Stripe/PayPal)'],
  ['TRANSFERENCIA_INTERNACIONAL', 'Transferência Internacional em Moeda Estrangeira'],
  ['OUTRO', 'Outro Meio Comprovado'],
]

export function formatCompetencia(comp) {
  if (!comp) return '—'
  const s = String(comp).replace(/[-/]/g, '').trim()
  return s.length >= 6 ? `${s.slice(4, 6)}/${s.slice(0, 4)}` : comp
}

export function formatData(iso) {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('pt-BR')
}

export function formatValorMoeda(valores) {
  const v = valores?.v_serv_moeda
  if (v == null || v === '') return '—'
  const n = Number(v)
  const moeda = valores?.tp_moeda ? ` ${valores.tp_moeda}` : ''
  return (Number.isNaN(n) ? String(v) : n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })) + moeda
}

export function tomadorDaNota(valores) {
  const v = valores || {}
  return {
    nome: v.dest_razao_social || '—',
    pais: v.dest_pais || '',
    doc: v.dest_nif ? `NIF ${v.dest_nif}` : v.dest_cnpj ? `CNPJ/CPF ${v.dest_cnpj}` : '',
  }
}

export function ehAberta(rev) {
  return rev.status === 'PENDENTE' || rev.status === 'EXPIRADA'
}

// Decisão "exportação" depois do corte gera PENDENCIA_RETIFICACAO (spec Revisão AC5).
export function depoisDoCorte(rev, hoje = new Date()) {
  if (rev.status === 'EXPIRADA') return true
  if (!rev.corte) return false
  const hojeStr = hoje instanceof Date ? hoje.toISOString().slice(0, 10) : String(hoje).slice(0, 10)
  return hojeStr >= rev.corte
}
