import { mockRoute, paramsOf } from './registry'
import { MOCK_COMPANIES } from './companies'

// Fixture da sub-aba "Comércio · Anexo I" (ComercioAnexoITab, FIS-1227/FIS-1253):
// conferência da natureza da receita (G1–G5) por item de NF-e/NFC-e de saída,
// resumo por CFOP × natureza, ID da atividade do PGDAS-D por item, ajustes por
// item e em lote (com histórico e revogação), condição de varejista (art. 17)
// e o toggle da empresa no piloto.
//
// Os serviços chamam via fetchWithAuth (services/naturezaItensService.js); o
// client remove o prefixo /api/v1 antes de chegar aqui. O estado (itens,
// ajustes, varejista, piloto) vive em memória por empresa × competência, então
// as ações da tela mudam o que as próximas leituras devolvem até o reload.
// Erros de validação (o 422 do backend) são lançados como Error: o
// fetchWithAuth rejeita e a tela mostra a mensagem.

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────
const AUTOR = 'Dev Local'
const REGRA_VERSAO = 'natureza-sn 1.4.2'
const CLASSIFICADOR_VERSAO = 'classificador-natureza 2026.09.1'

function bodyOf(raw) {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return {} }
  }
  return raw
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
  return new Date(Date.UTC(Number(comp.slice(0, 4)), Number(comp.slice(4, 6)), 0)).getUTCDate()
}

function companyOf(id) {
  return MOCK_COMPANIES.find((c) => c.id === Number(id)) || null
}

function dinheiro(n) {
  return Number(n || 0).toFixed(2)
}

function soma(lista) {
  return Math.round(lista.reduce((acc, it) => acc + it.valor, 0) * 100) / 100
}

// PRNG determinístico (mulberry32): a mesma empresa × competência gera sempre os mesmos itens.
function prng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function erro422(detalhe) {
  const err = new Error(`Erro (422): ${detalhe}`)
  err.status = 422
  return err
}

// ─────────────────────────────────────────────────────────────────────────
// Domínio: naturezas, IDs da atividade do PGDAS-D, sinais
// ─────────────────────────────────────────────────────────────────────────
const NATUREZAS = ['G1', 'G2', 'G3', 'G4', 'G5']

const ATIVIDADES = [
  { id: 1, rotulo: 'Revenda de mercadorias, exceto exterior — sem ST/monofásica', anexo: 'I' },
  { id: 2, rotulo: 'Revenda de mercadorias, exceto exterior — com ST/monofásica', anexo: 'I' },
  { id: 3, rotulo: 'Revenda de mercadorias para o exterior', anexo: 'I' },
  { id: 4, rotulo: 'Venda de industrializados pelo contribuinte, exceto exterior — sem ST', anexo: 'II' },
  { id: 5, rotulo: 'Venda de industrializados pelo contribuinte, exceto exterior — com ST', anexo: 'II' },
  { id: 6, rotulo: 'Venda de industrializados pelo contribuinte para o exterior', anexo: 'II' },
]
const IDS_ANEXO_II = [4, 5, 6]

// Matriz natureza × ID aceito (a tela não espelha a regra; usa o que vem aqui).
const IDS_POR_NATUREZA = { G1: [1, 4], G2: [2, 5], G3: [2, 5], G4: [2, 5], G5: [3, 6] }
const IDS_EXPORTACAO = [3, 6]
const IDS_DERIVADOS = { G1: 1, G2: 2, G3: 2, G4: 2, G5: 3 }
const ID_DERIVADO_EXPORTACAO = 3

const SINAIS = {
  NCM_INVALIDO: {
    severidade: 'PENDENCIA', origem: 'RN-07',
    acaoEsperada: 'Corrigir o NCM no cadastro do produto (não existe na TIPI vigente); até lá o item fica em G1.',
  },
  TABELA_AMBIGUA: {
    severidade: 'PENDENCIA', origem: 'RN-04',
    acaoEsperada: 'NCM aparece em mais de uma tabela (monofásica e alíquota zero): definir a natureza por ajuste.',
  },
  EMITENTE_DESCONHECIDO: {
    severidade: 'ALERTA', origem: 'CS-02',
    acaoEsperada: 'Mercadoria sem nota de entrada conhecida: conferir se o ICMS-ST foi retido na compra.',
  },
  IMPORTACAO_DIRETA: {
    severidade: 'ALERTA', origem: 'VD-07/VD-08',
    acaoEsperada: 'Importada pela própria empresa (origem 1): a empresa é o importador; conferir se o monofásico se aplica.',
  },
  BEBIDA_FRIA_SEM_VAREJISTA: {
    severidade: 'ALERTA', origem: 'RN-06/CS-07',
    acaoEsperada: 'Cadastrar a condição de varejista (art. 17) do ano para a bebida fria deixar de ficar tributada.',
  },
  NCM_SEM_DESCRICAO_COERENTE: {
    severidade: 'ALERTA', origem: 'RN-05',
    acaoEsperada: 'Descrição do item não combina com o NCM: conferir o cadastro do produto antes de aceitar a natureza.',
  },
  CST_MONOFASICO_SEM_TABELA: {
    severidade: 'ALERTA', origem: 'RN-22',
    acaoEsperada: 'CST PIS/COFINS 04 sem o NCM na tabela monofásica: conferir o CST na emissão ou o NCM.',
  },
  CST_MONOFASICO_CONTRARIADO_PELA_TABELA: {
    severidade: 'ALERTA', origem: 'RN-22',
    acaoEsperada: 'NCM monofásico emitido com CST 01: a natureza segue a tabela; corrigir o CST nas próximas notas.',
  },
  DOC_SEM_ITENS_NATUREZA_INDETERMINADA: {
    severidade: 'ALERTA', origem: 'CS-01',
    acaoEsperada: 'Documento sem itens escriturados: a natureza fica indeterminada; reprocessar o XML.',
  },
  EXCLUSAO_TABELA: {
    severidade: 'INFO', origem: 'RN-04',
    acaoEsperada: 'NCM com exceção ("exceto") na tabela; a exceção foi aplicada pela descrição.',
  },
  CONDICAO_NAO_VERIFICAVEL: {
    severidade: 'INFO', origem: 'RN-04',
    acaoEsperada: 'Condição da tabela (destinação/uso) não verificável pela nota; seguiu a regra padrão.',
  },
  TIPI_NAO_CARREGADA: {
    severidade: 'INFO', origem: 'RN-07',
    acaoEsperada: 'TIPI da competência ainda não carregada; validado contra a TIPI anterior.',
  },
}

function sinal(codigo) {
  return { codigo, ...SINAIS[codigo] }
}

