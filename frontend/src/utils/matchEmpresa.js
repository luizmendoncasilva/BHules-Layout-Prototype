import { normalizeCnpj } from './cnpj'

/**
 * Busca de empresa compartilhada pelos seletores (GL-C4, 02/10/2026).
 *
 * Casa o termo digitado contra razão social, nome fantasia e CNPJ:
 * - nomes: sem diferença de maiúsculas/minúsculas nem de acento
 *   ("gestao" casa "GESTÃO");
 * - CNPJ: compara sem máscara dos dois lados ("32.127.978/0001-05",
 *   "32127978000105" e "32127978" casam o mesmo cadastro), preservando as
 *   letras do CNPJ alfanumérico.
 *
 * Motivo: 167 de 1.158 empresas ativas têm razão social diferente do nome que
 * a prefeitura imprime na nota. Buscar só na razão social fazia a Célula
 * concluir que a empresa "não existe no BHules".
 */

// Minúsculas, sem acento e com espaços colapsados.
export const normalizeTexto = (v) =>
  (v ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Devolve um predicado `(empresa) => boolean` para o termo. Termo vazio casa
 * todas. Pré-calcula a normalização do termo uma vez por busca.
 */
export function criarMatchEmpresa(termo) {
  const texto = normalizeTexto(termo)
  if (!texto) return () => true
  const cnpjTermo = normalizeCnpj(termo)
  // Só tenta o CNPJ quando o termo parece CNPJ: alfanumérico depois de tirar a
  // máscara e com ao menos um dígito (o DV do CNPJ é sempre numérico). Sem
  // isso, "ab" casaria qualquer CNPJ alfanumérico com "AB".
  const buscaCnpj = /^[0-9A-Z]+$/.test(cnpjTermo) && /\d/.test(cnpjTermo)

  return (empresa) => {
    if (!empresa) return false
    const nomes = [empresa.razao_social, empresa.nome_fantasia, empresa.name]
    if (nomes.some((n) => n && normalizeTexto(n).includes(texto))) return true
    return buscaCnpj && normalizeCnpj(empresa.cnpj).includes(cnpjTermo)
  }
}

/** Atalho para uma checagem avulsa. Em listas, prefira `criarMatchEmpresa`. */
export const matchEmpresa = (empresa, termo) => criarMatchEmpresa(termo)(empresa)

/** Filtra a lista mantendo a ordem original. */
export const filtrarEmpresas = (empresas, termo) => {
  const match = criarMatchEmpresa(termo)
  return (empresas || []).filter(match)
}
