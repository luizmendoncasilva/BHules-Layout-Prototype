import { mockRoute } from './registry'

function buildReformDiagnosis() {
  return {
    status: 'READY',
    context_data: {
      faturamento_mensal_medio: 450000,
      regime: 'LUCRO_PRESUMIDO',
      folha_mensal: 85000,
    },
    tax_impact: {
      atual: {
        icms: 45000,
        pis: 7200,
        cofins: 33500,
        iss: 0,
        total: 85700,
      },
      projetado_2027: {
        ibs: 32000,
        cbs: 60300,
        icms: 12000,
        total: 104300,
      },
      variacao_percentual: 8.4,
      itens: [
        { tributo: 'IBS', valor_atual: 0, valor_projetado: 32000, tipo: 'estimativa' },
        { tributo: 'CBS', valor_atual: 0, valor_projetado: 60300, tipo: 'estimativa' },
        { tributo: 'ICMS', valor_atual: 45000, valor_projetado: 12000, tipo: 'concreto' },
        { tributo: 'PIS', valor_atual: 7200, valor_projetado: 0, tipo: 'concreto' },
        { tributo: 'COFINS', valor_atual: 33500, valor_projetado: 0, tipo: 'concreto' },
      ],
    },
  }
}

mockRoute(/^\/reform-diagnosis\/(\d+)$/, 'GET', () => buildReformDiagnosis())

mockRoute(/^\/reform-diagnosis\/(\d+)\/generate$/, 'POST', () => ({ ok: true }))

mockRoute(/^\/reform-diagnosis\/(\d+)\/narrative$/, 'POST', () => ({
  narrative:
    'A transição para o novo modelo de IBS/CBS previsto para 2027 deve elevar a carga tributária efetiva da empresa em aproximadamente 8,4%, ' +
    'passando de R$ 85,7 mil para R$ 104,3 mil mensais em tributos sobre o consumo. O principal fator é a substituição do PIS/COFINS cumulativo ' +
    'pela CBS não cumulativa, parcialmente compensada pela redução do ICMS remanescente durante o período de transição. ' +
    'Recomenda-se revisar a política de preços e o aproveitamento de créditos para mitigar o impacto.',
}))