// ─────────────────────────────────────────────────────────────────────────
// Catálogos por perfil de empresa (comércio varejista/atacadista)
// [codItem, descricao, ncm, cfop, cstIcms, cstPisCofins, natureza, grupo,
//  motivo, norma, sinais, valorMin, valorMax, opções]
// ─────────────────────────────────────────────────────────────────────────
const N_PERFUMARIA = 'Lei 10.147/2000, art. 1º, I, b; LC 123, art. 18, §4º-A, I'
const N_MEDICAMENTOS = 'Lei 10.147/2000, art. 1º, I, a; LC 123, art. 18, §4º-A, I'
const N_BEBIDAS = 'Lei 13.097/2015, art. 14; LC 123, art. 18, §4º-A, I'
const N_AUTOPECAS = 'Lei 10.485/2002, art. 3º; LC 123, art. 18, §4º-A, I'
const N_ST = 'LC 123, art. 13, §1º, XIII, a; RICMS/UF (ST)'
const N_ALIQ_ZERO = 'Lei 10.925/2004, art. 1º; LC 123, art. 18, §4º-A, I'
const N_EXPORT = 'LC 123, art. 18, §4º-A, IV'
const N_GERAL = 'LC 123, art. 18, §4º, I (revenda tributada)'

const G_PERF = 'Perfumaria e higiene pessoal'
const G_MED = 'Medicamentos'
const G_BEB = 'Bebidas frias'
const G_AUTO = 'Autopeças'
const G_HORTI = 'Hortifrutícolas (alíquota zero)'

