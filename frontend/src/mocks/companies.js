import { mockRoute } from './registry'

// Lista compartilhada de empresas fictícias (dados fiscais brasileiros
// plausíveis). Outros fixtures importam MOCK_COMPANIES para cruzar
// razao_social/cnpj em vez de inventar um segundo conjunto desconectado.
export const MOCK_COMPANIES = [
  {
    id: 1,
    razao_social: 'Baby e Bag Comercio de Presentes Ltda',
    nome_fantasia: 'Baby e Bag',
    cnpj: '12.345.678/0001-90',
    uf: 'SP',
    ativo: true,
    regime_tributario: 'LUCRO_PRESUMIDO',
    inscricao_estadual: '110.042.490.114',
    cnae: '4772-5/00',
    nfe_entrada_enabled: true,
    nfse_servicos_enabled: true,
    cnaes_detalhes: JSON.stringify([
      { code: '4772-5/00', description: 'Comércio varejista de cosméticos e produtos de perfumaria', principal: true },
      { code: '4649-4/08', description: 'Comércio atacadista de produtos de higiene pessoal', principal: false },
    ]),
  },
  {
    id: 2,
    razao_social: 'Comercial Sao Marcos Distribuidora S.A.',
    nome_fantasia: 'Sao Marcos Distribuidora',
    cnpj: '23.456.789/0001-11',
    uf: 'MG',
    ativo: true,
    regime_tributario: 'LUCRO_REAL',
    inscricao_estadual: '062.345.678.0021',
    cnae: '4635-4/01',
    nfe_entrada_enabled: true,
    nfse_servicos_enabled: false,
    cnaes_detalhes: JSON.stringify([
      { code: '4635-4/01', description: 'Comércio atacadista de bebidas com atividade de fracionamento e acondicionamento', principal: true },
    ]),
  },
  {
    id: 3,
    razao_social: 'Industria Textil Rio das Pedras Ltda',
    nome_fantasia: 'Textil Rio das Pedras',
    cnpj: '34.567.890/0001-22',
    uf: 'SC',
    ativo: true,
    regime_tributario: 'SIMPLES_NACIONAL',
    inscricao_estadual: '256.789.012',
    cnae: '1351-1/00',
    nfe_entrada_enabled: true,
    nfse_servicos_enabled: true,
    cnaes_detalhes: JSON.stringify([
      { code: '1351-1/00', description: 'Fabricação de artefatos têxteis para uso doméstico', principal: true },
      { code: '1359-6/00', description: 'Fabricação de outros produtos têxteis', principal: false },
    ]),
  },
  {
    id: 4,
    razao_social: 'Metalurgica Bandeirantes do Brasil S.A.',
    nome_fantasia: 'Metalurgica Bandeirantes',
    cnpj: '45.678.901/0001-33',
    uf: 'SP',
    ativo: true,
    regime_tributario: 'LUCRO_REAL',
    inscricao_estadual: '334.567.890.115',
    cnae: '2599-3/99',
    nfe_entrada_enabled: true,
    nfse_servicos_enabled: false,
    cnaes_detalhes: JSON.stringify([
      { code: '2599-3/99', description: 'Fabricação de outros produtos de metal', principal: true },
    ]),
  },
  {
    id: 5,
    razao_social: 'Farmacia e Drogaria Vida Plena Ltda',
    nome_fantasia: 'Drogaria Vida Plena',
    cnpj: '56.789.012/0001-44',
    uf: 'RJ',
    ativo: true,
    regime_tributario: 'SIMPLES_NACIONAL',
    inscricao_estadual: '78.901.234',
    cnae: '4771-7/01',
    nfe_entrada_enabled: true,
    nfse_servicos_enabled: false,
    cnaes_detalhes: JSON.stringify([
      { code: '4771-7/01', description: 'Comércio varejista de produtos farmacêuticos', principal: true },
    ]),
  },
  {
    id: 6,
    razao_social: 'Construtora Horizonte Verde Engenharia Ltda',
    nome_fantasia: 'Horizonte Verde Engenharia',
    cnpj: '67.890.123/0001-55',
    uf: 'PR',
    ativo: true,
    regime_tributario: 'LUCRO_PRESUMIDO',
    inscricao_estadual: '90.345.678-40',
    cnae: '4120-4/00',
    nfe_entrada_enabled: true,
    nfse_servicos_enabled: true,
    cnaes_detalhes: JSON.stringify([
      { code: '4120-4/00', description: 'Construção de edifícios', principal: true },
      { code: '7112-0/00', description: 'Serviços de engenharia', principal: false },
    ]),
  },
  {
    id: 7,
    razao_social: 'Transportadora Rota Sul Logistica S.A.',
    nome_fantasia: 'Rota Sul Logistica',
    cnpj: '78.901.234/0001-66',
    uf: 'RS',
    ativo: false,
    regime_tributario: 'LUCRO_PRESUMIDO',
    inscricao_estadual: '123/4567890',
    cnae: '4930-2/02',
    nfe_entrada_enabled: false,
    nfse_servicos_enabled: true,
    cnaes_detalhes: JSON.stringify([
      { code: '4930-2/02', description: 'Transporte rodoviário de carga, exceto produtos perigosos e mudanças, municipal', principal: true },
    ]),
  },
  {
    id: 8,
    razao_social: 'Consultoria e Sistemas Alfa Tecnologia Ltda',
    nome_fantasia: 'Alfa Tecnologia',
    cnpj: '89.012.345/0001-77',
    uf: 'SP',
    ativo: true,
    regime_tributario: 'SIMPLES_NACIONAL',
    inscricao_estadual: 'ISENTO',
    cnae: '6201-5/01',
    nfe_entrada_enabled: false,
    nfse_servicos_enabled: true,
    cnaes_detalhes: JSON.stringify([
      { code: '6201-5/01', description: 'Desenvolvimento de programas de computador sob encomenda', principal: true },
    ]),
  },
]

function lookupShape(c) {
  // Formato "enxuto" usado pela imensa maioria das telas (useCompanies →
  // api.getCompanies → /companies/lookup) — mas na prática as telas também
  // leem razao_social, regime, flags de tipo etc, então devolvemos o objeto
  // quase completo (só sem os cnaes_detalhes, que exigem busca sob demanda).
  const { cnaes_detalhes, ...rest } = c
  return rest
}

mockRoute('/companies/lookup', 'GET', () => MOCK_COMPANIES.map(lookupShape))

mockRoute('/companies', 'GET', () => MOCK_COMPANIES.map(lookupShape))

mockRoute(/^\/companies\/(\d+)$/, 'GET', (path, match) => {
  const id = Number(match[1])
  return MOCK_COMPANIES.find((c) => c.id === id) || MOCK_COMPANIES[0]
})

mockRoute(/^\/companies\/(\d+)\/toggle-active$/, 'PATCH', () => ({ ok: true }))

mockRoute(/^\/companies\/(\d+)\/type-flags$/, 'PATCH', () => ({ ok: true }))

mockRoute(/^\/companies\/(\d+)\/delete-preview$/, 'GET', () => ({
  can_delete: true,
  cascade_counts: { invoices: 12, sped_files: 3 },
}))

mockRoute(/^\/companies\/(\d+)$/, 'DELETE', () => ({ ok: true }))
