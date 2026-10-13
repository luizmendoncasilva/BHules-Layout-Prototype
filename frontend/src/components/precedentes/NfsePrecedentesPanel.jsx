// frontend/src/components/precedentes/NfsePrecedentesPanel.jsx
import { useQuery } from '@tanstack/react-query'
import { X, Loader2, AlertTriangle, Scale, RotateCcw, CheckCircle2 } from 'lucide-react'
import { api } from '../../api/client'
import { formatCnpj } from '../../utils/cnpj'
import { Badge, Button, Card, IconButton } from '@bhubai/bhub-design-system'

/**
 * Painel (modal) com os precedentes NFS-e v2 vigentes/revogados de um
 * prestador — aberto a partir do badge "PRECEDENTE" na aba de retenções
 * (U1, item 2 do task UI). Lista via `GET /nfse/precedentes` (proxy já
 * existente); a revogação em si é delegada ao `RevokeNfsePrecedenteModal`
 * (o parent controla o target e o abre por cima deste painel).
 *
 * Props:
 * - `open`: boolean — controla visibilidade.
 * - `companyId`, `prestadorCnpj`: filtro da listagem.
 * - `highlightPrecedenteId`: id extraído da regra NFSE-GT-001 (o precedente
 *   efetivamente aplicado nesta nota) — realçado na lista.
 * - `canRevogar`: role-gate (mesmo mecanismo do NF-e — `useHasRole` no caller).
 * - `onClose`, `onRevogar(precedente)`.
 */
export default function NfsePrecedentesPanel({
  open,
  onClose,
  companyId,
  prestadorCnpj,
  highlightPrecedenteId,
  canRevogar = false,
  onRevogar,
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['nfsePrecedentes', companyId, prestadorCnpj],
    queryFn: () => api.nfsePrecedentesList(companyId, prestadorCnpj),
    enabled: open && !!companyId,
  })

  if (!open) return null

  const precedentes = data?.precedentes || []

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        padding="none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nfse-precedentes-panel-title"
        className="gap-0 shadow-2xl w-[640px] max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning-subtle flex items-center justify-center">
              <Scale className="w-4 h-4 text-warning-text" />
            </div>
            <div>
              <h3 id="nfse-precedentes-panel-title" className="text-base font-semibold text-foreground">
                Precedentes NFS-e do prestador
              </h3>
              {prestadorCnpj && (
                <p className="text-xs text-muted-foreground font-mono">{formatCnpj(prestadorCnpj)}</p>
              )}
            </div>
          </div>
          <IconButton
            onClick={onClose}
            aria-label="Fechar"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </IconButton>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-2">
          {isLoading && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando precedentes…
            </div>
          )}

          {isError && (
            <div className="flex items-start gap-3 bg-destructive-subtle border border-destructive-border rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 text-destructive-text mt-0.5" />
              <p className="text-sm text-foreground">
                Não foi possível carregar os precedentes agora. Tente novamente mais tarde.
              </p>
            </div>
          )}

          {!isLoading && !isError && precedentes.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">
              Nenhum precedente encontrado para este prestador.
            </p>
          )}

          {!isLoading && !isError && precedentes.map((p) => {
            const isHighlighted = highlightPrecedenteId != null && p.id === highlightPrecedenteId
            return (
              <div
                key={p.id}
                className={`border rounded-lg p-3 ${
                  isHighlighted ? 'border-warning-border bg-warning-subtle' : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">#{p.id}</span>
                      {isHighlighted && (
                        <Badge variant="warning" className="px-1.5 text-[10px] font-semibold">
                          Aplicado nesta nota
                        </Badge>
                      )}
                      {p.vigente ? (
                        <Badge variant="success" className="px-1.5 text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Vigente
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="px-1.5 text-[10px] font-semibold">
                          {p.revogado_em ? 'Revogado' : 'Substituído'}
                        </Badge>
                      )}
                    </div>
                    <div className="text-foreground">
                      Código LC 116: <span className="font-mono text-foreground">{p.codigo_servico_lc116 || '-'}</span>
                      {p.municipio_ibge && (
                        <span className="text-muted-foreground"> · Município IBGE {p.municipio_ibge}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.confidence != null && <span>Confiança: {(p.confidence * 100).toFixed(0)}% · </span>}
                      Criado por {p.criado_por || 'desconhecido'}
                      {p.revogado_em && <span> · Revogado em {new Date(p.revogado_em).toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </div>
                  {canRevogar && p.vigente && (
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => onRevogar?.(p)}
                      title="Revogar este precedente — reenfileira as notas que o usaram para reprocesso."
                      className="shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Revogar
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-6 py-3 border-t border-border bg-muted flex justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            Fechar
          </Button>
        </div>
      </Card>
    </div>
  )
}