const PERFIS = {
  // Baby e Bag — presentes, cosméticos e perfumaria (SP)
  presentes: [
    ['BB-1001', 'Perfume Colônia Infantil Lavanda 100ml', '33030020', '5405', '60', '04', 'G4', G_PERF, 'TAB_MONOFASICA+CST60', N_PERFUMARIA, [], 39.9, 129.9],
    ['BB-1002', 'Hidratante Corporal Bebê 200ml', '33049910', '5405', '60', '04', 'G4', G_PERF, 'TAB_MONOFASICA+CST60', N_PERFUMARIA, [], 24.9, 79.9],
    ['BB-1003', 'Shampoo Infantil Sem Lágrimas 400ml', '33051000', '5102', '00', '04', 'G2', G_PERF, 'TAB_MONOFASICA', N_PERFUMARIA, [], 19.9, 49.9],
    ['BB-1004', 'Lenço Umedecido c/ 96 un', '33079000', '5405', '60', '01', 'G4', G_PERF, 'TAB_MONOFASICA+CST60', N_PERFUMARIA, ['CST_MONOFASICO_CONTRARIADO_PELA_TABELA'], 9.9, 29.9],
    ['BB-2001', 'Bolsa Maternidade Matelassê Bege', '42022210', '5102', '00', '01', 'G1', null, 'SEM_TABELA', N_GERAL, [], 189.0, 459.0],
    ['BB-2002', 'Mochila Infantil Ursinho', '42029200', '5102', '00', '01', 'G1', null, 'SEM_TABELA', N_GERAL, [], 89.0, 219.0],
    ['BB-2003', 'Manta de Algodão Bordada', '63014000', '5102', '00', '01', 'G1', null, 'SEM_TABELA', N_GERAL, [], 69.0, 189.0],
    ['BB-2004', 'Kit Presente Maternidade (montado na loja)', '63079090', '5102', '00', '01', 'G1', null, 'SEM_TABELA', N_GERAL, ['NCM_SEM_DESCRICAO_COERENTE'], 249.0, 599.0, { kit: true }],
    ['BB-3001', 'Mamadeira Anticólica 260ml', '39241000', '5405', '60', '01', 'G3', null, 'ST_CST60', N_ST, [], 34.9, 89.9],
    ['BB-3002', 'Chupeta Silicone Ortodôntica', '40149090', '5405', '60', '01', 'G3', null, 'ST_CST60', N_ST, ['EXCLUSAO_TABELA'], 19.9, 44.9],
    ['BB-3003', 'Brinquedo Mordedor Refrigerado', '95030099', '6102', '00', '01', 'G1', null, 'SEM_TABELA', N_GERAL, [], 24.9, 59.9],
    ['BB-4001', 'Body Manga Longa Algodão Pima', '61112000', '6102', '00', '01', 'G1', null, 'SEM_TABELA', N_GERAL, [], 49.9, 119.9],
    ['BB-4002', 'Sabonete Líquido Glicerinado 250ml (importado)', '34013000', '5102', '00', '04', 'G2', G_PERF, 'TAB_MONOFASICA', N_PERFUMARIA, ['IMPORTACAO_DIRETA'], 29.9, 64.9, { orig: '1' }],
    ['BB-4003', 'Fralda Descartável Premium P c/ 40', '96190000', '5102', '00', '01', 'G1', null, 'SEM_TABELA', N_GERAL, ['CONDICAO_NAO_VERIFICAVEL'], 59.9, 99.9],
    ['BB-4004', 'Óleo Corporal Amêndoas 120ml', '33049990', '5102', '00', '01', 'G1', null, 'NCM_INVALIDO', N_GERAL, ['NCM_INVALIDO'], 32.9, 54.9, { ncm: '33049990' }],
    ['BB-5001', 'Remessa de brinde — Necessaire Bordada', '42021200', '5910', '00', '49', 'G1', null, 'SEM_TABELA', N_GERAL, [], 18.0, 45.0, { remessa: true }],
    ['BB-5002', 'Remessa em consignação — Kit Bolsas', '42022210', '5917', '00', '49', 'G1', null, 'SEM_TABELA', N_GERAL, [], 420.0, 980.0, { remessa: true }],
  ],
  // São Marcos — atacado de bebidas (MG)
  bebidas: [
    ['SM-0101', 'Cerveja Pilsen Lata 350ml cx 12', '22030000', '5405', '60', '04', 'G4', G_BEB, 'TAB_MONOFASICA+CST60', N_BEBIDAS, ['BEBIDA_FRIA_SEM_VAREJISTA'], 38.0, 62.0],
    ['SM-0102', 'Cerveja Puro Malte Long Neck 355ml cx 24', '22030000', '6404', '60', '04', 'G4', G_BEB, 'TAB_MONOFASICA+CST60', N_BEBIDAS, ['BEBIDA_FRIA_SEM_VAREJISTA'], 98.0, 156.0],
    ['SM-0201', 'Refrigerante Cola PET 2L fd 6', '22021000', '5405', '60', '04', 'G4', G_BEB, 'TAB_MONOFASICA+CST60', N_BEBIDAS, [], 42.0, 69.0],
    ['SM-0202', 'Água Mineral sem Gás 500ml fd 12', '22011000', '5405', '60', '04', 'G4', G_BEB, 'TAB_MONOFASICA+CST60', N_BEBIDAS, [], 14.0, 26.0],
    ['SM-0203', 'Energético Lata 250ml fd 6', '22029900', '5405', '60', '04', 'G4', G_BEB, 'TAB_MONOFASICA+CST60', N_BEBIDAS, ['TABELA_AMBIGUA'], 36.0, 58.0],
    ['SM-0301', 'Suco de Uva Integral 1L cx 6', '20096100', '5102', '00', '01', 'G1', null, 'SEM_TABELA', N_GERAL, [], 54.0, 89.0],
    ['SM-0302', 'Chá Gelado Pêssego 1,5L fd 6', '22029900', '5102', '00', '04', 'G2', G_BEB, 'TAB_MONOFASICA', N_BEBIDAS, ['CST_MONOFASICO_SEM_TABELA'], 31.0, 48.0],
    ['SM-0401', 'Vinho Tinto Seco Cabernet 750ml cx 6', '22042100', '6102', '00', '01', 'G1', null, 'SEM_TABELA', N_GERAL, [], 210.0, 390.0],
    ['SM-0402', 'Destilado Cachaça Ouro 700ml cx 12', '22084000', '5405', '60', '01', 'G3', null, 'ST_CST60', N_ST, ['EMITENTE_DESCONHECIDO'], 180.0, 320.0],
    ['SM-0501', 'Gelo em Cubos 5kg', '22019000', '5102', '00', '01', 'G1', null, 'SEM_TABELA', N_GERAL, ['TIPI_NAO_CARREGADA'], 9.0, 16.0],
    ['SM-0601', 'Retorno de vasilhame — garrafeira 600ml', '39231090', '5921', '00', '49', 'G1', null, 'SEM_TABELA', N_GERAL, [], 120.0, 260.0, { remessa: true }],
    ['SM-0701', 'Cerveja Lager Barril 30L', '22030000', '5405', '60', '04', 'G4', G_BEB, 'TAB_MONOFASICA+CST60', N_BEBIDAS, ['BEBIDA_FRIA_SEM_VAREJISTA'], 390.0, 560.0],
  ],
  // Farmácia Vida Plena (RJ)
  farmacia: [
    ['FV-0001', 'Dipirona Monoidratada 500mg c/ 10', '30049099', '5405', '60', '04', 'G4', G_MED, 'TAB_MONOFASICA+CST60', N_MEDICAMENTOS, [], 4.9, 12.9, { codMod: '65' }],
    ['FV-0002', 'Losartana Potássica 50mg c/ 30', '30049069', '5405', '60', '04', 'G4', G_MED, 'TAB_MONOFASICA+CST60', N_MEDICAMENTOS, [], 9.9, 24.9, { codMod: '65' }],
    ['FV-0003', 'Amoxicilina 500mg c/ 21', '30041012', '5405', '60', '04', 'G4', G_MED, 'TAB_MONOFASICA+CST60', N_MEDICAMENTOS, [], 18.9, 42.9],
    ['FV-0004', 'Insulina NPH 10ml', '30043100', '5102', '40', '06', 'G2', G_MED, 'ALIQ_ZERO_LISTA_POSITIVA', N_ALIQ_ZERO, ['CONDICAO_NAO_VERIFICAVEL'], 39.0, 79.0],
    ['FV-0101', 'Protetor Solar FPS 50 200ml', '33049910', '5405', '60', '04', 'G4', G_PERF, 'TAB_MONOFASICA+CST60', N_PERFUMARIA, [], 49.9, 109.9, { codMod: '65' }],
    ['FV-0102', 'Creme Dental Branqueador 90g', '33061000', '5405', '60', '04', 'G4', G_PERF, 'TAB_MONOFASICA+CST60', N_PERFUMARIA, [], 6.9, 15.9, { codMod: '65' }],
    ['FV-0103', 'Desodorante Aerosol 150ml', '33072010', '5405', '60', '01', 'G4', G_PERF, 'TAB_MONOFASICA+CST60', N_PERFUMARIA, ['CST_MONOFASICO_CONTRARIADO_PELA_TABELA'], 12.9, 24.9],
    ['FV-0201', 'Fralda Geriátrica G c/ 8', '96190000', '5102', '00', '01', 'G1', null, 'SEM_TABELA', N_GERAL, [], 29.9, 59.9, { codMod: '65' }],
    ['FV-0202', 'Termômetro Digital Clínico', '90251110', '5102', '00', '01', 'G1', null, 'SEM_TABELA', N_GERAL, [], 19.9, 39.9],
    ['FV-0203', 'Suplemento Vitamina D 2000UI c/ 60', '21069030', '5102', '00', '04', 'G2', G_MED, 'TAB_MONOFASICA', N_MEDICAMENTOS, ['CST_MONOFASICO_SEM_TABELA', 'NCM_SEM_DESCRICAO_COERENTE'], 34.9, 69.9],
    ['FV-0204', 'Álcool em Gel 70% 500g', '38089419', '5405', '60', '01', 'G3', null, 'ST_CST60', N_ST, ['EXCLUSAO_TABELA'], 9.9, 19.9],
    ['FV-0205', 'Curativo Adesivo c/ 40', '30051090', '5102', '00', '01', 'G1', null, 'NCM_INVALIDO', N_GERAL, ['NCM_INVALIDO'], 7.9, 14.9],
    ['FV-0301', 'Remessa para troca — lote vencido', '30049099', '5949', '00', '49', 'G1', null, 'SEM_TABELA', N_GERAL, [], 150.0, 480.0, { remessa: true }],
  ],
  // Têxtil Rio das Pedras (SC) — revenda + produção própria
  textil: [
    ['TR-1001', 'Tecido Malha Algodão Penteado (revenda) kg', '60062200', '5102', '101', '01', 'G1', null, 'SEM_TABELA', N_GERAL, [], 180.0, 640.0],
    ['TR-1002', 'Linha de Costura Poliéster cone 2000m', '54011011', '6102', '101', '01', 'G1', null, 'SEM_TABELA', N_GERAL, [], 45.0, 120.0],
    ['TR-1003', 'Toalha de Banho Felpuda (fabricação própria)', '63026000', '5101', '101', '01', 'G1', null, 'SEM_TABELA', N_GERAL, [], 260.0, 890.0, { kit: true }],
    ['TR-1004', 'Jogo de Lençol Percal 200 fios (fabricação própria)', '63022100', '6101', '101', '01', 'G1', null, 'SEM_TABELA', N_GERAL, ['TIPI_NAO_CARREGADA'], 320.0, 1200.0, { kit: true }],
    ['TR-1005', 'Botões de Resina (revenda) cento', '96062100', '5405', '500', '01', 'G3', null, 'ST_CSOSN500', N_ST, [], 25.0, 80.0],
    ['TR-1006', 'Toalha de Rosto Exportação (Uruguai)', '63026000', '7101', '300', '08', 'G5', null, 'EXPORTACAO_CFOP7', N_EXPORT, [], 1800.0, 4200.0, { export: true, kit: true }],
    ['TR-1007', 'Tecido Tricoline Estampado (revenda) m', '52083200', '5102', '101', '01', 'G1', null, 'SEM_TABELA', N_GERAL, ['NCM_SEM_DESCRICAO_COERENTE'], 90.0, 340.0],
  ],
  // Metalúrgica Bandeirantes (SP) — revenda de autopeças e exportação
  autopecas: [
    ['MB-2001', 'Pastilha de Freio Dianteira jogo', '68138110', '5405', '60', '04', 'G4', G_AUTO, 'TAB_MONOFASICA+CST60', N_AUTOPECAS, [], 89.0, 210.0],
    ['MB-2002', 'Filtro de Óleo Motor 1.0', '84212300', '5405', '60', '04', 'G4', G_AUTO, 'TAB_MONOFASICA+CST60', N_AUTOPECAS, [], 18.0, 46.0],
    ['MB-2003', 'Amortecedor Traseiro par', '87088000', '6403', '60', '04', 'G4', G_AUTO, 'TAB_MONOFASICA+CST60', N_AUTOPECAS, ['EMITENTE_DESCONHECIDO'], 310.0, 780.0],
    ['MB-2004', 'Parafuso Sextavado M10 cento', '73181500', '5102', '00', '01', 'G1', null, 'SEM_TABELA', N_GERAL, [], 35.0, 92.0],
    ['MB-2005', 'Chapa de Aço Galvanizado 2mm', '72104910', '5102', '00', '01', 'G1', null, 'SEM_TABELA', N_GERAL, [], 640.0, 2200.0],
    ['MB-2006', 'Rolamento de Roda (importado)', '84821010', '5405', '60', '04', 'G4', G_AUTO, 'TAB_MONOFASICA+CST60', N_AUTOPECAS, ['IMPORTACAO_DIRETA'], 120.0, 260.0, { orig: '1' }],
    ['MB-2007', 'Suporte Metálico para Motor — exportação (Paraguai)', '87089990', '7102', '41', '08', 'G5', null, 'EXPORTACAO_CFOP7', N_EXPORT, [], 2400.0, 6800.0, { export: true }],
    ['MB-2008', 'Correia Dentada', '40103900', '5405', '60', '01', 'G3', null, 'ST_CST60', N_ST, ['TABELA_AMBIGUA'], 64.0, 140.0],
  ],
}

