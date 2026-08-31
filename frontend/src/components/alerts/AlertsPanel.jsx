import { useState, useEffect, useCallback } from 'react'
import { Bell, AlertTriangle, XCircle, DollarSign, ShieldAlert, RefreshCw, Clock } from 'lucide-react'
import { Button, LoadingButton, Spinner } from '@bhubai/bhub-design-system'
import { api } from '../../api/client'

const TYPE_CONFIG = {
  DIVERGENCIA_CRITICA: { icon: XCircle, color: 'text-destructive-text', bg: 'bg-destructive-subtle border-destructive-border', label: 'Divergencia Critica' },
  CONFIANCA_BAIXA: { icon: AlertTriangle, color: 'text-warning-text', bg: 'bg-warning-subtle border-warning-border', label: 'Confianca Baixa' },
  VALIDACAO_BLOQUEANTE: { icon: ShieldAlert, color: 'text-destructive-text', bg: 'bg-destructive-subtle border-destructive-border', label: 'Validacao Bloqueante' },
  IMPACTO_FINANCEIRO_ALTO: { icon: DollarSign, color: 'text-info-text', bg: 'bg-info-subtle border-info-border', label: 'Impacto Financeiro' },
}

const PAGE_SIZE = 50

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [limit, setLimit] = useState(PAGE_SIZE)

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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center text-muted-foreground">
        <Spinner size="lg" className="mr-2" />
        Carregando alertas...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive-subtle border border-destructive-border rounded-lg p-4 text-destructive-text text-sm">
          Erro ao carregar alertas: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-muted flex items-center justify-between -mx-6 -mt-6 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Alertas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats ? `${stats.total} alertas no total` : 'Carregando...'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats cards */}
      {stats && stats.by_type && Object.keys(stats.by_type).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(stats.by_type).map(([type, count]) => {
            const cfg = TYPE_CONFIG[type] || { icon: Bell, color: 'text-muted-foreground', bg: 'bg-muted border-border', label: type }
            const Icon = cfg.icon
            return (
              <div key={type} className={`${cfg.bg} rounded-lg p-3 border`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                  <span className="text-xs text-muted-foreground">{cfg.label}</span>
                </div>
                <p className={`text-2xl font-semibold mt-1 ${cfg.color}`}>{count}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum alerta recente</p>
          <p className="text-sm mt-1">Alertas aparecem apos a escrituracao detectar divergencias criticas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert, idx) => {
            const cfg = TYPE_CONFIG[alert.type] || { icon: Bell, color: 'text-muted-foreground', bg: 'bg-muted border-border', label: alert.type }
            const Icon = cfg.icon
            return (
              <div key={idx} className={`${cfg.bg} border rounded-lg p-4`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${cfg.color}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-xs text-muted-foreground">NF #{alert.invoice_id}</span>
                        {alert.company && (
                          <span className="text-xs text-muted-foreground">- {alert.company}</span>
                        )}
                      </div>
                      {/* Details */}
                      {alert.type === 'DIVERGENCIA_CRITICA' && alert.details && (
                        <ul className="mt-1 text-xs text-muted-foreground space-y-0.5">
                          {alert.details.map((d, i) => (
                            <li key={i}>
                              <span className="font-medium">{d.campo}:</span>{' '}
                              {d.emitente} → {d.sugerido}
                            </li>
                          ))}
                        </ul>
                      )}
                      {alert.type === 'CONFIANCA_BAIXA' && (
                        <p className="mt-1 text-xs text-muted-foreground">{alert.details}</p>
                      )}
                      {alert.type === 'IMPACTO_FINANCEIRO_ALTO' && (
                        <p className="mt-1 text-xs text-muted-foreground">{alert.details}</p>
                      )}
                      {alert.type === 'VALIDACAO_BLOQUEANTE' && Array.isArray(alert.details) && (
                        <ul className="mt-1 text-xs text-muted-foreground space-y-0.5">
                          {alert.details.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      )}
                      {alert.item_desc && (
                        <p className="mt-1 text-xs text-muted-foreground truncate max-w-md">
                          Item: {alert.item_desc}
                        </p>
                      )}
                    </div>
                  </div>
                  {alert.timestamp && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Load more */}
      {alerts.length > 0 && alerts.length >= limit && (
        <div className="flex justify-center">
          <LoadingButton
            variant="secondary"
            onClick={handleLoadMore}
            loading={loadingMore}
          >
            Carregar mais
          </LoadingButton>
        </div>
      )}

      {/* Slack/Email config hint */}
      <div className="bg-muted border border-border rounded-lg p-4 text-sm text-muted-foreground">
        <p className="font-medium mb-1">Configurar notificacoes externas:</p>
        <ul className="text-xs space-y-1 ml-4 list-disc">
          <li><code>ALERT_SLACK_WEBHOOK_URL</code> — Webhook do Slack para alertas em tempo real</li>
          <li><code>ALERT_EMAIL_TO</code> — Email para receber alertas criticos</li>
        </ul>
      </div>
    </div>
  )
}
