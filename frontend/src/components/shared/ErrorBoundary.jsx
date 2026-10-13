import { Component } from 'react'
import { Button } from '@bhubai/bhub-design-system'

/**
 * Error boundary global: um crash de renderização em QUALQUER painel não pode
 * derrubar o console inteiro (tela branca) — incidente 16/07: um TypeError no
 * BHubTaxDashboard (resposta parcial da API na janela de deploy) deixou a
 * operação sem acesso às notas. Mostra fallback com retry e preserva o resto
 * do app (Sidebar continua navegável quando o boundary envolve só o conteúdo).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary capturou crash de renderização:', error, info?.componentStack)
  }

  componentDidUpdate(prevProps) {
    // trocar de tela (view) limpa o erro — o usuário não fica preso no fallback
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-10 text-center">
          <div className="text-4xl">⚠️</div>
          <div className="text-lg font-semibold text-foreground">Algo deu errado nesta tela</div>
          <div className="text-sm text-muted-foreground max-w-md">
            O restante do sistema continua funcionando. Tente recarregar esta tela —
            se o problema persistir, acione o time de desenvolvimento com o horário do ocorrido.
          </div>
          <Button
            onClick={() => this.setState({ error: null })}
          >
            Recarregar tela
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