// Perfil e configuração por empresa. Sem perfil = sem rodada (empresas de serviço).
const CONFIG_EMPRESA = {
  1: { perfil: 'presentes', notas: 46, piloto: true, kitsAnexoII: true, orfao: true },
  2: { perfil: 'bebidas', notas: 40, piloto: false },
  3: { perfil: 'textil', notas: 24, piloto: false, kitsAnexoII: true },
  4: { perfil: 'autopecas', notas: 30, piloto: false },
  5: { perfil: 'farmacia', notas: 52, piloto: true },
}

const UFS_HABILITADAS = ['SP', 'MG']

// ─────────────────────────────────────────────────────────────────────────
// Estado em memória
// ─────────────────────────────────────────────────────────────────────────
const estados = new Map() // `${companyId}|${comp}` → { itens, historico }
const varejista = new Map() // companyId → registros
const pilotos = new Map() // companyId → { ativo }
let seqHistorico = 9000
let seqVarejista = 300
let seqLote = 1

function pilotoDe(companyId) {
  const id = Number(companyId)
  if (!pilotos.has(id)) pilotos.set(id, { ativo: Boolean(CONFIG_EMPRESA[id]?.piloto) })
  const uf = companyOf(id)?.uf || null
  const { ativo } = pilotos.get(id)
  return { ativo, uf, ufsHabilitadas: [...UFS_HABILITADAS], efetivo: ativo && UFS_HABILITADAS.includes(uf) }
}

function varejistaDe(companyId) {
  const id = Number(companyId)
  if (!varejista.has(id)) {
    const inicial = []
    if (id === 1) {
      inicial.push(
        {
          id: seqVarejista++, companyId: 1, anoCalendario: 2025, percentual: '92.40', confirmado: true,
          fonte: 'MANUAL_CELULA', evidencia: 'Relatório de vendas por canal 2025 (PDV x atacado)',
          autor: 'ana.prado@bhub.ai', supersededBy: null, createdAt: '2026-02-11T14:22:00-03:00',
        },
        {
          id: seqVarejista++, companyId: 1, anoCalendario: 2024, percentual: '88.00', confirmado: true,
          fonte: 'MANUAL_CELULA', evidencia: 'DEFIS 2024', autor: 'ana.prado@bhub.ai',
          supersededBy: null, createdAt: '2025-03-04T10:05:00-03:00',
        }
      )
    }
    varejista.set(id, inicial)
  }
  return varejista.get(id)
}

function derivado(natureza, exportacaoDireta) {
  return exportacaoDireta || natureza === 'G5' ? ID_DERIVADO_EXPORTACAO : IDS_DERIVADOS[natureza] ?? null
}

function aceitos(natureza, exportacaoDireta) {
  return exportacaoDireta ? IDS_EXPORTACAO : IDS_POR_NATUREZA[natureza] || []
}

