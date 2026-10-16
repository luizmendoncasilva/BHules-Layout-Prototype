import React, { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
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
  '1': 'Matriz no exterior',
  '2': 'Filial ou sucursal no exterior',
  '3': 'Coligada no exterior',
  '4': 'Controladora no exterior',
  '5': 'Controlada no exterior',
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

// Destinatário pode vir como { destino, canal } (alerta_destinatario) ou só o
// endereço — o canal, nesse caso, é deduzido (e-mail se tiver @).
function normalizarDestinatario(d) {
  if (!d) return null
  if (typeof d === 'string') return { destino: d, canal: 'EMAIL' }
  const destino = d.destino || d.email || d.endereco
  if (!destino) return null
  return { destino, canal: (d.canal || 'EMAIL').toUpperCase() }
}

const TH = 'px-4 py-2.5 h-auto text-xs font-semibold uppercase tracking-wider text-muted-foreground'

export function AlertaVinculoCard({
  alertas = [],
  companyId,
  onMarcarCiente,
  loading = false,
}) {
  const [markingId, setMarkingId] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  // Abertos primeiro; dentro de cada grupo, competência mais recente no topo.
  const ordenados = useMemo(
    () => [...(alertas || [])].sort((a, b) =>
      (a.status === 'ABERTO' ? 0 : 1) - (b.status === 'ABERTO' ? 0 : 1)
      || String(b.competencia).localeCompare(String(a.competencia))),
    [alertas],
  )

  if (!alertas || alertas.length === 0) {
    return null
  }

  const abertos = alertas.filter((a) => a.status === 'ABERTO').length

  // "Sem dono" = nenhum alerta_destinatario vivo do tipo EXPORTACAO_VINCULO_SOCIETARIO
  // (design §5.6). O nome do destinatário é a pendência P-Q6 da Célula.
  const temAlertaSemDono = alertas.some((a) => !a.dono_configurado)
  const destinatarios = (alertas.find((a) => a.dono_configurado)?.destinatarios || [])
    .map(normalizarDestinatario)
    .filter(Boolean)

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
    <Card padding="none" className={`gap-0 overflow-hidden ${abertos > 0 ? 'border-l-4 border-l-warning' : ''}`}>
      {/* Cabeçalho — mesmo padrão dos demais cards da aba (ex.: Revisões de exportação) */}
      <div className="px-6 py-4 bg-muted border-b border-border flex items-center gap-2.5">
        <div className="p-2 bg-warning-subtle text-warning-text rounded-md">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Vínculo societário no exterior
            </h3>
            {abertos > 0 ? (
              <Badge variant="warning">{abertos} aguardando ciência</Badge>
            ) : (
              <Badge variant="success">Todos cientes</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Prestações a partes vinculadas (vincPrest 1–5): afetam preço de transferência e a desoneração da exportação
          </p>
        </div>
      </div>

      {/* Quem é avisado. Na v1 o alerta é só tela + métrica (dono:sem_dono) quando
          não há destinatário vivo para EXPORTACAO_VINCULO_SOCIETARIO. */}
      {temAlertaSemDono ? (
        <div className="mx-6 mt-4 p-3 bg-destructive-subtle border border-destructive-border rounded-md flex items-start gap-2.5 text-xs text-destructive-text">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
          <div>
            <p className="font-semibold">Ninguém está recebendo este alerta</p>
            <p className="mt-0.5">
              Falta indicar o responsável na Célula (pendência Q6). Até lá o alerta aparece só aqui e conta na métrica{' '}
              <code className="font-mono">dono:sem_dono</code>.
            </p>
          </div>
        </div>
      ) : destinatarios.length > 0 && (
        <div className="px-6 pt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground font-medium">Notificados:</span>
          {destinatarios.map((d) => (
            <span
              key={`${d.canal}-${d.destino}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-foreground"
              title="E-mail"
            >
              <Mail className="w-3 h-3 text-muted-foreground" />
              {d.destino}
            </span>
          ))}
        </div>
      )}

      {errorMsg && (
        <div role="alert" className="mx-6 mt-3 p-3 bg-destructive-subtle border border-destructive-border text-destructive-text rounded-md text-xs">
          {errorMsg}
        </div>
      )}

      {/* Ocorrências por competência */}
      <div className="p-6">
        <div className="border border-border rounded-md overflow-hidden">
          <Table className="text-left text-xs bg-card">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead scope="col" className={TH}>Competência</TableHead>
                <TableHead scope="col" className={TH}>Vínculo detectado</TableHead>
                <TableHead scope="col" className={`${TH} text-right`}>Notas</TableHead>
                <TableHead scope="col" className={TH}>Situação</TableHead>
                <TableHead scope="col" className={`${TH} text-right`}>
                  <span className="sr-only">Ação</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenados.map((alerta) => {
                const isAberto = alerta.status === 'ABERTO'
                const isMarking = markingId === alerta.id

                return (
                  <TableRow key={alerta.id} className="align-top">
                    <TableCell className="px-4 py-3 whitespace-nowrap font-medium text-foreground">
                      {formatCompetenciaDisplay(alerta.competencia)}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal">
                      {alerta.valores_vinc_prest && alerta.valores_vinc_prest.length > 0 ? (
                        <ul className="space-y-1">
                          {alerta.valores_vinc_prest.map((v) => (
                            <li key={v} className="flex items-center gap-2 text-foreground">
                              <span className="inline-flex items-center justify-center size-5 rounded bg-muted font-mono text-[11px] font-semibold text-muted-foreground">
                                {v}
                              </span>
                              {VINC_PREST_MAP[v] || `Código ${v}`}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground italic">Não especificado</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap text-right font-semibold tabular-nums text-foreground">
                      {alerta.qtd_notas}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      {isAberto ? (
                        <Badge variant="warning">
                          <Clock className="w-3 h-3" /> Aguardando ciência
                        </Badge>
                      ) : (
                        <div className="space-y-0.5">
                          <Badge variant="success">
                            <CheckCircle2 className="w-3 h-3" /> Ciente
                          </Badge>
                          <div className="text-[11px] text-muted-foreground">
                            {alerta.ciente_por || '—'} · {formatDate(alerta.ciente_em)}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap text-right">
                      {isAberto && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarcarCiente(alerta.id)}
                          disabled={isMarking || loading}
                        >
                          {isMarking
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {isMarking ? 'Gravando...' : 'Marcar ciente'}
                        </Button>
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
