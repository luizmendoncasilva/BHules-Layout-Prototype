import React, { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Users,
  Clock,
  UserCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@bhubai/bhub-design-system'

const VINC_PREST_MAP = {
  '1': '1 - Matriz no exterior',
  '2': '2 - Filial ou Sucursal no exterior',
  '3': '3 - Coligada no exterior',
  '4': '4 - Controladora no exterior',
  '5': '5 - Controlada no exterior',
}

function formatCompetenciaDisplay(comp) {
  if (!comp) return '—'
  const s = String(comp).replace(/[-/]/g, '').trim()
  if (s.length >= 6) {
    return `${s.slice(4, 6)}/${s.slice(0, 4)}`
  }
  return comp
}

function formatDate(isoStr) {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(isoStr)
  }
}

export function AlertaVinculoCard({
  alertas = [],
  companyId,
  onMarcarCiente,
  loading = false,
}) {
  const [markingId, setMarkingId] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  if (!alertas || alertas.length === 0) {
    return null
  }

  // "Sem dono" = nenhum alerta_destinatario vivo do tipo EXPORTACAO_VINCULO_SOCIETARIO
  // (design §5.6). O nome do destinatário é a pendência P-Q6 da Célula.
  const temAlertaSemDono = alertas.some((a) => !a.dono_configurado)
  const destinatarios = alertas.find((a) => a.dono_configurado)?.destinatarios || []

  const handleMarcarCiente = async (alertaId) => {
    setMarkingId(alertaId)
    setErrorMsg(null)
    try {
      await onMarcarCiente(alertaId)
    } catch (err) {
      console.error('Erro ao marcar ciência:', err)
      setErrorMsg(err.message || 'Falha ao confirmar ciência no alerta.')
    } finally {
      setMarkingId(null)
    }
  }

  return (
    <Card padding="none" className="gap-0 border-warning-border overflow-hidden mb-6">
      {/* Cabeçalho do Card */}
      <div className="px-6 py-4 bg-warning-subtle border-b border-warning-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-warning-subtle text-warning-text rounded-md">
            <ShieldAlert className="w-5 h-5 text-warning-text" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-warning-text">
                Alertas de Vínculo Societário (vincPrest 1–5)
              </h3>
              <Badge variant="warning">
                {alertas.length} {alertas.length === 1 ? 'ocorrência' : 'ocorrências'}
              </Badge>
            </div>
            <p className="text-xs text-warning-text mt-0.5">
              Identificação de prestação entre partes vinculadas no exterior (preço de transferência e desoneração condicionada)
            </p>
          </div>
        </div>
      </div>

      {/* Selo "sem dono": nenhum destinatário vivo para EXPORTACAO_VINCULO_SOCIETARIO.
          Na v1 o alerta é só tela + métrica (dono:sem_dono); não há canal de saída. */}
      {temAlertaSemDono ? (
        <div className="mx-6 mt-4 p-3.5 bg-destructive-subtle border border-destructive-border rounded-md flex items-start gap-2.5 text-xs text-destructive-text">
          <AlertTriangle className="w-4 h-4 text-destructive-text shrink-0 mt-0.5" />
          <div>
            <Badge variant="destructive" className="mr-1.5">
              sem dono (Q6 pendente)
            </Badge>
            Nenhum destinatário configurado para alertas de vínculo societário. O alerta fica visível aqui
            e é contado na métrica como <code className="font-mono">dono:sem_dono</code> até a Célula
            indicar o responsável (pendência Q6).
          </div>
        </div>
      ) : (
        <div className="mx-6 mt-4 p-3 bg-muted border border-border rounded-md text-xs text-foreground flex items-start gap-2">
          <Users className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Quem deveria receber:</strong>{' '}
            {destinatarios.map((d) => `${d.destino} (${d.canal})`).join(', ')}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mx-6 mt-3 p-3 bg-destructive-subtle border border-destructive-border text-destructive-text rounded-md text-xs">
          {errorMsg}
        </div>
      )}

      {/* Tabela de Alertas */}
      <div className="p-6">
        <div className="overflow-x-auto border border-border rounded-md">
          <Table className="text-left text-xs bg-card">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead scope="col" className="px-4 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Competência</TableHead>
                <TableHead scope="col" className="px-4 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Vínculo(s) Detectado(s)</TableHead>
                <TableHead scope="col" className="px-3 py-3 h-auto text-center font-semibold uppercase tracking-wider text-muted-foreground">Qtd. Notas</TableHead>
                <TableHead scope="col" className="px-4 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead scope="col" className="px-4 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Ciência / Responsável</TableHead>
                <TableHead scope="col" className="px-4 py-3 h-auto text-right font-semibold uppercase tracking-wider text-muted-foreground">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertas.map((alerta) => {
                const isAberto = alerta.status === 'ABERTO'
                const isMarking = markingId === alerta.id

                return (
                  <TableRow key={alerta.id} className="hover:bg-warning-subtle transition-colors">
                    <TableCell className="px-4 py-3 whitespace-nowrap font-medium text-foreground">
                      {formatCompetenciaDisplay(alerta.competencia)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {alerta.valores_vinc_prest && alerta.valores_vinc_prest.length > 0 ? (
                          alerta.valores_vinc_prest.map((v) => (
                            <Badge key={v} variant="warning">
                              {VINC_PREST_MAP[v] || `Código ${v}`}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground italic">Não especificado</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 whitespace-nowrap text-center font-semibold text-foreground">
                      {alerta.qtd_notas}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      {isAberto ? (
                        <Badge variant="warning">
                          <Clock className="w-3 h-3" />
                          Aberto
                        </Badge>
                      ) : (
                        <Badge variant="success">
                          <CheckCircle2 className="w-3 h-3" />
                          Ciente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {alerta.ciente_por ? (
                        <div>
                          <div className="flex items-center gap-1 font-medium text-foreground">
                            <UserCheck className="w-3.5 h-3.5 text-success-text" />
                            <span>{alerta.ciente_por}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {formatDate(alerta.ciente_em)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Aguardando confirmação</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap text-right">
                      {isAberto ? (
                        <Button
                          type="button"
                          variant="warning"
                          size="sm"
                          onClick={() => handleMarcarCiente(alerta.id)}
                          disabled={isMarking || loading}
                        >
                          {isMarking ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Gravando...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Marcar ciente</span>
                            </>
                          )}
                        </Button>
                      ) : (
                        <span className="text-xs text-success-text font-medium flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  )
}

export default AlertaVinculoCard