function gerarEstado(companyId, comp) {
  const cfg = CONFIG_EMPRESA[Number(companyId)]
  if (!cfg) return { semRodada: true, itens: [], historico: [] }
  const catalogo = PERFIS[cfg.perfil]
  const rand = prng(Number(companyId) * 7919 + Number(comp))
  const mm = comp.slice(4, 6)
  const dias = ultimoDia(comp)
  const itens = []
  let seqItem = 1
  for (let n = 0; n < cfg.notas; n++) {
    const numDoc = String(10000 + Number(companyId) * 1000 + Number(mm) * 60 + n * 3 + Math.floor(rand() * 3))
    const dia = String(1 + Math.floor(rand() * dias)).padStart(2, '0')
    const qtdItens = 1 + Math.floor(rand() * 3)
    const usados = new Set()
    for (let k = 0; k < qtdItens; k++) {
      let p = catalogo[Math.floor(rand() * catalogo.length)]
      if (usados.has(p[0])) continue
      usados.add(p[0])
      const [codItem, descricao, ncm, cfop, cstIcms, cstPis, natureza, grupo, motivo, norma, sinais, vmin, vmax, opts = {}] = p
      const qtd = 1 + Math.floor(rand() * (vmax > 1000 ? 2 : 6))
      const valor = Math.round((vmin + rand() * (vmax - vmin)) * qtd * 100) / 100
      const invoiceItemId = Number(companyId) * 1_000_000 + Number(mm) * 10_000 + seqItem
      const exportacaoDireta = Boolean(opts.export)
      itens.push({
        id: invoiceItemId + 500_000_000,
        nota: {
          invoiceId: Number(companyId) * 100_000 + Number(mm) * 1000 + n,
          numDoc,
          chave: `35${comp.slice(2)}${String(companyId).padStart(14, '0')}${opts.codMod || '55'}001${numDoc.padStart(9, '0')}1${String(n).padStart(8, '0')}`.slice(0, 44),
          dtDoc: `${comp.slice(0, 4)}-${mm}-${dia}`,
          codMod: opts.codMod || '55',
        },
        item: {
          invoiceItemId,
          numItem: k + 1,
          codItem,
          descricao,
          ncm: sinais.includes('NCM_INVALIDO') ? '00000000' : ncm,
          exTipi: sinais.includes('EXCLUSAO_TABELA') ? '01' : null,
          cstIcms,
          orig: opts.orig || '0',
          cfop: Math.floor(rand() * 60) === 0 ? null : cfop,
          cstPis,
          cstCofins: cstPis,
        },
        valor,
        naturezaCalculada: natureza,
        grupo,
        motivo,
        norma,
        sinais,
        remessaVerificar: Boolean(opts.remessa),
        exportacaoDireta,
        kit: Boolean(opts.kit),
        ajuste: null,
        ajusteOrfaoCompetencia: null,
      })
      seqItem++
    }
  }

  const historico = []
  const registrar = (it, dados) => {
    const h = {
      id: seqHistorico++,
      invoiceItemId: it.item.invoiceItemId,
      companyId: Number(companyId),
      competencia: comp,
      cfop: it.item.cfop,
      autor: 'ana.prado@bhub.ai',
      vigente: true,
      escopo: 'ITEM',
      loteId: null,
      ...dados,
    }
    historico.push(h)
    return h
  }

  // Ajustes pré-existentes: kits/produção própria movidos para o Anexo II (ID 4)…
  if (cfg.kitsAnexoII) {
    itens.filter((it) => it.kit && !it.exportacaoDireta).slice(0, 3).forEach((it, i) => {
      const criadoEm = `${comp.slice(0, 4)}-${comp.slice(4, 6)}-0${3 + i}T10:1${i}:00-03:00`
      const h = registrar(it, {
        acao: 'AJUSTE', naturezaAjustada: null, idAtividadeAjustada: 4, naturezaCalculada: it.naturezaCalculada,
        naturezaAnterior: it.naturezaCalculada, idAtividadeAnterior: derivado(it.naturezaCalculada, false),
        motivo: 'Produto montado/industrializado pela própria empresa: receita do Anexo II.', createdAt: criadoEm,
      })
      it.ajuste = { id: h.id, natureza: null, idAtividade: 4, autor: h.autor, motivo: h.motivo, escopo: 'ITEM', loteId: null, criadoEm }
    })
  }
  // …uma correção de natureza (CST 01 em perfumaria que é revenda de estoque antigo, G4 → G2)…
  const contrariado = itens.find((it) => it.sinais.includes('CST_MONOFASICO_CONTRARIADO_PELA_TABELA'))
  if (contrariado) {
    const criadoEm = `${comp.slice(0, 4)}-${comp.slice(4, 6)}-08T16:40:00-03:00`
    const h = registrar(contrariado, {
      acao: 'AJUSTE', naturezaAjustada: 'G2', idAtividadeAjustada: null, naturezaCalculada: contrariado.naturezaCalculada,
      naturezaAnterior: contrariado.naturezaCalculada, idAtividadeAnterior: derivado(contrariado.naturezaCalculada, false),
      motivo: 'Mercadoria comprada sem ST (nota de entrada 4.512 do fornecedor); ICMS próprio na saída.', createdAt: criadoEm,
    })
    contrariado.ajuste = { id: h.id, natureza: 'G2', idAtividade: null, autor: h.autor, motivo: h.motivo, escopo: 'ITEM', loteId: null, criadoEm }
  }
  // …e um ajuste órfão (a sombra mudou de competência: o ajuste da anterior não vale aqui).
  if (cfg.orfao) {
    const alvo = itens.find((it) => it.naturezaCalculada === 'G3' && !it.ajuste)
    if (alvo) alvo.ajusteOrfaoCompetencia = compAnterior(comp)
  }

  return { semRodada: false, calculadoEm: `${comp.slice(0, 4)}-${mm}-${String(Math.min(dias, 28)).padStart(2, '0')}T03:12:44-03:00`, itens, historico }
}

function estadoDe(companyId, comp) {
  const chave = `${Number(companyId)}|${comp}`
  if (!estados.has(chave)) estados.set(chave, gerarEstado(companyId, comp))
  return estados.get(chave)
}

// ─────────────────────────────────────────────────────────────────────────
// Visões derivadas do estado
// ─────────────────────────────────────────────────────────────────────────
function efetivo(it, piloto) {
  const natureza = it.ajuste?.natureza || it.naturezaCalculada
  const idDerivado = derivado(natureza, it.exportacaoDireta)
  const idAjustado = it.ajuste?.idAtividade ?? null
  const incoerente = idAjustado != null && !aceitos(natureza, it.exportacaoDireta).includes(idAjustado)
  const idAtividade = idAjustado != null && !incoerente ? idAjustado : idDerivado
  let efeitoNoDasMotivo = null
  if (it.nota.codMod === '65') efeitoNoDasMotivo = 'NOTA_FORA_DA_APURACAO'
  else if (!piloto.efetivo) efeitoNoDasMotivo = 'FORA_DO_PILOTO'
  return {
    natureza,
    idAtividade,
    idAtividadeCalculado: derivado(it.naturezaCalculada, it.exportacaoDireta),
    idAtividadeIncoerente: incoerente,
    anexo: IDS_ANEXO_II.includes(idAtividade) ? 'II' : 'I',
    efeitoNoDas: efeitoNoDasMotivo === null,
    efeitoNoDasMotivo,
  }
}

function itemOut(it, piloto) {
  const e = efetivo(it, piloto)
  return {
    id: it.id,
    nota: it.nota,
    item: it.item,
    valor: dinheiro(it.valor),
    natureza: e.natureza,
    naturezaCalculada: it.naturezaCalculada,
    idAtividade: e.idAtividade,
    idAtividadeCalculado: e.idAtividadeCalculado,
    idAtividadeIncoerente: e.idAtividadeIncoerente,
    ajuste: it.ajuste,
    grupo: it.grupo,
    motivo: it.motivo,
    norma: it.norma,
    regraVersao: REGRA_VERSAO,
    classificadorVersao: CLASSIFICADOR_VERSAO,
    modo: piloto.efetivo ? 'ATIVO' : 'SOMBRA',
    sinais: it.sinais.map(sinal),
    remessaVerificar: it.remessaVerificar,
    efeitoNoDas: e.efeitoNoDas,
    efeitoNoDasMotivo: e.efeitoNoDasMotivo,
    exportacaoDireta: it.exportacaoDireta,
    ajusteOrfaoCompetencia: it.ajusteOrfaoCompetencia,
  }
}

function filtrar(itens, params, piloto) {
  const natureza = params.get('natureza')
  const sinalF = params.get('sinal')
  const grupo = params.get('grupo')
  const cfop = params.get('cfop')
  const anexo = params.get('anexo')
  return itens
    .filter((it) => {
      const e = efetivo(it, piloto)
      if (natureza && e.natureza !== natureza) return false
      if (sinalF && !it.sinais.includes(sinalF)) return false
      if (grupo && it.grupo !== grupo) return false
      if (cfop && (cfop === 'vazio' ? it.item.cfop != null : it.item.cfop !== cfop)) return false
      if (anexo && e.anexo !== anexo) return false
      return true
    })
    .sort((a, b) => b.valor - a.valor)
}

