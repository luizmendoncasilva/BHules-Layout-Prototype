// Finalidades de escrituração (perspectiva do destinatário) e helpers de
// classificação de não contribuinte do ICMS. Espelha o enum Finalidade do
// motor (services/rule_engine). Fonte única para os selects de correção.

export const FINALIDADES = [
  'REVENDA', 'MATERIA_PRIMA', 'USO_CONSUMO', 'ATIVO_IMOBILIZADO',
  'SERVICO', 'IMPORTACAO', 'DEVOLUCAO', 'RETORNO', 'BONIFICACAO', 'TRANSFERENCIA',
  'INDUSTRIALIZACAO_TERCEIROS', 'OPERACAO_ESPECIFICA',
]

export const FINALIDADE_LABELS = {
  REVENDA: 'Revenda',
  MATERIA_PRIMA: 'Industrialização (matéria-prima/insumo)',
  USO_CONSUMO: 'Uso e consumo',
  ATIVO_IMOBILIZADO: 'Ativo imobilizado',
  SERVICO: 'Serviço',
  IMPORTACAO: 'Importação',
  DEVOLUCAO: 'Devolução',
  RETORNO: 'Retorno',
  BONIFICACAO: 'Bonificação',
  TRANSFERENCIA: 'Transferência',
  // Eixo de operação (Célula 10/09, R5/R6 — mig 199)
  INDUSTRIALIZACAO_TERCEIROS: 'Industrialização em terceiros (remessa/retorno)',
  OPERACAO_ESPECIFICA: 'Operações específicas (simples remessa/outras)',
}

// Destinações juridicamente impossíveis para o não contribuinte do ICMS
// (§6.1 do documento de negócio): não revende nem industrializa sob ICMS.
export const FINALIDADES_VEDADAS_NAO_CONTRIB = ['REVENDA', 'MATERIA_PRIMA']

// IE indica não contribuinte quando vazia/nula ou "ISENTO"/"ISENTA".
function ieIndicaNaoContribuinte(ie) {
  if (ie == null || !String(ie).trim()) return true
  const norm = String(ie)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos
    .trim()
    .toUpperCase()
  return norm === 'ISENTO' || norm === 'ISENTA'
}

// GA-2: cadastro (Cockpit) é a fonte primária. Sem cadastro carregado, usa o
// sinal da NF-e (ie_destinatario, depois indIEDest=9). Em conflito (cadastro
// com IE válida) prevalece o cadastro.
export function isRecipientNaoContribuinte(company, invoice) {
  if (company && 'inscricao_estadual' in company) {
    return ieIndicaNaoContribuinte(company.inscricao_estadual)
  }
  const ie = invoice?.ie_destinatario
  if (ie != null && String(ie).trim()) return ieIndicaNaoContribuinte(ie)
  return (invoice?.ind_ie_dest ?? '') === '9'
}

// Lista de finalidades permitidas para o select, ocultando as vedadas quando
// o destinatário é não contribuinte do ICMS.
export function getFinalidadesPermitidas(naoContribuinte) {
  if (!naoContribuinte) return FINALIDADES
  return FINALIDADES.filter((f) => !FINALIDADES_VEDADAS_NAO_CONTRIB.includes(f))
}
