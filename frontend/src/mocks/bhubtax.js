import { mockRoute } from './registry'
import { MOCK_COMPANIES } from './companies'

const TIPO_ORDER = ['NFE_ENTRADA', 'NFE_SAIDA', 'NFS_TOMADO', 'NFS_PRESTADO', 'NFCE', 'CTE_ENTRADA', 'CTE_SAIDA']

function porTipo(tipo, i) {
  const ehEntrada = ['NFE_ENTRADA', 'NFS_TOMADO', 'CTE_ENTRADA'].includes(tipo)
  const totalNotas = 80 + i * 35
  const valorTotal = 180000 + i * 95000
  return {
    total_notas: totalNotas,
    valor_total: valorTotal,
    canceladas: { qtd: 2 + (i % 4), valor: 3200 + i * 400 },
    devolucoes: { qtd: 1 + (i % 3), valor: 1800 + i * 300 },
    top_parceiros: MOCK_COMPANIES.slice(0, 5).map((c, j) => ({
      nome: ehEntrada ? `Fornecedor ${c.nome_fantasia}` : `Cliente ${c.nome_fantasia}`,
      valor: 40000 - j * 6000,
    })),
    top_cfop: ['5102', '6108', '5949', '1102', '2202'].map((cfop, j) => ({
      cfop,
      qtd: 120 - j * 18,
    })),
  }
}

function buildBhubTaxDados() {
  const porTipoMap = {}
  TIPO_ORDER.forEach((t, i) => {
    porTipoMap[t] = porTipo(t, i)
  })
  const totalNotas = Object.values(porTipoMap).reduce((s, v) => s + v.total_notas, 0)
  const totalItens = totalNotas * 4
  const totalFaturamento = porTipoMap.NFE_SAIDA.valor_total + porTipoMap.NFS_PRESTADO.valor_total + porTipoMap.NFCE.valor_total
  const totalEntradas = porTipoMap.NFE_ENTRADA.valor_total + porTipoMap.NFS_TOMADO.valor_total
  const valorTotal = Object.values(porTipoMap).reduce((s, v) => s + v.valor_total, 0)
  return {
    visao_geral: {
      total_notas: totalNotas,
      total_itens: totalItens,
      valor_total: valorTotal,
      total_faturamento: totalFaturamento,
      total_entradas: totalEntradas,
    },
    por_tipo: porTipoMap,
  }
}

mockRoute('/metrics/bhub-tax', 'GET', () => ({ dados_notas: buildBhubTaxDados() }))

const ANOMALY_LABELS = ['Quebra de sequência', 'ISS fora do município', 'CFOP divergente', 'NCM ausente']

function buildAnomalias() {
  const porEmpresa = MOCK_COMPANIES.slice(0, 6).map((c, i) => {
    const anomalias = ANOMALY_LABELS.slice(0, 1 + (i % 3)).map((label, j) => ({ label, qtd: 2 + j + i }))
    const total = anomalias.reduce((s, a) => s + a.qtd, 0)
    const severidades = ['alta', 'media', 'baixa']
    return {
      company_id: c.id,
      razao_social: c.razao_social,
      anomalias,
      total,
      severidade_max: severidades[i % severidades.length],
    }
  })
  return {
    kpis: {
      empresas_com_alerta: porEmpresa.length,
      anomalias_detectadas: porEmpresa.reduce((s, e) => s + e.total, 0),
      severidade_alta: porEmpresa.filter((e) => e.severidade_max === 'alta').length,
    },
    por_empresa: porEmpresa,
    regras: [
      { key: 'quebra_sequencia', label: 'Quebra de sequência', disponivel: true },
      { key: 'iss_fora_municipio', label: 'ISS fora do município', disponivel: true },
      {
        key: 'divergencia_cambial',
        label: 'Divergência cambial em importação',
        disponivel: false,
        motivo_indisponivel: 'Depende de integração com dados de câmbio do Banco Central, ainda não conectada.',
      },
    ],
  }
}

// BHubTaxDashboard.jsx (sessão "Visão Operacional") espera o formato
// {kpis, por_empresa, regras} construído por buildAnomalias() — não um
// array plano. (Bug anterior: a rota devolvia um array solto e a UI
// quebrava ao ler `anomalias.kpis.empresas_com_alerta` de um array.)
mockRoute('/anomalies/empresas', 'GET', () => buildAnomalias())

// GET /metrics/bhules — usado tanto pela sub-aba "Indicadores" quanto
// "Legislação" (BHubTaxDashboard.jsx). Também alimenta o objeto que a UI
// chama de `anomalias` na sessão Operacional — mas essa vem de
// getAnomaliasEmpresas (acima), com forma dedicada (kpis/por_empresa/regras).
mockRoute('/metrics/bhules', 'GET', () => ({
  notas_faltantes: {
    total_faltantes: 14,
    series_com_quebra: 3,
    por_serie: [
      { company_id: 1, serie: '1', intervalo: [1000, 1050], qtd_faltantes: 6, faltantes: [1012, 1013, 1014, 1030, 1031, 1032] },
      { company_id: 2, serie: '1', intervalo: [500, 540], qtd_faltantes: 5, faltantes: [510, 511, 512, 525, 526] },
      { company_id: 4, serie: '2', intervalo: [200, 230], qtd_faltantes: 3, faltantes: [210, 211, 212] },
    ],
  },
  iss_municipio: {
    fora_municipio: 22,
    dentro_municipio: 68,
    indefinido: 5,
    total: 95,
  },
  funil_sla: {
    sla_violado: 9,
    sla_ok: 41,
    total: 50,
    por_status: {
      PENDENTE: 12,
      EM_ANALISE: 8,
      CORRIGIR: 6,
      APROVAR_OVERRIDE: 4,
      BLOQUEAR_CONFIRMADO: 3,
      DEVOLVER_FORNECEDOR: 2,
      CANCELADO: 15,
    },
  },
  cfop: {
    validacao_humano_motor: { acertos: 312, erros: 18 },
    top_ncms: [
      { ncm: '3304.10.00', qtd: 240 },
      { ncm: '2106.90.90', qtd: 198 },
      { ncm: '6109.10.00', qtd: 165 },
      { ncm: '8471.30.12', qtd: 140 },
      { ncm: '3004.90.99', qtd: 112 },
    ],
  },
}))

// NOTA — coordenação com outro agente (resolvida): src/mocks/escrituracao.js
// não existia quando este arquivo foi criado. Ele apareceu concorrentemente e
// chegou a registrar GET /escrituracao/metrics/legislation-effectiveness,
// GET /escrituracao/metrics/ab-reranking e GET /metrics/bhules também — essa
// última com um formato incompatível com o que src/components/bhubtax/
// BHubTaxDashboard.jsx realmente consome (notas_faltantes/iss_municipio/
// funil_sla/cfop, ver acima). O outro agente já removeu essas três rotas do
// lado dele e deixou um comentário em escrituracao.js deferindo para este
// arquivo — não há mais duplicação nem shadowing entre os dois módulos.