function resumo(companyId, comp) {
  const est = estadoDe(companyId, comp)
  const piloto = pilotoDe(companyId)
  const base = {
    companyId: Number(companyId),
    competencia: comp,
    piloto,
    atividades: ATIVIDADES,
    idsAtividadePorNatureza: IDS_POR_NATUREZA,
    idsAtividadeExportacao: IDS_EXPORTACAO,
    idsAtividadeDerivados: IDS_DERIVADOS,
    idAtividadeDerivadoExportacao: ID_DERIVADO_EXPORTACAO,
  }
  if (est.semRodada) {
    return {
      ...base, calculadoEm: null, modo: null, receitaTotal: '0.00', itens: 0, porNatureza: {}, porNaturezaAnexoI: {},
      g2PorGrupo: [], pendencias: 0, alertas: 0, sinaisPorCodigo: [], anexoII: { itens: 0, valor: '0.00' }, receitaAnexoI: '0.00',
    }
  }
  const comEfeito = est.itens.map((it) => ({ it, e: efetivo(it, piloto) }))
  const porNatureza = {}
  const porNaturezaAnexoI = {}
  for (const g of NATUREZAS) {
    porNatureza[g] = dinheiro(soma(comEfeito.filter((x) => x.e.natureza === g).map((x) => x.it)))
    porNaturezaAnexoI[g] = dinheiro(soma(comEfeito.filter((x) => x.e.natureza === g && x.e.anexo === 'I').map((x) => x.it)))
  }
  const anexoII = comEfeito.filter((x) => x.e.anexo === 'II').map((x) => x.it)
  const anexoI = comEfeito.filter((x) => x.e.anexo === 'I').map((x) => x.it)

  const grupos = new Map()
  for (const { it, e } of comEfeito) {
    if (e.natureza !== 'G2' && e.natureza !== 'G4') continue
    const g = it.grupo || 'Sem grupo'
    const atual = grupos.get(g) || { grupo: g, valor: 0, itens: 0 }
    atual.valor += it.valor
    atual.itens += 1
    grupos.set(g, atual)
  }

  const porSinal = new Map()
  for (const it of est.itens) {
    for (const c of it.sinais) {
      const atual = porSinal.get(c) || { codigo: c, ...SINAIS[c], itens: 0, valor: 0 }
      atual.itens += 1
      atual.valor += it.valor
      porSinal.set(c, atual)
    }
  }
  const temSev = (it, sev) => it.sinais.some((c) => SINAIS[c]?.severidade === sev)

  return {
    ...base,
    calculadoEm: est.calculadoEm,
    modo: piloto.efetivo ? 'ATIVO' : 'SOMBRA',
    receitaTotal: dinheiro(soma(est.itens)),
    itens: est.itens.length,
    porNatureza,
    porNaturezaAnexoI,
    anexoII: { itens: anexoII.length, valor: dinheiro(soma(anexoII)) },
    receitaAnexoI: dinheiro(soma(anexoI)),
    g2PorGrupo: [...grupos.values()]
      .sort((a, b) => b.valor - a.valor)
      .map((g) => ({ ...g, valor: dinheiro(g.valor) })),
    pendencias: est.itens.filter((it) => temSev(it, 'PENDENCIA')).length,
    alertas: est.itens.filter((it) => temSev(it, 'ALERTA')).length,
    sinaisPorCodigo: [...porSinal.values()].map((s) => ({ ...s, valor: dinheiro(s.valor) })),
  }
}

