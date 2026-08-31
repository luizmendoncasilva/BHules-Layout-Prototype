import { mockRoute } from './registry'

// Formato real lido por src/components/diagnosis/CompanyDiagnosis.jsx:
// diag.{status,total_saving_monthly,invoices_analyzed,items_analyzed,
// resumo_narrativo,computed_at,period_start,period_end,alertas,oportunidades,
// perfil_compras:{regime_tributario,atividade_principal,total_invoices,
// total_items,top_suppliers,top_ncms,cfop_distribution,credit_summary}}.
// severity/category usam os enums CRITICO|ALERTA|INFORMATIVO e
// CREDITO|RECLASSIFICACAO|RESSARCIMENTO|BENEFICIO (não "alta/media/baixa").

function buildDiagnosis() {
  const alertas = [
    {
      severity: 'CRITICO',
      title: 'Crédito de ICMS não aproveitado em compras interestaduais',
      description: 'Identificamos 18 notas de entrada com ICMS destacado que não foi apropriado como crédito nos últimos 6 meses.',
      impact_monthly_brl: 12800,
      recommended_action: 'Retificar EFD ICMS/IPI dos períodos afetados e lançar o crédito não aproveitado.',
      base_legal: 'Art. 19-23, Lei Kandir (LC 87/1996)',
      affected_items: 46,
      affected_invoices: 18,
    },
    {
      severity: 'CRITICO',
      title: 'PIS/COFINS pagos a maior no regime cumulativo',
      description: 'Despesas com frete e embalagem não estão sendo excluídas corretamente da base de cálculo.',
      impact_monthly_brl: 9400,
      recommended_action: 'Revisar apuração mensal de PIS/COFINS excluindo despesas acessórias elegíveis.',
      affected_items: 31,
      affected_invoices: 12,
    },
    {
      severity: 'ALERTA',
      title: 'NCM divergente em itens de revenda',
      description: '32 itens cadastrados com NCM genérico, gerando tributação por alíquota cheia em vez da alíquota reduzida aplicável.',
      impact_monthly_brl: 4200,
      affected_items: 32,
      affected_invoices: 21,
    },
    {
      severity: 'ALERTA',
      title: 'Substituição tributária recolhida em duplicidade',
      description: 'Operações com produtos já sujeitos a ST na origem estão sendo tributadas novamente na saída.',
      impact_monthly_brl: 3100,
      affected_items: 9,
      affected_invoices: 9,
    },
    {
      severity: 'INFORMATIVO',
      title: 'Divergência cadastral de CFOP em transferências entre filiais',
      description: 'CFOP de transferência (5.152) sendo usado em vez de 5.949 em 6 notas do período.',
      impact_monthly_brl: 850,
      affected_items: 6,
      affected_invoices: 6,
    },
  ]

  const oportunidades = [
    {
      category: 'CREDITO',
      title: 'Revisão de ICMS em compras interestaduais dos últimos 60 meses',
      impact_monthly_brl: 12800,
      description: 'Escopo de recuperação retroativa via retificação de EFD ICMS/IPI.',
      recommended_action: 'Abrir processo de recuperação de créditos (ver módulo Recuperação de Créditos).',
      affected_items: 46,
    },
    {
      category: 'RECLASSIFICACAO',
      title: 'Reenquadramento de anexo no Simples Nacional',
      impact_monthly_brl: 6700,
      description: 'Atividade preponderante sugere migração do Anexo III para o Anexo I, reduzindo a alíquota efetiva.',
    },
    {
      category: 'BENEFICIO',
      title: 'Aproveitamento de redução de base de cálculo estadual',
      impact_monthly_brl: 5200,
      description: 'Convênio ICMS aplicável ao CNAE da empresa não está sendo utilizado no cálculo do imposto.',
      top_ncms: ['3304.10.00', '2106.90.90'],
    },
    {
      category: 'RESSARCIMENTO',
      title: 'Padronização de CST em operações de exportação',
      impact_monthly_brl: 1900,
      description: 'CST incorreto pode gerar glosas em futuras fiscalizações; ressarcimento cabível sobre o período já apurado.',
      affected_items: 4,
    },
  ]

  return {
    status: 'READY',
    total_saving_monthly: alertas.reduce((s, a) => s + a.impact_monthly_brl, 0),
    invoices_analyzed: 214,
    items_analyzed: 892,
    period_start: '2026-02-01',
    period_end: '2026-07-31',
    computed_at: '2026-07-30T14:22:00Z',
    resumo_narrativo:
      'Com base na análise dos últimos 6 meses, a empresa apresenta faturamento mensal médio de R$ 450 mil sob o regime de Lucro Presumido. ' +
      'Os principais pontos de atenção envolvem créditos de ICMS não aproveitados em compras interestaduais e possível recolhimento em duplicidade ' +
      'de PIS/COFINS sobre despesas de frete. Recomenda-se priorizar a revisão retroativa de crédito de ICMS, com impacto estimado de R$ 12,8 mil/mês, ' +
      'e a reclassificação de NCM em itens de revenda para reduzir a carga tributária efetiva.',
    alertas,
    oportunidades,
    perfil_compras: {
      regime_tributario: 'LUCRO_PRESUMIDO',
      atividade_principal: 'Comércio varejista de cosméticos e produtos de perfumaria',
      total_invoices: 214,
      total_items: 892,
      top_suppliers: [
        { name: 'Perfumaria Cristal Distribuicao S.A.', value: 186400 },
        { name: 'Distribuidora Aurora Cosmeticos Ltda', value: 142300 },
        { name: 'Embalagens Pinheiro Industria Ltda', value: 78900 },
        { name: 'Quimica Industrial Sao Bento S.A.', value: 51200 },
        { name: 'Papelaria e Suprimentos Central Ltda', value: 33750 },
      ],
      top_ncms: [
        { ncm: '3304.10.00', items: 240 },
        { ncm: '2106.90.90', items: 198 },
        { ncm: '6109.10.00', items: 165 },
        { ncm: '8471.30.12', items: 140 },
        { ncm: '3004.90.99', items: 112 },
      ],
      cfop_distribution: [
        { cfop: '1102', count: 320 },
        { cfop: '2202', count: 145 },
        { cfop: '1949', count: 88 },
        { cfop: '5102', count: 62 },
      ],
      credit_summary: { icms: 12800, pis: 3100, cofins: 6300, ipi: 0, total: 22200 },
    },
  }
}

mockRoute(/^\/diagnosis\/(\d+)$/, 'GET', () => buildDiagnosis())

mockRoute(/^\/diagnosis\/(\d+)\/generate$/, 'POST', () => ({ ok: true }))

mockRoute(/^\/diagnosis\/(\d+)\/narrative$/, 'POST', () => ({
  narrative:
    'Com base na análise dos últimos 6 meses, a empresa apresenta faturamento mensal médio de R$ 450 mil sob o regime de Lucro Presumido. ' +
    'Os principais pontos de atenção envolvem créditos de ICMS não aproveitados em compras interestaduais e possível recolhimento em duplicidade ' +
    'de PIS/COFINS sobre despesas de frete. Recomenda-se priorizar a revisão retroativa de crédito de ICMS, com impacto estimado de R$ 12,8 mil/mês, ' +
    'e a reclassificação de NCM em itens de revenda para reduzir a carga tributária efetiva.',
}))
