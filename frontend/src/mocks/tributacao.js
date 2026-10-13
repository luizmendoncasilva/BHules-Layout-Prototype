import { mockRoute, paramsOf } from './registry'
import { MOCK_COMPANIES } from './companies'

// Fixture da aba "Tributação por Código de Serviço" (TributacaoServicosTab):
// apuração por subitem LC 116 + Fator R, tracking de represamento por origem
// (GDocs / Jettax / Unecont / outros integradores) com drill-down por nota, e
// a conferência concluída por CNPJ × competência (FIS-1090).
//
// Os serviços chamam via fetchWithAuth (services/tributacaoService.js); o
// client remove o prefixo /api/v1 antes de chegar aqui. POSTs leem o corpo do
// 3º argumento do handler quando o registry/client o repassar; sem corpo,
// caem em valores padrão plausíveis.

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────
function bodyOf(raw) {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return {} }
  }
  return raw
}

function onlyDigits(s) {
  return String(s || '').replace(/\D/g, '')
}

// Aceita '202609', '2026-09' ou '09/2026' e devolve sempre 'AAAAMM'.
function normComp(comp) {
  const s = String(comp || '').trim()
  if (/^\d{2}\/\d{4}$/.test(s)) return s.slice(3) + s.slice(0, 2)
  const d = s.replace(/\D/g, '')
  return d.length >= 6 ? d.slice(0, 6) : '202609'
}

function compAnterior(comp) {
  const y = Number(comp.slice(0, 4))
  const m = Number(comp.slice(4, 6))
  return m === 1 ? `${y - 1}12` : `${y}${String(m - 1).padStart(2, '0')}`
}