function porCfop(companyId, comp) {
  const est = estadoDe(companyId, comp)
  const piloto = pilotoDe(companyId)
  const linhas = new Map()
  for (const it of est.itens) {
    const e = efetivo(it, piloto)
    const chave = `${it.item.cfop || ''}|${e.natureza}|${e.anexo}|${it.exportacaoDireta}`
    const l = linhas.get(chave) || {
      cfop: it.item.cfop,
      natureza: e.natureza,
      anexo: e.anexo,
      exportacaoDireta: it.exportacaoDireta,
      idsAtividadeAceitos: it.exportacaoDireta
        ? Object.fromEntries(NATUREZAS.map((g) => [g, IDS_EXPORTACAO]))
        : IDS_POR_NATUREZA,
      itens: 0,
      valor: 0,
      remessaVerificar: false,
    }
    l.itens += 1
    l.valor += it.valor
    l.remessaVerificar = l.remessaVerificar || it.remessaVerificar
    linhas.set(chave, l)
  }
  const lista = [...linhas.values()].sort((a, b) => b.valor - a.valor)
  const somaAnexo = (a) => lista.filter((l) => l.anexo === a).reduce((acc, l) => acc + l.valor, 0)
  return {
    companyId: Number(companyId),
    competencia: comp,
    receitaTotal: dinheiro(soma(est.itens)),
    receitaAnexoI: dinheiro(somaAnexo('I')),
    receitaAnexoII: dinheiro(somaAnexo('II')),
    linhas: lista.map((l) => ({ ...l, valor: dinheiro(l.valor) })),
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Escrita: ajuste por item, lote e revogação
// ─────────────────────────────────────────────────────────────────────────
function encerrarVigente(est, invoiceItemId) {
  for (const h of est.historico) if (h.invoiceItemId === invoiceItemId) h.vigente = false
}

function ajusteOut(h, piloto, it, modo) {
  const e = efetivo(it, piloto)
  return { ...h, efeitoNoDas: e.efeitoNoDas, efeitoNoDasMotivo: e.efeitoNoDasMotivo, idAtividadeModo: modo }
}

// Aplica (ou devolve null se já está no destino). Lança 422 em combinação inválida.
function aplicarAjuste(est, it, piloto, { natureza, idModo, idValor, confirmaAnexoII, motivo, escopo = 'ITEM', loteId = null }) {
  if (natureza && !NATUREZAS.includes(natureza)) throw erro422(`natureza inválida: ${natureza} (esperado G1–G5)`)
  const antes = efetivo(it, piloto)
  const naturezaFinal = natureza || antes.natureza
  if (it.exportacaoDireta && naturezaFinal !== 'G5') {
    throw erro422('item de exportação direta (CFOP 7xxx): só G5 é aceita')
  }
  const ok = aceitos(naturezaFinal, it.exportacaoDireta)
  let idAjustado
  if (idModo === 'VALOR') idAjustado = idValor
  else if (idModo === 'DERIVADO') idAjustado = null
  else idAjustado = it.ajuste?.idAtividade != null && !antes.idAtividadeIncoerente && ok.includes(it.ajuste.idAtividade)
    ? it.ajuste.idAtividade
    : null
  if (idAjustado != null && !ok.includes(idAjustado)) {
    throw erro422(`ID da atividade ${idAjustado} não combina com ${naturezaFinal}: aceitos ${ok.join(', ')}`)
  }
  const idDerivado = derivado(naturezaFinal, it.exportacaoDireta)
  if (idAjustado === idDerivado) idAjustado = null // VALOR igual ao derivado = DERIVADO
  const idFinal = idAjustado ?? idDerivado
  if (IDS_ANEXO_II.includes(idFinal) && !IDS_ANEXO_II.includes(antes.idAtividade) && !confirmaAnexoII) {
    throw erro422('o ID passa a 4–6 (Anexo II): confirme a mudança (confirmaAnexoII)')
  }
  if (naturezaFinal === antes.natureza && idFinal === antes.idAtividade && !antes.idAtividadeIncoerente) {
    return null // já no destino
  }
  const naturezaAjustada = naturezaFinal !== it.naturezaCalculada ? naturezaFinal : null
  const revoga = naturezaAjustada === null && idAjustado === null
  const agora = new Date().toISOString()
  encerrarVigente(est, it.item.invoiceItemId)
  const h = {
    id: seqHistorico++,
    invoiceItemId: it.item.invoiceItemId,
    companyId: est.companyId,
    competencia: est.competencia,
    acao: revoga ? 'REVOGACAO' : 'AJUSTE',
    naturezaAjustada,
    idAtividadeAjustada: idAjustado,
    naturezaCalculada: it.naturezaCalculada,
    naturezaAnterior: antes.natureza,
    idAtividadeAnterior: antes.idAtividade,
    motivo,
    escopo,
    loteId,
    cfop: it.item.cfop,
    autor: AUTOR,
    vigente: !revoga,
    createdAt: agora,
  }
  est.historico.push(h)
  it.ajuste = revoga
    ? null
    : { id: h.id, natureza: naturezaAjustada, idAtividade: idAjustado, autor: AUTOR, motivo, escopo, loteId, criadoEm: agora }
  const modoGravado = revoga ? null : idAjustado != null ? 'VALOR' : idModo === 'HERDAR' ? 'HERDAR' : 'DERIVADO'
  return { h, revoga, modoGravado }
}

function exigeMotivo(body) {
  const motivo = String(body.motivo || '').trim()
  if (!motivo) throw erro422('motivo é obrigatório')
  return motivo
}

function itemPorId(est, invoiceItemId) {
  const it = est.itens.find((x) => x.item.invoiceItemId === Number(invoiceItemId))
  if (!it) {
    const err = new Error(`Erro (404): item ${invoiceItemId} não encontrado na competência`)
    err.status = 404
    throw err
  }
  return it
}

function modoDoCorpo(body, campoValor) {
  if (body[campoValor] != null) return { idModo: 'VALOR', idValor: Number(body[campoValor]) }
  if (body.idAtividadeModo === 'DERIVADO') return { idModo: 'DERIVADO', idValor: null }
  return { idModo: 'HERDAR', idValor: null }
}

function estadoComContexto(companyId, comp) {
  const est = estadoDe(companyId, comp)
  est.companyId = Number(companyId)
  est.competencia = comp
  if (est.semRodada) throw erro422('sem rodada do classificador nesta competência')
  return est
}

// ─────────────────────────────────────────────────────────────────────────
// Rotas
// ─────────────────────────────────────────────────────────────────────────
const BASE = String.raw`^\/companies\/(\d+)\/natureza-itens`

mockRoute(new RegExp(`${BASE}\\/resumo$`), 'GET', (path, match) =>
  resumo(match[1], normComp(paramsOf(path).get('competencia')))
)

mockRoute(new RegExp(`${BASE}\\/por-cfop$`), 'GET', (path, match) =>
  porCfop(match[1], normComp(paramsOf(path).get('competencia')))
)

mockRoute(new RegExp(`${BASE}$`), 'GET', (path, match) => {
  const params = paramsOf(path)
  const comp = normComp(params.get('competencia'))
  const est = estadoDe(match[1], comp)
  const piloto = pilotoDe(match[1])
  const page = Math.max(1, Number(params.get('page')) || 1)
  const pageSize = Math.max(1, Number(params.get('page_size')) || 50)
  const filtrados = filtrar(est.itens, params, piloto)
  return {
    total: filtrados.length,
    page,
    pageSize,
    itens: filtrados.slice((page - 1) * pageSize, page * pageSize).map((it) => itemOut(it, piloto)),
  }
})

// XLSX: no protótipo devolve CSV dentro de JSON; o service baixa como .csv.
mockRoute(new RegExp(`${BASE}\\/export\\.xlsx$`), 'GET', (path, match) => {
  const params = paramsOf(path)
  const comp = normComp(params.get('competencia'))
  const piloto = pilotoDe(match[1])
  const linhas = filtrar(estadoDe(match[1], comp).itens, params, piloto).map((it) => itemOut(it, piloto))
  const cab = ['Nota', 'Modelo', 'Data', 'Item', 'Código', 'Descrição', 'NCM', 'CFOP', 'CST/CSOSN', 'CST PIS', 'CST COFINS',
    'Valor', 'Natureza', 'Natureza calculada', 'ID atividade', 'Grupo', 'Motivo', 'Norma', 'Sinais']
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const corpo = linhas.map((l) => [
    l.nota.numDoc, l.nota.codMod, l.nota.dtDoc, l.item.numItem, l.item.codItem, l.item.descricao, l.item.ncm,
    l.item.cfop, l.item.cstIcms, l.item.cstPis, l.item.cstCofins, l.valor.replace('.', ','), l.natureza,
    l.naturezaCalculada, l.idAtividade, l.grupo, l.motivo, l.norma, l.sinais.map((s) => s.codigo).join(' '),
  ].map(esc).join(';'))
  const sufixo = ['natureza', 'sinal', 'grupo', 'cfop', 'anexo']
    .filter((c) => params.get(c))
    .map((c) => `${c}-${params.get(c)}`)
    .join('_')
  return {
    filename: `natureza-itens-${match[1]}-${comp}${sufixo ? `_${sufixo}` : ''}.csv`,
    csv: [cab.join(';'), ...corpo].join('\n'),
  }
})

mockRoute(new RegExp(`${BASE}\\/(\\d+)\\/ajustes$`), 'GET', (path, match) => {
  const comp = normComp(paramsOf(path).get('competencia'))
  const est = estadoDe(match[1], comp)
  return est.historico
    .filter((h) => h.invoiceItemId === Number(match[2]))
    .sort((a, b) => b.id - a.id)
})

mockRoute(new RegExp(`${BASE}\\/(\\d+)\\/ajuste$`), 'POST', (_path, match, rawBody) => {
  const body = bodyOf(rawBody)
  const motivo = exigeMotivo(body)
  const comp = normComp(body.competencia)
  const est = estadoComContexto(match[1], comp)
  const piloto = pilotoDe(match[1])
  const it = itemPorId(est, match[2])
  const r = aplicarAjuste(est, it, piloto, {
    natureza: body.natureza || null,
    ...modoDoCorpo(body, 'idAtividade'),
    confirmaAnexoII: Boolean(body.confirmaAnexoII),
    motivo,
  })
  if (!r) throw erro422('nada a ajustar: o item já está nessa natureza e ID da atividade')
  return ajusteOut(r.h, piloto, it, r.modoGravado)
})

mockRoute(new RegExp(`${BASE}\\/(\\d+)\\/ajuste\\/revogar$`), 'POST', (_path, match, rawBody) => {
  const body = bodyOf(rawBody)
  const motivo = exigeMotivo(body)
  const comp = normComp(body.competencia)
  const piloto = pilotoDe(match[1])
  // Revogação do órfão chega com a competência anterior: procura o item em qualquer competência carregada.
  let est = null
  let it = null
  for (const [chave, e] of estados) {
    if (!chave.startsWith(`${Number(match[1])}|`)) continue
    const achado = e.itens.find((x) => x.item.invoiceItemId === Number(match[2]))
    if (achado && (chave.endsWith(`|${comp}`) || achado.ajusteOrfaoCompetencia === comp)) {
      est = e
      it = achado
      break
    }
  }
  if (!it) {
    est = estadoComContexto(match[1], comp)
    it = itemPorId(est, match[2])
  }
  const orfao = it.ajusteOrfaoCompetencia === comp
  if (!orfao && !it.ajuste) throw erro422('o item não tem ajuste vigente nesta competência')
  const antes = efetivo(it, piloto)
  const agora = new Date().toISOString()
  encerrarVigente(est, it.item.invoiceItemId)
  const h = {
    id: seqHistorico++,
    invoiceItemId: it.item.invoiceItemId,
    companyId: Number(match[1]),
    competencia: comp,
    acao: 'REVOGACAO',
    naturezaAjustada: null,
    idAtividadeAjustada: null,
    naturezaCalculada: it.naturezaCalculada,
    naturezaAnterior: antes.natureza,
    idAtividadeAnterior: antes.idAtividade,
    motivo,
    escopo: 'ITEM',
    loteId: null,
    cfop: it.item.cfop,
    autor: AUTOR,
    vigente: false,
    createdAt: agora,
  }
  est.historico.push(h)
  if (orfao) it.ajusteOrfaoCompetencia = null
  else it.ajuste = null
  return ajusteOut(h, piloto, it, null)
})

mockRoute(new RegExp(`${BASE}\\/ajuste-lote$`), 'POST', (_path, match, rawBody) => {
  const body = bodyOf(rawBody)
  const motivo = exigeMotivo(body)
  const comp = normComp(body.competencia)
  const est = estadoComContexto(match[1], comp)
  const piloto = pilotoDe(match[1])
  const cfop = body.cfop === 'vazio' ? null : body.cfop || null
  const anexo = body.anexo || 'I'
  const exportacao = Boolean(body.exportacao)
  const { idModo, idValor } = modoDoCorpo(body, 'idAtividadePara')
  if (!body.naturezaPara && idModo === 'HERDAR') throw erro422('escolha a natureza de destino ou o ID da atividade')

  const recorte = est.itens.filter((it) => {
    const e = efetivo(it, piloto)
    return (it.item.cfop || null) === cfop && e.natureza === body.naturezaDe && e.anexo === anexo
      && it.exportacaoDireta === exportacao
  })
  const loteId = `lote-${String(seqLote++).padStart(4, '0')}`
  let gravados = 0
  let revogados = 0
  let pulados = 0
  let valor = 0
  let comEfeito = 0
  const porModo = {}
  // O recorte é homogêneo (mesma natureza, anexo e exportação): combinação inválida
  // falha já no primeiro item, antes de gravar qualquer coisa.
  for (const it of recorte) {
    const r = aplicarAjuste(est, it, piloto, {
      natureza: body.naturezaPara || null,
      idModo,
      idValor,
      confirmaAnexoII: Boolean(body.confirmaAnexoII),
      motivo,
      escopo: 'LOTE',
      loteId,
    })
    if (!r) {
      pulados += 1
      continue
    }
    gravados += 1
    valor += it.valor
    if (r.revoga) revogados += 1
    if (r.modoGravado) porModo[r.modoGravado] = (porModo[r.modoGravado] || 0) + 1
    if (efetivo(it, piloto).efeitoNoDas) comEfeito += 1
  }
  const base = {
    cfop: body.cfop,
    naturezaDe: body.naturezaDe,
    naturezaPara: body.naturezaPara || null,
    idAtividadeModo: idModo,
    idAtividadePara: idValor,
  }
  if (gravados === 0) {
    return {
      ...base, loteId: null, itens: 0, itensPulados: pulados, revogados: 0, valor: '0.00',
      mensagem: `Nada a ajustar: ${pulados} ${pulados === 1 ? 'item já estava' : 'itens já estavam'} no destino.`,
      efeitoNoDas: false, efeitoNoDasMotivo: null, itensComEfeitoNoDas: 0, itensSemEfeito: 0, itensPorModo: {},
    }
  }
  return {
    ...base,
    loteId,
    itens: gravados,
    itensPulados: pulados,
    revogados,
    mensagem: null,
    valor: dinheiro(valor),
    efeitoNoDas: comEfeito > 0,
    efeitoNoDasMotivo: comEfeito > 0 ? null : piloto.efetivo ? 'NOTA_FORA_DA_APURACAO' : 'FORA_DO_PILOTO',
    itensComEfeitoNoDas: comEfeito,
    itensSemEfeito: gravados - comEfeito,
    itensPorModo: porModo,
  }
})

mockRoute(/^\/companies\/(\d+)\/varejista-art17$/, 'GET', (_path, match) =>
  [...varejistaDe(match[1])].sort((a, b) => b.anoCalendario - a.anoCalendario || b.id - a.id)
)

mockRoute(/^\/companies\/(\d+)\/varejista-art17$/, 'POST', (_path, match, rawBody) => {
  const body = bodyOf(rawBody)
  const ano = Number(body.anoCalendario)
  const pct = Number(body.percentual)
  if (!Number.isInteger(ano)) throw erro422('anoCalendario inválido')
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw erro422('percentual deve estar entre 0 e 100')
  const registros = varejistaDe(match[1])
  const novo = {
    id: seqVarejista++,
    companyId: Number(match[1]),
    anoCalendario: ano,
    percentual: pct.toFixed(2),
    confirmado: true,
    fonte: body.fonte || 'MANUAL_CELULA',
    evidencia: body.evidencia || null,
    autor: AUTOR,
    supersededBy: null,
    createdAt: new Date().toISOString(),
  }
  for (const r of registros) if (r.anoCalendario === ano && !r.supersededBy) r.supersededBy = novo.id
  registros.push(novo)
  return novo
})

mockRoute(/^\/companies\/(\d+)\/natureza-piloto$/, 'PATCH', (_path, match, rawBody) => {
  const body = bodyOf(rawBody)
  if (!String(body.motivo || '').trim()) throw erro422('motivo é obrigatório')
  pilotoDe(match[1])
  pilotos.set(Number(match[1]), { ativo: Boolean(body.ativo) })
  return { companyId: Number(match[1]), ...pilotoDe(match[1]) }
})
