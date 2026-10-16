import { useState, useEffect, useCallback, useMemo } from 'react'
import { Bell, RefreshCw, ArrowRight, ExternalLink, Mail } from 'lucide-react'
import { Badge, Button, LoadingButton, Spinner } from '@bhubai/bhub-design-system'
import { api } from '../../api/client'
import {
  TYPE_CONFIG, configDoAlerta, tempoRelativo, dataHoraCompleta, agruparPorPeriodo,
} from './alertConfig'

const PAGE_SIZE = 50

function DetalheDoAlerta({ alert }) {
  const d = alert.details
  if (alert.type === 'DIVERGENCIA_CRITICA' && Array.isArray(d)) {
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {d.map((x, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs">
            <span className="text-muted-foreground">{x.campo}</span>
            <span className="font-mono text-destructive-text line-through decoration-destructive-text/40">{x.emitente}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className="font-mono font-semibold text-foreground">{x.sugerido}</span>
          </span>
        ))}
      </div>
    )
  }
  if (Array.isArray(d)) {
    return (
      <ul className="mt-1.5 space-y-1 text-sm text-foreground">
        {d.map((x, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 size-1 rounded-full bg-muted-foreground shrink-0" />
            {x}
          </li>
        ))}
      </ul>
    )
  }
  return d ? <p className="mt-1 text-sm text-foreground">{d}</p> : null
}

export default function AlertsPanel({ onOpenInvoice }) {
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [filtro, setFiltro] = useState('TODOS')

  const load = useCallback(async (currentLimit, { silent } = {}) => {
    if (silent) setLoadingMore(true)
    else setLoading(true)
    setError(null)
    try {
      const [alertsData, statsData] = await Promise.all([
        api.getRecentAlerts(currentLimit),
        api.getAlertStats(),
      ])
      setAlerts(alertsData)
      setStats(statsData)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { load(PAGE_SIZE) }, [load])

  const handleLoadMore = () => {
    const nextLimit = limit + PAGE_SIZE
    setLimit(nextLimit)
    load(nextLimit, { silent: true })
  }

  const handleRefresh = () => {
    setLimit(PAGE_SIZE)
    load(PAGE_SIZE)
  }

  // Filtros = tipos com contagem, do mais grave para o menos grave.
  const tipos = useMemo(() => Object.entries(stats?.by_type || {})
    .sort(([a], [b]) => configDoAlerta(a).order - configDoAlerta(b).order), [stats])

  const visiveis = filtro === 'TODOS' ? alerts : alerts.filter((a) => a.type === filtro)
  const grupos = agruparPorPeriodo(visiveis)

  return (
    <div className="flex flex-col min-h-0 max-h-[85vh]">
      {/* Cabeçalho fixo — pr-12 deixa espaço para o X do Dialog */}
      <div className="px-6 pt-5 pb-4 pr-12 border-b border-border space-y-4 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Alertas do motor</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {stats ? `${stats.total} ${stats.total === 1 ? 'alerta' : 'alertas'} nas notas processadas` : 'Carregando...'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {tipos.length > 0 && (
          <div role="tablist" aria-label="Filtrar por tipo" className="flex flex-wrap gap-2">
            {[['TODOS', stats.total], ...tipos].map(([type, n]) => {
              const ativo = filtro === type
              const cfg = type === 'TODOS' ? null : configDoAlerta(type)
              const Icon = cfg?.icon
              return (
                <button
                  key={type}
                  role="tab"
                  aria-selected={ativo}
                  onClick={() => setFiltro(type)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    ativo
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-card text-foreground hover:bg-muted'
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${ativo ? '' : cfg.text}`} />}
                  {cfg ? cfg.label : 'Todos'}
                  <span className={`tabular-nums ${ativo ? 'opacity-80' : 'text-muted-foreground'}`}>{n}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Lista rolável */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="py-12 flex items-center justify-center text-muted-foreground text-sm">
            <Spinner size="lg" className="mr-2" />
            Carregando alertas...
          </div>
        ) : error ? (
          <div role="alert" className="bg-destructive-subtle border border-destructive-border rounded-lg p-4 text-destructive-text text-sm flex items-center justify-between gap-3">
            <span>Não foi possível carregar os alertas: {error}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>Tentar de novo</Button>
          </div>
        ) : grupos.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">Nenhum alerta {filtro === 'TODOS' ? 'recente' : 'deste tipo'}</p>
            <p className="text-xs text-muted-foreground mt-1">Os alertas aparecem quando a escrituração encontra divergências críticas.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grupos.map((g) => (
              <section key={g.id}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{g.label}</h3>
                <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                  {g.itens.map((alert, idx) => {
                    const cfg = configDoAlerta(alert.type)
                    const Icon = cfg.icon
                    return (
                      <li key={`${alert.invoice_id}-${alert.timestamp}-${idx}`} className="group flex gap-3 p-4 hover:bg-muted/50 transition-colors">
                        <div className={`size-8 rounded-md flex items-center justify-center shrink-0 ${cfg.chip}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                            <p className="text-sm">
                              <span className={`font-semibold ${cfg.text}`}>{cfg.label}</span>
                              <span className="text-muted-foreground"> · NF {alert.num_doc || `#${alert.invoice_id}`}</span>
                            </p>
                            <time
                              dateTime={alert.timestamp}
                              title={dataHoraCompleta(alert.timestamp)}
                              className="text-xs text-muted-foreground whitespace-nowrap"
                            >
                              {tempoRelativo(alert.timestamp)}
                            </time>
                          </div>
                          {alert.company && <p className="text-xs text-muted-foreground truncate">{alert.company}</p>}

                          <DetalheDoAlerta alert={alert} />

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            {alert.item_desc ? (
                              <Badge variant="outline" className="max-w-full truncate font-normal">Item: {alert.item_desc}</Badge>
                            ) : <span />}
                            {onOpenInvoice && (
                              <Button
                                variant="ghost"
                                size="xs"
                                className="text-primary"
                                onClick={() => onOpenInvoice(alert.invoice_id)}
                              >
                                Abrir nota <ExternalLink className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}

            {alerts.length >= limit && (
              <div className="flex justify-center">
                <LoadingButton variant="secondary" onClick={handleLoadMore} loading={loadingMore}>
                  Carregar mais
                </LoadingButton>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rodapé: para onde os alertas também vão */}
      <div className="px-6 py-3 border-t border-border bg-muted text-xs text-muted-foreground flex items-center gap-2 shrink-0">
        <Mail className="w-3.5 h-3.5 shrink-0" />
        <span>Alertas críticos também são enviados por e-mail para a Célula Fiscal.</span>
      </div>
    </div>
  )
}

export { TYPE_CONFIG }
