/**
 * Utilitários de CNPJ — com suporte a CNPJ ALFANUMÉRICO (RFB jul/2026).
 *
 * A partir de julho de 2026 o CNPJ pode ser alfanumérico:
 * - 14 posições no total;
 * - posições 1–12: A–Z (maiúsculas) ou 0–9;
 * - posições 13–14 (dígitos verificadores): SEMPRE numéricas.
 *
 * CPF (11 dígitos) NÃO muda. As funções abaixo preservam letras — diferente de
 * `replace(/\D/g, '')`, que descartaria as letras do CNPJ alfanumérico.
 */

// Remove apenas máscara (ponto, barra, hífen, espaços) e normaliza p/ maiúsculas.
export const normalizeCnpj = (v) => (v ?? '').toString().replace(/[./\-\s]/g, '').toUpperCase()

/**
 * Formata um documento para exibição.
 * - 14 chars alfanuméricos → CNPJ `12.ABC.345/01DE-35`
 * - 11 dígitos → CPF `123.456.789-09`
 * - caso contrário, retorna o valor original.
 */
export const formatCnpj = (v) => {
  if (!v) return '-'
  const s = normalizeCnpj(v)
  if (s.length === 14) {
    // 12 primeiras posições alfanuméricas; DV (13–14) numérico.
    const m = s.match(/^([0-9A-Z]{2})([0-9A-Z]{3})([0-9A-Z]{3})([0-9A-Z]{4})(\d{2})$/)
    if (m) return `${m[1]}.${m[2]}.${m[3]}/${m[4]}-${m[5]}`
    return s
  }
  if (s.length === 11) {
    const m = s.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/)
    if (m) return `${m[1]}.${m[2]}.${m[3]}-${m[4]}`
    return s
  }
  return v
}
