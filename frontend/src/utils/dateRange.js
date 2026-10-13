/**
 * Faixa de datas padrão do painel — dia 1 do mês corrente até hoje.
 *
 * Célula 24/09 item 3.3 (S24-11, D-24.3): antes era "3 meses atrás, dia 1"
 * (em setembro dava 01/06) e o fim usava `toISOString()` (UTC) — depois das
 * 21h BRT o "hoje" virava amanhã. Aqui tudo é calculado em horário LOCAL.
 *
 * Usada pelo estado compartilhado do `App.jsx` (Lista + Análise em Lote) e
 * pela cópia local do `ListView`. `NotasIntegradas` e `BHubTaxDashboard` têm
 * janela própria e ficam como estão.
 */

function toLocalIsoDate(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function getMesCorrenteRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return { startDate: toLocalIsoDate(start), endDate: toLocalIsoDate(now) }
}
