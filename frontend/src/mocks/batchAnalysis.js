import { mockRoute, paginate, paramsOf } from './registry'
import { MOCK_COMPANIES } from './companies'

// Formato real: cada linha é um ITEM de nota (não a nota inteira), com um
// array `esc_divergencias` (severidade CRITICO|ALERTA|OPORTUNIDADE|INFORMATIVO)
// — é isso que BatchAnalysis.jsx agrupa por tipo de problema/severidade/NCM/
// CFOP/emitente. Sem esse array as telas ficam "Nenhum item encontrado"
// mesmo com paginação != 0.

const DIVERGENCIAS = [
  { campo: 'cfop_entrada', severidade: 'CRITICO', descricao: 'CFOP de entrada não corresponde à natureza da operação declarada', valor_emitente: '5102', valor_esperado: '1102', valor_sugerido: '1102' },
  { campo: 'ncm', severidade: 'ALERTA', descricao: 'NCM ausente ou incompatível com a descrição do produto', valor_emitente: '-', valor_esperado: '3304.10.00', valor_sugerido: '3304.10.00' },
  { campo: 'cst_icms', severidade: 'CRITICO', descricao: 'CST de ICMS divergente do esperado para o regime tributário', valor_emitente: '000', valor_esperado: '060', valor_sugerido: '060' },
  { campo: 'aliquota_icms', severidade: 'ALERTA', descricao: 'Alíquota de ICMS fora do praticado para a UF de destino', valor_emitente: '18%', valor_esperado: '12%', valor_sugerido: '12%' },
  { campo: 'credito_pis_cofins', severidade: 'OPORTUNIDADE', descricao: 'Item elegível para crédito de PIS/COFINS não aproveitado', valor_emitente: '0,00', valor_esperado: '145,20', valor_sugerido: '145,20' },
  { campo: 'finalidade', severidade: 'INFORMATIVO', descricao: 'Finalidade da operação divergente do cadastro do item', valor_emitente: 'Revenda', valor_esperado: 'Uso e consumo', valor_sugerido: 'Uso e consumo' },
]

const NCMS = ['3304.10.00', '2106.90.90', '6109.10.00', '8471.30.12', '3004.90.99']
const CFOPS_EMIT = ['5102', '6108', '5949', '5405', '6202']
const CFOPS_ENTRADA = ['1102', '2108', '1949', '1405', '2202']
const SERVICOS = ['0107', '0703', '1401', '0801']
const DESCRICOES = [
  'Perfume importado 100ml', 'Creme hidratante corporal 200g', 'Camiseta algodão premium',
  'Placa controladora industrial', 'Aromatizante concentrado 5L', 'Serviço de consultoria em TI',
  'Manutenção predial preventiva', 'Frete rodoviário intermunicipal',
]

function buildRows() {
  const list = []
  for (let i = 0; i < 42; i++) {
    const c = MOCK_COMPANIES[i % MOCK_COMPANIES.length]
    const isNfse = i % 4 === 3
    const divCount = 1 + (i % 2)
    const divs = Array.from({ length: divCount }, (_, k) => DIVERGENCIAS[(i + k) % DIVERGENCIAS.length])
    const day = String(1 + (i % 27)).padStart(2, '0')
    list.push({
      item_id: 9000 + i,
      invoice_id: 8000 + i,
      num_doc: String(300000 + i),
      emit_cnpj: c.cnpj,
      emit_razao_social: c.razao_social,
      vl_item: 480.5 + i * 133.4,
      data_emissao: `2026-07-${day}`,
      esc_divergencias: divs,
      esc_confianca: [0.92, 0.74, 0.55, 0.38][i % 4],
      // NF-e (materiais)
      ncm: !isNfse ? NCMS[i % NCMS.length] : undefined,
      descr_compl: DESCRICOES[i % DESCRICOES.length],
      cfop_emitente: !isNfse ? CFOPS_EMIT[i % CFOPS_EMIT.length] : undefined,
      esc_cfop_entrada: !isNfse ? CFOPS_ENTRADA[i % CFOPS_ENTRADA.length] : undefined,
      cst_icms: !isNfse ? ['000', '060', '040', '102'][i % 4] : undefined,
      // NFS-e (serviços)
      codigo_servico: isNfse ? SERVICOS[i % SERVICOS.length] : undefined,
      iss_retido: isNfse ? i % 2 === 0 : undefined,
      aliquota_iss: isNfse ? [2, 3, 5][i % 3] : undefined,
      regime_prestador: isNfse ? c.regime_tributario : undefined,
    })
  }
  return list
}

const ROWS = buildRows()

mockRoute('/invoices/batch-analysis', 'GET', (path) => {
  const params = paramsOf(path)
  const codMod = params.get('cod_mod')
  const filtered = codMod === 'NFSE'
    ? ROWS.filter((r) => r.codigo_servico !== undefined)
    : codMod
      ? ROWS.filter((r) => r.codigo_servico === undefined)
      : ROWS
  return paginate(filtered, params.get('page'), params.get('page_size'))
})

mockRoute('/invoices/batch-analysis/summary', 'GET', () => ({
  total: ROWS.length,
  por_severidade: { CRITICO: 18, ALERTA: 20, OPORTUNIDADE: 7, INFORMATIVO: 5 },
  por_problema: { cfop_entrada: 14, ncm: 9, cst_icms: 14, aliquota_icms: 8, credito_pis_cofins: 7, finalidade: 5 },
}))
