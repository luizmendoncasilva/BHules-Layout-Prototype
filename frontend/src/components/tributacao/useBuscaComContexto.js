import { useCallback, useEffect, useRef, useState } from 'react'

const VAZIO = { dados: null, carregando: false, erro: null }

/**
 * Busca de uma fonte da tela (resumo, lista, por-CFOP) com guarda de requisição
 * (review #834): resposta de uma requisição superada — por outra busca, por troca
 * de contexto ou por um retorno antecipado (`ativo` falso) — é descartada. Cada
 * fonte tem o seu erro: o sucesso de uma não apaga o erro de outra.
 *
 * @param {() => Promise<any>} buscar
 * @param {any[]} deps - quando mudam, busca de novo
 * @param {{ativo?: boolean}} [opcoes] - falso: não busca e limpa (invalida a sequência)
 */
export function useBuscaComContexto(buscar, deps, { ativo = true } = {}) {
  const [estado, setEstado] = useState(VAZIO)
  const seq = useRef(0)

  const recarregar = useCallback(async () => {
    const minha = ++seq.current
    if (!ativo) {
      setEstado(VAZIO)
      return
    }
    setEstado((e) => ({ ...e, carregando: true, erro: null }))
    try {
      const dados = await buscar()
      if (minha === seq.current) setEstado({ dados, carregando: false, erro: null })
    } catch (err) {
      if (minha !== seq.current) return
      console.error('Erro ao carregar:', err)
      setEstado({ dados: null, carregando: false, erro: err?.message || 'Falha ao carregar.' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, ...deps])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  // Troca de contexto: invalida o que estiver em voo e zera a fonte.
  const limpar = useCallback(() => {
    seq.current += 1
    setEstado(VAZIO)
  }, [])

  return { ...estado, recarregar, limpar }
}