function ultimoDia(comp) {
  const y = Number(comp.slice(0, 4))
  const m = Number(comp.slice(4, 6))
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

function periodoDe(comp) {
  const y = comp.slice(0, 4)
  const m = comp.slice(4, 6)
  return { inicio: `${y}-${m}-01`, fim: `${y}-${m}-${String(ultimoDia(comp)).padStart(2, '0')}` }
}

function companyOf(id) {
  return MOCK_COMPANIES.find((c) => c.id === Number(id)) || MOCK_COMPANIES[0]
}

function money(n) {
  return Number(Number(n).toFixed(2))
}

// ─────────────────────────────────────────────────────────────────────────
// Tributação por código de serviço
// ─────────────────────────────────────────────────────────────────────────

// Catálogo de subitens LC 116 usados pelas empresas prestadoras do fixture.
// `sujeito_fator_r` segue o enquadramento do LC 123 (Anexo III ou V conforme
// a folha); os demais são Anexo III/IV fixo.
const CATALOGO = [
  { subitem: '01.07', descricao: 'Suporte técnico em informática, inclusive instalação e manutenção de programas', sujeito_fator_r: true, anexo: null, notas: 18, valor: 84250.0, canceladas: 3200.0 },
  { subitem: '01.06', descricao: 'Assessoria e consultoria em informática', sujeito_fator_r: true, anexo: null, notas: 7, valor: 41800.0, canceladas: 0 },
  { subitem: '01.03', descricao: 'Processamento, armazenamento ou hospedagem de dados', sujeito_fator_r: true, anexo: null, notas: 11, valor: 27390.5, canceladas: 0, resolucao_mista: true },
  { subitem: '17.01', descricao: 'Assessoria ou consultoria de qualquer natureza', sujeito_fator_r: true, anexo: null, notas: 4, valor: 22000.0, canceladas: 5500.0 },
  { subitem: '17.06', descricao: 'Propaganda e publicidade, inclusive planejamento de campanhas', sujeito_fator_r: false, anexo: 'III', notas: 6, valor: 15640.0, canceladas: 0, subitem_inferido: true },
  { subitem: '10.05', descricao: 'Agenciamento, corretagem ou intermediação de bens móveis ou imóveis', sujeito_fator_r: false, anexo: 'III', notas: 3, valor: 9870.0, canceladas: 0 },
  { subitem: '07.02', descricao: 'Execução, por administração ou empreitada, de obras de construção civil', sujeito_fator_r: false, anexo: 'IV', notas: 2, valor: 48900.0, canceladas: 0 },
  // Sem parametrização — aparece como pendência no EmpresaResumoCard.
  { subitem: '17.02', descricao: 'Datilografia, digitação, estenografia e expediente', sujeito_fator_r: false, anexo: null, notas: 2, valor: 1850.0, canceladas: 0, semParam: true },
]

// Linhas com ISS retido pelo tomador (AD-052: uma linha por código × retenção).
const RETIDOS = {
  '01.07': { notas: 5, valor: 23100.0 },
  '17.01': { notas: 1, valor: 6400.0 },
}

const ID_ATIVIDADE = {
  III: { livre: 14, retido: 15 },
  IV: { livre: 17, retido: 18 },
  V: { livre: 20, retido: 21 },
}

// Fator R por empresa (folha 12m / receita 12m). Abaixo de 28% → Anexo V.
const FATOR_R = { 1: 29.84, 3: 31.42, 5: 33.1, 6: 27.15, 7: 30.05, 8: 22.37 }

// Estado em memória: parametrização (anexo/Fator R/vigência) e histórico.
const PARAMS_BY_COMPANY = {}
const HISTORICO_BY_COMPANY = {}

function paramsEmpresa(companyId) {
  if (!PARAMS_BY_COMPANY[companyId]) {
    const p = {}
    for (const s of CATALOGO) {
      if (s.semParam) continue
      p[s.subitem] = {
        anexo: s.anexo,
        sujeito_fator_r: s.sujeito_fator_r,
        vigencia_inicio: s.subitem === '17.06' ? '202607' : '202601',
      }
    }
    PARAMS_BY_COMPANY[companyId] = p
  }
  return PARAMS_BY_COMPANY[companyId]
}

function historicoEmpresa(companyId) {
  if (!HISTORICO_BY_COMPANY[companyId]) {
    HISTORICO_BY_COMPANY[companyId] = [
      {
        id: `trib-${companyId}-1`,
        quando: '2026-07-14T15:22:00Z',
        quem: 'juliana.pereira@bhub.ai',
        subitem_lc116: '17.06',
        campo: 'anexo',
        valor_anterior: 'Fator R (III/V)',
        valor_novo: 'Anexo III fixo',
        vigencia_inicio: '202607',
        motivo: 'Publicidade é Anexo III fixo (LC 123, art. 18, §5º-B) — não depende da folha',
      },
      {
        id: `trib-${companyId}-2`,
        quando: '2026-02-03T11:05:00Z',
        quem: 'carlos.souza@bhub.ai',
        subitem_lc116: '01.07',
        campo: 'sujeito_fator_r',
        valor_anterior: 'Não',
        valor_novo: 'Sim',
        vigencia_inicio: '202601',
        motivo: 'Suporte técnico de informática está no rol do §5º-I — sujeito ao Fator R',
      },
      {
        id: `trib-${companyId}-3`,
        quando: '2026-01-20T09:41:00Z',
        quem: 'ana.silva@bhub.ai',
        subitem_lc116: '07.02',
        campo: 'anexo',
        valor_anterior: null,
        valor_novo: 'Anexo IV',
        vigencia_inicio: '202601',
        motivo: 'Construção civil — Anexo IV (CPP recolhida em GPS à parte)',
      },
    ]
  }
  return HISTORICO_BY_COMPANY[companyId]
}

function atividadeTexto(anexo, retido) {
  return retido
    ? `Serviços — Anexo ${anexo}, com retenção/substituição de ISS`
    : `Serviços — Anexo ${anexo}, sem retenção ISS, ISS ao próprio Município`
}

function buildTributacao(companyId, competencia) {
  const company = companyOf(companyId)
  const params = paramsEmpresa(company.id)
  const pct = FATOR_R[company.id] ?? 28.6
  const anexoFatorR = pct >= 28 ? 'III' : 'V'
  // Variação leve por empresa/competência para as telas não ficarem idênticas.
  const fator = 0.6 + ((company.id * 7 + Number(competencia.slice(4, 6))) % 9) / 10

  const servicos = []
  for (const s of CATALOGO) {
    const p = params[s.subitem]
    const linhas = [{ retido: false, notas: s.notas, valor: s.valor, canceladas: s.canceladas }]
    if (RETIDOS[s.subitem]) linhas.push({ retido: true, notas: RETIDOS[s.subitem].notas, valor: RETIDOS[s.subitem].valor, canceladas: 0 })
    for (const l of linhas) {
      const valorBruto = money(l.valor * fator)
      const canc = money(l.canceladas * fator)
      let anexo = null
      let anexoDetalhe = null
      if (p) {
        if (p.sujeito_fator_r) {
          anexo = anexoFatorR
          anexoDetalhe = `Fator R ${pct.toFixed(2).replace('.', ',')}% ${pct >= 28 ? '≥' : '<'} 28% → Anexo ${anexoFatorR}`
        } else {
          anexo = p.anexo
          anexoDetalhe = 'fixo pela classificação'
        }
      }
      servicos.push({
        subitem_lc116: s.subitem,
        descricao: s.descricao,
        subitem_inferido: Boolean(s.subitem_inferido),
        iss_retido: l.retido,
        notas: Math.max(1, Math.round(l.notas * fator)),
        valor_bruto: valorBruto,
        canceladas: canc,
        base_tributavel: money(valorBruto - canc),
        anexo,
        anexo_detalhe: anexoDetalhe,
        resolucao_mista: Boolean(s.resolucao_mista),
        sujeito_fator_r: p ? Boolean(p.sujeito_fator_r) : false,
        id_atividade: anexo ? ID_ATIVIDADE[anexo][l.retido ? 'retido' : 'livre'] : null,
        atividade_pgdasd: anexo ? atividadeTexto(anexo, l.retido) : null,
        vigencia_inicio: p ? p.vigencia_inicio : null,
      })
    }
  }

  const notasCanceladas = servicos.filter((s) => s.canceladas > 0).length
  const kpis = {
    total_notas: servicos.reduce((a, s) => a + s.notas, 0),
    valor_bruto: money(servicos.reduce((a, s) => a + s.valor_bruto, 0)),
    valor_canceladas: money(servicos.reduce((a, s) => a + s.canceladas, 0)),
    notas_canceladas: notasCanceladas,
    base_tributavel: money(servicos.reduce((a, s) => a + s.base_tributavel, 0)),
  }

  const codigos = new Set(servicos.map((s) => s.subitem_lc116))
  const semParam = new Set(servicos.filter((s) => !s.anexo).map((s) => s.subitem_lc116))

  return {
    company_id: company.id,
    competencia,
    empresa: {
      id: company.id,
      razao_social: company.razao_social,
      cnpj: company.cnpj,
      regime_tributario: company.regime_tributario === 'SIMPLES_NACIONAL' ? 'SIMPLES' : company.regime_tributario,
      codigo_dominio: String(1000 + company.id * 37),
      total_codigos: codigos.size,
      codigos_sem_parametrizacao: semParam.size,
    },
    fator_r: {
      percentual: pct,
      detalhe: `Folha 12m ÷ RBT12 em ${competencia.slice(4, 6)}/${competencia.slice(0, 4)} → Anexo ${anexoFatorR} para os códigos sujeitos`,
    },
    kpis,
    servicos,
    historico: [...historicoEmpresa(company.id)].sort((a, b) => new Date(b.quando) - new Date(a.quando)),
  }
}

mockRoute(/^\/companies\/(\d+)\/tributacao-servicos$/, 'GET', (path, match) => {
  const competencia = normComp(paramsOf(path).get('competencia'))
  return buildTributacao(Number(match[1]), competencia)
})

mockRoute(/^\/companies\/(\d+)\/tributacao-servicos$/, 'POST', (path, match, rawBody) => {
  const companyId = companyOf(match[1]).id
  const body = bodyOf(rawBody)
  const subitem = body.subitem_lc116 || '17.02'
  const params = paramsEmpresa(companyId)
  const anterior = params[subitem]
  const novo = {
    anexo: body.sujeito_fator_r ? null : (body.anexo || 'III'),
    sujeito_fator_r: Boolean(body.sujeito_fator_r),
    vigencia_inicio: normComp(body.competencia_inicio || '202609'),
  }
  params[subitem] = novo
  const rotulo = (p) => (p ? (p.sujeito_fator_r ? 'Fator R (III/V)' : `Anexo ${p.anexo} fixo`) : null)
  const evento = {
    id: `trib-${companyId}-${Date.now()}`,
    quando: new Date().toISOString(),
    quem: 'analista-prototipo@bhub.ai',
    subitem_lc116: subitem,
    campo: 'anexo',
    valor_anterior: rotulo(anterior),
    valor_novo: rotulo(novo),
    vigencia_inicio: novo.vigencia_inicio,
    motivo: body.motivo || 'Ajuste de parametrização',
  }
  historicoEmpresa(companyId).unshift(evento)
  return { ok: true, subitem_lc116: subitem, ...novo, historico: evento }
})

// ─────────────────────────────────────────────────────────────────────────
// Tracking de origens (represamento) + drill-down por nota
// ─────────────────────────────────────────────────────────────────────────

const TOMADORES = [
  'Clinica Odontologica Sorriso Pleno Ltda', 'Agencia Viagens Horizonte Azul Ltda',
  'Escola de Idiomas Conecta Ltda', 'Padaria e Confeitaria Trigo Dourado Ltda',
  'Imobiliaria Morada Nobre Ltda', 'Academia Corpo em Movimento Ltda',
  'Laboratorio Analises Vida Ltda', 'Restaurante Sabor da Serra Ltda',
]
const PRESTADORES = [
  'Contabilidade Exata Servicos Ltda', 'Limpeza Brilho Total Ltda', 'Seguranca Patrimonial Vigia Ltda',
  'Advocacia Ramos e Teixeira', 'Manutencao Predial Prumo Ltda', 'Marketing Digital Alcance Ltda',
]

// Notas NFS-e do fixture de invoices (ids com cod_mod NFSE) — usadas para que
// o clique abra uma nota que existe de fato no DetailView.
const NFSE_INVOICE_IDS = [9, 10, 11, 12, 39, 40, 41, 42]

function chaveNfse(companyId, comp, seq) {
  // Chave de acesso da NFS-e nacional: 50 dígitos (mock, sem DV válido).
  const base = `3550308${comp}${onlyDigits(companyOf(companyId).cnpj).padStart(14, '0')}${String(seq).padStart(13, '0')}`
  return base.padEnd(50, '7').slice(0, 50)
}

function chaveNfe(companyId, comp, seq) {
  const base = `35${comp.slice(2)}${onlyDigits(companyOf(companyId).cnpj).padStart(14, '0')}55001${String(seq).padStart(9, '0')}1`
  return base.padEnd(44, '3').slice(0, 44)
}

function dataNa(comp, dia) {
  const d = Math.min(dia, ultimoDia(comp))
  return `${comp.slice(0, 4)}-${comp.slice(4, 6)}-${String(d).padStart(2, '0')}`
}

// Definição dos 4 canais. `qtd` = quantas notas em cada balde.
const CANAIS = [
  {
    id: 'gdocs_triagem', canal: 'gdocs', nome: 'GDocs (Triagem)',
    descricao: 'Pasta de triagem compartilhada com o cliente',
    integrado: false, provider: 'GDOCS', tipo: 'NFSE', direcao: 'ENTRADA',
    qtd: { so_origem: 0, so_bhules: 4, em_ambos: 0, divergentes: 0, outra_origem: 0 },
  },
  {
    id: 'jettax_integrador', canal: 'jettax', nome: 'Jettax',
    descricao: 'NFS-e prestadas via integrador Jettax',
    integrado: true, provider: 'JETTAX', tipo: 'NFSE', direcao: 'SAIDA',
    qtd: { so_origem: 3, so_bhules: 0, em_ambos: 11, divergentes: 1, outra_origem: 0 },
  },
  {
    id: 'unecont_tomados', canal: 'unecont', nome: 'Unecont',
    descricao: 'NFS-e tomadas capturadas pela Unecont',
    integrado: true, provider: 'UNECONT', tipo: 'NFSE', direcao: 'ENTRADA',
    qtd: { so_origem: 0, so_bhules: 0, em_ambos: 9, divergentes: 0, outra_origem: 0 },
  },
  {
    id: 'outros_integrador', canal: 'outros', nome: 'Outros integradores',
    descricao: 'NF-e/NFS-e via IntegradorNF (SIEG, Arquivei)',
    integrado: true, provider: 'SIEG', tipo: 'NFE', direcao: 'ENTRADA',
    qtd: { so_origem: 0, so_bhules: 2, em_ambos: 5, divergentes: 0, outra_origem: 1 },
  },
]

function canalDef(canal) {
  return CANAIS.find((c) => c.canal === canal) || CANAIS[1]
}

function buildNotasCanal(companyId, def, comp) {
  const company = companyOf(companyId)
  const ehSaida = def.direcao === 'SAIDA'
  const contraparte = ehSaida ? TOMADORES : PRESTADORES
  let seq = companyId * 1000 + CANAIS.indexOf(def) * 100
  let invIdx = (companyId + CANAIS.indexOf(def)) % NFSE_INVOICE_IDS.length

  const nota = (balde, i, extra = {}) => {
    seq += 1
    const temInvoice = balde !== 'so_origem'
    const invoiceId = temInvoice ? NFSE_INVOICE_IDS[invIdx++ % NFSE_INVOICE_IDS.length] : null
    const chave = def.tipo === 'NFE' ? chaveNfe(companyId, comp, seq) : chaveNfse(companyId, comp, seq)
    const valor = money(450 + ((seq * 37) % 97) * 83.5)
    return {
      chave,
      numero: String(2000 + (seq % 1000)),
      tipo: def.tipo,
      direcao: def.direcao,
      provider: balde === 'so_bhules' ? null : def.provider,
      invoice_id: invoiceId,
      api_source: temInvoice ? (def.canal === 'gdocs' ? 'UPLOAD_MANUAL' : def.provider) : null,
      dt_doc: dataNa(comp, 2 + ((i * 3) % 26)),
      emitente: ehSaida ? company.razao_social : contraparte[(seq + i) % contraparte.length],
      valor,
      status_analise: temInvoice ? ['CONFORME', 'CONFORME', 'REQUER_REVISAO'][i % 3] : null,
      divergencia: null,
      ...extra,
    }
  }

  const so_origem = Array.from({ length: def.qtd.so_origem }, (_, i) => nota('so_origem', i))
  const so_bhules = Array.from({ length: def.qtd.so_bhules }, (_, i) => nota('so_bhules', i))
  const em_ambos = Array.from({ length: def.qtd.em_ambos }, (_, i) => {
    if (i < def.qtd.divergentes) {
      // A origem lista em `comp`, mas no BHules o dt_doc caiu no mês anterior.
      const ant = compAnterior(comp)
      return nota('em_ambos', i, { divergencia: 'COMPETENCIA', dt_doc: dataNa(ant, 30) })
    }
    if (i < def.qtd.divergentes + def.qtd.outra_origem) {
      return nota('em_ambos', i, { divergencia: 'BALDE', api_source: 'JETTAX' })
    }
    return nota('em_ambos', i)
  })

  const lista = (itens) => ({ total: itens.length, truncado: false, itens })
  return {
    so_origem: def.integrado ? lista(so_origem) : lista([]),
    so_bhules: lista(so_bhules),
    em_ambos: def.integrado ? lista(em_ambos) : lista([]),
  }
}

function cardDoCanal(companyId, def, comp) {
  const n = buildNotasCanal(companyId, def, comp)
  const soOrigem = n.so_origem.total
  const soBhules = n.so_bhules.total
  const emAmbos = n.em_ambos.total
  const divergentes = n.em_ambos.itens.filter((x) => x.divergencia === 'COMPETENCIA').length
  const outraOrigem = n.em_ambos.itens.filter((x) => x.divergencia === 'BALDE').length

  let status
  let detalhe
  if (!def.integrado) {
    status = 'NAO_INTEGRADO'
    detalhe = `Origem ainda não integrada ao tracking. ${soBhules} nota(s) entraram no BHules por upload manual.`
  } else if (soOrigem > 0) {
    status = 'REPRESADO'
    detalhe = `${soOrigem} nota(s) estão na ${def.nome} e ainda não chegaram ao BHules.`
  } else if (soBhules > 0 || divergentes > 0 || outraOrigem > 0) {
    status = 'DIVERGENTE'
    detalhe = soBhules > 0
      ? `${soBhules} nota(s) no BHules não aparecem na origem.`
      : 'Notas presentes nos dois lados com competência ou origem diferente.'
  } else {
    status = 'SINCRONIZADO'
    detalhe = `Todas as ${emAmbos} notas da origem estão no BHules.`
  }

  return {
    id: def.id,
    canal: def.canal,
    nome: def.nome,
    descricao: def.descricao,
    repo_original: def.integrado ? soOrigem + emAmbos : null,
    no_bhules: soBhules + emAmbos,
    represadas: def.integrado ? soOrigem : null,
    so_bhules: soBhules,
    em_ambos: emAmbos,
    divergentes,
    outra_origem: outraOrigem,
    sem_chave: 0,
    status,
    upstream_disponivel: def.integrado,
    detalhe,
  }
}

mockRoute(/^\/companies\/(\d+)\/tracking-origens$/, 'GET', (path, match) => {
  const company = companyOf(match[1])
  const comp = normComp(paramsOf(path).get('competencia'))
  const canais = CANAIS.map((def) => cardDoCanal(company.id, def, comp))
  const totalRepresadas = canais.reduce((a, c) => a + (c.represadas || 0), 0)
  const statusGeral = totalRepresadas > 0
    ? 'REPRESADO'
    : canais.some((c) => c.status === 'DIVERGENTE') ? 'DIVERGENTE' : 'SINCRONIZADO'
  return {
    company_id: company.id,
    cnpj: onlyDigits(company.cnpj),
    competencia: comp,
    periodo: periodoDe(comp),
    canais,
    resumo: {
      total_repo_original: canais.reduce((a, c) => a + (c.repo_original || 0), 0),
      total_no_bhules: canais.reduce((a, c) => a + (c.no_bhules || 0), 0),
      total_represadas: totalRepresadas,
      status_geral: statusGeral,
    },
  }
})

mockRoute(/^\/companies\/(\d+)\/tracking-origens\/([^/]+)\/notas$/, 'GET', (path, match) => {
  const company = companyOf(match[1])
  const def = canalDef(decodeURIComponent(match[2]))
  const comp = normComp(paramsOf(path).get('competencia'))
  return {
    company_id: company.id,
    cnpj: onlyDigits(company.cnpj),
    competencia: comp,
    canal: def.canal,
    periodo: periodoDe(comp),
    upstream_disponivel: def.integrado,
    ...buildNotasCanal(company.id, def, comp),
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Conferência concluída por CNPJ × competência (FIS-1090)
// ─────────────────────────────────────────────────────────────────────────
// Chave: `${cnpj sem máscara}|${AAAAMM}`. Estado em memória — concluir e
// reabrir refletem na tela até o reload.
const CONFERENCIAS = {}
let conferenciaSeq = 1

function seedConferencia(cnpj, comp) {
  const company = MOCK_COMPANIES.find((c) => onlyDigits(c.cnpj) === cnpj)
  const historico = []
  // Competências já fechadas (anteriores a 09/2026) nascem concluídas; para a
  // empresa 3 a 09/2026 tem um ciclo concluído e depois reaberto.
  if (comp < '202609') {
    historico.push({
      id: conferenciaSeq++,
      periodoApuracao: comp,
      concluidaEm: `${dataNa(comp === '202608' ? '202609' : comp, 9)}T17:42:00Z`,
      concluidaPor: 'juliana.pereira@bhub.ai',
      observacao: 'Faturamento conferido com o relatório da prefeitura',
      reabertaEm: null,
      reabertaPor: null,
      motivoReabertura: null,
    })
  } else if (company?.id === 3) {
    historico.push({
      id: conferenciaSeq++,
      periodoApuracao: comp,
      concluidaEm: '2026-10-07T14:10:00Z',
      concluidaPor: 'carlos.souza@bhub.ai',
      observacao: null,
      reabertaEm: '2026-10-09T10:03:00Z',
      reabertaPor: 'ana.silva@bhub.ai',
      motivoReabertura: '3 notas da Jettax chegaram depois da conferência',
    })
  }
  return historico
}

function estadoConferencia(cnpj, comp) {
  const key = `${cnpj}|${comp}`
  if (!CONFERENCIAS[key]) CONFERENCIAS[key] = seedConferencia(cnpj, comp)
  const historico = CONFERENCIAS[key]
  const atual = historico[historico.length - 1]
  const concluida = Boolean(atual && !atual.reabertaEm)
  return {
    cnpj,
    periodoApuracao: comp,
    concluida,
    concluidaEm: concluida ? atual.concluidaEm : null,
    concluidaPor: concluida ? atual.concluidaPor : null,
    observacao: concluida ? atual.observacao : null,
    historico: [...historico],
  }
}

const RE_CONFERENCIA = /^\/apuracoes\/([^/]+)\/([^/]+)\/conferencia$/
const RE_REABRIR = /^\/apuracoes\/([^/]+)\/([^/]+)\/conferencia\/reabrir$/

mockRoute(RE_CONFERENCIA, 'GET', (_path, match) =>
  estadoConferencia(onlyDigits(decodeURIComponent(match[1])), normComp(decodeURIComponent(match[2]))))

mockRoute(RE_CONFERENCIA, 'POST', (_path, match, rawBody) => {
  const cnpj = onlyDigits(decodeURIComponent(match[1]))
  const comp = normComp(decodeURIComponent(match[2]))
  const estado = estadoConferencia(cnpj, comp)
  if (estado.concluida) return estado // idempotente
  CONFERENCIAS[`${cnpj}|${comp}`].push({
    id: conferenciaSeq++,
    periodoApuracao: comp,
    concluidaEm: new Date().toISOString(),
    concluidaPor: 'analista-prototipo@bhub.ai',
    observacao: bodyOf(rawBody).observacao || null,
    reabertaEm: null,
    reabertaPor: null,
    motivoReabertura: null,
  })
  return estadoConferencia(cnpj, comp)
})

mockRoute(RE_REABRIR, 'POST', (_path, match, rawBody) => {
  const cnpj = onlyDigits(decodeURIComponent(match[1]))
  const comp = normComp(decodeURIComponent(match[2]))
  const estado = estadoConferencia(cnpj, comp)
  if (estado.concluida) {
    const historico = CONFERENCIAS[`${cnpj}|${comp}`]
    Object.assign(historico[historico.length - 1], {
      reabertaEm: new Date().toISOString(),
      reabertaPor: 'analista-prototipo@bhub.ai',
      motivoReabertura: bodyOf(rawBody).motivo || null,
    })
  }
  return estadoConferencia(cnpj, comp)
})
