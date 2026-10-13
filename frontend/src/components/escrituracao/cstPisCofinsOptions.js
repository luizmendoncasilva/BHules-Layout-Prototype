// CST PIS/COFINS por regime tributário do destinatário.
// Compartilhado entre o modal por-item (CorrectionModal.jsx) e o modal em
// lote (invoices/DetailView.jsx) para evitar duplicação das tabelas.
export const CST_PIS_COFINS_LUCRO_REAL = [
  { code: '50', desc: 'Com direito a crédito' },
  { code: '51', desc: 'Com direito a crédito - vinculada receita tributada MI' },
  { code: '52', desc: 'Com direito a crédito - vinculada receita não tributada MI' },
  { code: '53', desc: 'Com direito a crédito - vinculada receita tributada e não tributada MI' },
  { code: '54', desc: 'Com direito a crédito - vinculada receita tributada exportação' },
  { code: '55', desc: 'Com direito a crédito - vinculada receita não tributada exportação' },
  { code: '56', desc: 'Com direito a crédito - vinculada receita tributada e não tributada exportação' },
  { code: '60', desc: 'Crédito presumido - operação de aquisição vinculada receita tributada MI' },
  { code: '61', desc: 'Crédito presumido - vinculada receita não tributada MI' },
  { code: '62', desc: 'Crédito presumido - vinculada receita exportação' },
  { code: '63', desc: 'Crédito presumido - vinculada receita tributada e não tributada MI' },
  { code: '70', desc: 'Sem direito a crédito' },
  { code: '71', desc: 'Sem direito a crédito - vinculada a receita isenta' },
  { code: '72', desc: 'Sem direito a crédito - operação com suspensão' },
  { code: '73', desc: 'Sem direito a crédito - operação com alíquota zero' },
  { code: '74', desc: 'Sem direito a crédito - operação sem incidência' },
  { code: '75', desc: 'Sem direito a crédito - operação por ST' },
  { code: '98', desc: 'Outras operações de entrada' },
  { code: '99', desc: 'Outras operações' },
]

export const CST_PIS_COFINS_PRESUMIDO = [
  { code: '70', desc: 'Sem direito a crédito' },
  { code: '71', desc: 'Sem direito a crédito - vinculada a receita isenta' },
  { code: '72', desc: 'Sem direito a crédito - operação com suspensão' },
  { code: '73', desc: 'Sem direito a crédito - operação com alíquota zero' },
  { code: '74', desc: 'Sem direito a crédito - operação sem incidência' },
  { code: '75', desc: 'Sem direito a crédito - operação por ST' },
  { code: '98', desc: 'Outras operações de entrada' },
  { code: '99', desc: 'Outras operações' },
]

export const CST_PIS_COFINS_SIMPLES = [
  { code: '98', desc: 'Outras operações de entrada' },
  { code: '99', desc: 'Outras operações' },
]

export function getCstPisCofinsOptions(regime) {
  if (regime === 'SIMPLES' || regime === 'MEI') return CST_PIS_COFINS_SIMPLES
  if (regime === 'PRESUMIDO') return CST_PIS_COFINS_PRESUMIDO
  return CST_PIS_COFINS_LUCRO_REAL
}
