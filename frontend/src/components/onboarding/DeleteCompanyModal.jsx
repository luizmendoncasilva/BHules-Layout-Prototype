// frontend/src/components/onboarding/DeleteCompanyModal.jsx
import { useState, useEffect, useMemo } from 'react'
import { Trash2, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, LinkButton,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'
import { normalizeCnpj } from '../../utils/cnpj'

/**
 * Modal de hard-delete da empresa.
 *
 * Estados: LOADING_PREVIEW → CONFIRM → DELETING → DONE | FAILED.
 *
 * - `company`: objeto da empresa selecionada (null = modal fechado)
 * - `onClose`: chamado em cancelar/fechar (sem mudar a lista do parent)
 * - `onDeleted`: chamado após sucesso (parent deve refetch a lista)
 */
export default function DeleteCompanyModal({ company, onClose, onDeleted }) {
  const [phase, setPhase] = useState('LOADING_PREVIEW')
  const [preview, setPreview] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [cnpjInput, setCnpjInput] = useState('')
  const [result, setResult] = useState(null)

  // Reset state quando o modal abre numa nova empresa
  useEffect(() => {
    if (!company) return
    setPhase('LOADING_PREVIEW')
    setPreview(null)
    setErrorMsg('')
    setCnpjInput('')
    setResult(null)

    let cancelled = false
    api.getCompanyDeletePreview(company.id)
      .then((data) => { if (!cancelled) { setPreview(data); setPhase('CONFIRM') } })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(err?.message || 'Falha ao carregar preview')
          setPhase('FAILED')
        }
      })
    return () => { cancelled = true }
  }, [company])

  // CNPJ alfanumérico (RFB jul/2026): normaliza preservando letras p/ comparar.
  const expectedDigits = useMemo(
    () => normalizeCnpj(company?.cnpj || ''),
    [company],
  )
  const inputDigits = useMemo(
    () => normalizeCnpj(cnpjInput),
    [cnpjInput],
  )
  const cnpjMatches = expectedDigits && expectedDigits === inputDigits

  const handleConfirm = async () => {
    if (!cnpjMatches) return
    setPhase('DELETING')
    setErrorMsg('')
    try {
      const data = await api.deleteCompany(company.id, cnpjInput)
      setResult(data)
      setPhase('DONE')
    } catch (err) {
      setErrorMsg(err?.message || 'Erro na exclusão')
      setPhase('FAILED')
    }
  }

  if (!company) return null

  const isDeleting = phase === 'DELETING'

  return (
    <Dialog open={!!company} onOpenChange={(open) => { if (!open && !isDeleting) onClose() }}>
      <DialogContent
        className="sm:max-w-lg"
        showCloseButton={!isDeleting}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => { if (isDeleting) e.preventDefault() }}
      >
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-destructive-subtle flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4 text-destructive-text" />
            </div>
            <div>
              <DialogTitle>Excluir Empresa e Apagar Dados</DialogTitle>
              <p className="text-xs text-destructive-text font-medium">
                Esta ação é IRREVERSÍVEL.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Body — max-h-[60vh] é intencional: limita a área de scroll a uma fração da
            altura de viewport (não um valor de design token) para o conteúdo variável
            do preview de exclusão dentro do Dialog. */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <p className="text-sm font-semibold text-foreground">{company.razao_social}</p>
            <p className="text-xs text-muted-foreground font-mono">{formatCnpj(company.cnpj)}</p>
          </div>

          {phase === 'LOADING_PREVIEW' && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando preview dos dados que serão apagados…
            </div>
          )}

          {(phase === 'CONFIRM' || phase === 'DELETING') && preview && (
            <PreviewBody preview={preview} />
          )}

          {phase === 'CONFIRM' && (
            <div>
              <Label htmlFor="delete-confirm-cnpj" className="block text-xs font-medium text-foreground mb-1.5">
                Para confirmar, digite o CNPJ:
              </Label>
              <Input
                id="delete-confirm-cnpj"
                type="text"
                value={cnpjInput}
                onChange={(e) => setCnpjInput(e.target.value)}
                placeholder={formatCnpj(company.cnpj)}
                className="font-mono border-destructive-border focus-visible:border-destructive focus-visible:ring-destructive/20"
                autoFocus
              />
              {cnpjInput && !cnpjMatches && (
                <p className="text-xs text-destructive-text mt-1">CNPJ não bate.</p>
              )}
            </div>
          )}

          {phase === 'DELETING' && (
            <div className="flex items-center gap-3 text-sm text-foreground bg-warning-subtle border border-warning-border rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin text-warning-text" />
              Apagando… <strong>não feche</strong>, exclusão em andamento.
            </div>
          )}

          {phase === 'DONE' && result && (
            <div className="flex items-start gap-3 bg-success-subtle border border-success-border rounded-lg p-3">
              <CheckCircle2 className="w-5 h-5 text-success-text mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-medium text-success-text">Empresa apagada.</p>
                <p className="text-muted-foreground mt-1">
                  <strong>{result.total_deleted.toLocaleString('pt-BR')}</strong> registros
                  removidos em {result.duration_seconds}s.
                </p>
              </div>
            </div>
          )}

          {phase === 'FAILED' && (
            <div className="flex items-start gap-3 bg-destructive-subtle border border-destructive-border rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 text-destructive-text mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-medium text-destructive-text">Erro</p>
                <p className="text-muted-foreground mt-1">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter>
          {phase === 'CONFIRM' && (
            <>
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleConfirm} disabled={!cnpjMatches}>
                <Trash2 className="w-4 h-4" /> Excluir
              </Button>
            </>
          )}
          {phase === 'DONE' && (
            <Button onClick={() => onDeleted?.()}>
              Fechar
            </Button>
          )}
          {phase === 'FAILED' && (
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PreviewBody({ preview }) {
  const [showAll, setShowAll] = useState(false)
  const parents = Object.entries(preview.parents || {}).filter(([k]) => k !== 'companies')
  const childrenEntries = Object.entries(preview.children || {})
    .sort((a, b) => b[1] - a[1])
  const topChildren = childrenEntries.slice(0, 5)
  const restChildren = childrenEntries.slice(5)

  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vai apagar</p>
        <ul className="mt-1.5 space-y-1">
          {parents.map(([k, n]) => (
            <li key={k} className="flex justify-between">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-mono text-foreground">{n.toLocaleString('pt-BR')}</span>
            </li>
          ))}
        </ul>
      </div>

      {childrenEntries.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Dados de análise/treino que vão sumir
          </p>
          <ul className="mt-1.5 space-y-1">
            {(showAll ? childrenEntries : topChildren).map(([k, n]) => (
              <li key={k} className="flex justify-between">
                <span className="text-muted-foreground truncate pr-2">{k}</span>
                <span className="font-mono text-foreground shrink-0">{n.toLocaleString('pt-BR')}</span>
              </li>
            ))}
          </ul>
          {restChildren.length > 0 && !showAll && (
            <LinkButton
              onClick={() => setShowAll(true)}
              className="text-xs mt-1"
            >
              Ver todas ({restChildren.length} a mais)
            </LinkButton>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-border flex justify-between">
        <span className="text-sm font-medium text-foreground">Total</span>
        <span className="text-sm font-semibold text-foreground font-mono">
          {preview.total_rows.toLocaleString('pt-BR')} registros
        </span>
      </div>
    </div>
  )
}

function formatCnpj(cnpj) {
  // CNPJ alfanumérico (RFB jul/2026): normalizeCnpj preserva letras.
  if (!cnpj) return '—'
  const digits = normalizeCnpj(cnpj)
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
  }
  return cnpj
}
