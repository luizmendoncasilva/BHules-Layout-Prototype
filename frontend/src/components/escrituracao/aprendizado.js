// "Corrigir aprendizado" (PQC-10, Q2 Célula 25/09): texto do resumo por item
// da resposta de POST /escrituracao/{id}/corrigir-aprendizado, usado no banner
// do cabeçalho (DetailView) e da aba Escrituração (EscrituracaoTab).

const ACAO_TRATAMENTO = {
  CRIADO: 'tratamento auditado gravado',
  ATUALIZADO: 'tratamento auditado atualizado',
  IGNORADO_SEM_CHAVE: 'sem chave (item sem CFOP do emitente ou finalidade de operação): tratamento não gravado',
  ERRO: 'tratamento não gravado (erro)',
}

export function resumoAprendizado(res, sugestoes = []) {
  const porItem = new Map((sugestoes || []).map(s => [s.invoice_item_id, s]))
  const linhas = (res?.itens || []).map(it => {
    const s = porItem.get(it.invoice_item_id)
    const nome = s?.descricao || `Item #${it.invoice_item_id}`
    const prec = it.precedente?.linhas_revogadas
      ? `precedente revogado (${it.precedente.linhas_revogadas})`
      : (it.precedente?.ja_revogado ? 'precedente já estava revogado' : 'sem precedente')
    const trat = ACAO_TRATAMENTO[it.tratamento?.acao] || it.tratamento?.acao || '-'
    return `${nome}: ${prec} · ${trat}`
  })
  if (res?.raio?.notas) linhas.push(`${res.raio.notas} nota(s) não enviada(s) reenfileirada(s) para reanálise (sem publicar).`)
  return linhas
}
