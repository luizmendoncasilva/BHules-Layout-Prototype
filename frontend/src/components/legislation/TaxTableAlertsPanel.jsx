import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, RefreshCw, AlertTriangle, Inbox } from 'lucide-react'
import {
  Button, Tooltip, TooltipTrigger, TooltipContent,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'

const TABLE_LABELS = {
  'irrf': 'IRRF — Tabela Progressiva',
  'inss': 'INSS — Salário de Contribuição',
  'salario-minimo': 'Salário Mínimo',
  'salario-familia': 'Salário Família',
  'fgts': 'FGTS',
  'irpj-csll': 'IRPJ/CSLL',
}

export default function TaxTableAlertsPanel() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [approving, setApproving] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [pendingApproval, setPendingApproval] = useState(null) // { table, competencia }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getTaxTablePendingAlerts()
      setAlerts(data.alerts || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (table, competencia) => {
    const key = `${table}:${competencia}`
    setApproving(key)
    setFeedback(null)
    try {
      const result = await api.approveTaxTable(table, competencia)
      setFeedback({
        kind: 'success',
        message: `Aprovado: ${TABLE_LABELS[table] || table} ${competencia}` +
          (result.retired ? ` (versão ${result.retired.competencia_inicio} encerrada)` : ''),
      })
      await load()
    } catch (e) {
      setFeedback({ kind: 'error', message: `Erro ao aprovar: ${e.message}` })
    } finally {
      setApproving(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="px-6 py-5 border-b border-border bg-muted flex items-center justify-between -mx-6 -mt-6 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Alertas de Tabelas Tributárias</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Atualizações detectadas no DOU aguardando aprovação
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {feedback && (
        <div className={`rounded-lg p-3 text-sm ${
          feedback.kind === 'success'
            ? 'bg-success-subtle border border-success-border text-success-text'
            : 'bg-destructive-subtle border border-destructive-border text-destructive-text'
        }`}>
          {feedback.message}
        </div>
      )}

      {error && (
        <div className="bg-destructive-subtle border border-destructive-border rounded-lg p-4 text-destructive-text text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Erro ao carregar alertas: {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          Carregando alertas...
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum alerta pendente</p>
          <p className="text-sm mt-1">
            Novas tabelas aparecem aqui quando o crawler do DOU detecta publicações relevantes
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tabela</TableHead>
              <TableHead>Competência</TableHead>
              <TableHead>Fonte</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => {
              const key = `${alert.table}:${alert.competencia_inicio}`
              const isApproving = approving === key
              return (
                <TableRow key={`${alert.table}-${alert.id}`}>
                  <TableCell className="font-medium text-foreground">
                    {TABLE_LABELS[alert.table] || alert.table}
                  </TableCell>
                  <TableCell className="font-mono">
                    {alert.competencia_inicio}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-md truncate">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate">{alert.fonte}</span>
                      </TooltipTrigger>
                      <TooltipContent>{alert.fonte}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setPendingApproval({ table: alert.table, competencia: alert.competencia_inicio })}
                      disabled={isApproving}
                    >
                      {isApproving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Aprovar
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={!!pendingApproval} onOpenChange={(open) => { if (!open) setPendingApproval(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Aprovar {pendingApproval ? (TABLE_LABELS[pendingApproval.table] || pendingApproval.table) : ''} para {pendingApproval?.competencia}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              A versão anterior será encerrada automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const { table, competencia } = pendingApproval
                setPendingApproval(null)
                handleApprove(table, competencia)
              }}
            >
              Aprovar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
