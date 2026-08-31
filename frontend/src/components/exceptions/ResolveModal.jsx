import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Textarea, Label, RadioGroup, RadioGroupItem,
} from '@bhubai/bhub-design-system'

const RESOLUTIONS = [
  { value: 'CORRIGIR', label: 'Corrigir', desc: 'Corrigir a escrituração com os valores corretos' },
  { value: 'APROVAR_OVERRIDE', label: 'Aprovar Override', desc: 'Aceitar o valor original com justificativa' },
  { value: 'BLOQUEAR_CONFIRMADO', label: 'Confirmar Bloqueio', desc: 'Confirmar que o item deve ser bloqueado' },
  { value: 'DEVOLVER_FORNECEDOR', label: 'Devolver ao Fornecedor', desc: 'Solicitar correção ao emitente da NF' },
]

export default function ResolveModal({ item, onClose, onResolve }) {
  const [resolucao, setResolucao] = useState('')
  const [justificativa, setJustificativa] = useState('')
  const [analista, setAnalista] = useState(item.analista_responsavel || '')
  const [overrideAprovador, setOverrideAprovador] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!resolucao || !justificativa || !analista) return
    if (resolucao === 'APROVAR_OVERRIDE' && !overrideAprovador) return

    setSubmitting(true)
    try {
      await onResolve({
        resolucao,
        justificativa,
        analista,
        override_aprovador: resolucao === 'APROVAR_OVERRIDE' ? overrideAprovador : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>Resolver Exceção #{item.id}</DialogTitle>
        </DialogHeader>

        {/* max-h em vh: caso de viewport (não de token de cor/tipografia) — o
            DS não expõe um equivalente de altura máxima para conteúdo rolável
            de Dialog, então mantemos o cálculo relativo à viewport aqui. */}
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {/* Context */}
          <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">{item.descricao}</p>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>NF #{item.invoice_id}</span>
              {item.tipo_excecao && <span>{item.tipo_excecao}</span>}
              {item.severity && <span>{item.severity}</span>}
            </div>
          </div>

          {/* Resolution type */}
          <div>
            <Label className="block mb-2">Resolução</Label>
            <RadioGroup value={resolucao} onValueChange={setResolucao} className="gap-2">
              {RESOLUTIONS.map((r) => (
                <label
                  key={r.value}
                  onClick={() => setResolucao(r.value)}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    resolucao === r.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-input'
                  }`}
                >
                  <RadioGroupItem value={r.value} className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">{r.label}</div>
                    <div className="text-xs text-muted-foreground">{r.desc}</div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Analyst */}
          <div>
            <Label htmlFor="resolve-analista" className="block mb-1">Analista responsável</Label>
            <Input
              id="resolve-analista"
              type="text"
              value={analista}
              onChange={(e) => setAnalista(e.target.value)}
              placeholder="Nome do analista"
              required
            />
          </div>

          {/* Override approver (conditional) */}
          {resolucao === 'APROVAR_OVERRIDE' && (
            <div>
              <Label htmlFor="resolve-override-aprovador" className="block mb-1">Aprovador do override (segunda aprovação)</Label>
              <Input
                id="resolve-override-aprovador"
                type="text"
                value={overrideAprovador}
                onChange={(e) => setOverrideAprovador(e.target.value)}
                placeholder="Nome do aprovador"
                required
              />
            </div>
          )}

          {/* Justification */}
          <div>
            <Label htmlFor="resolve-justificativa" className="block mb-1">Justificativa</Label>
            <Textarea
              id="resolve-justificativa"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Descreva a justificativa para esta resolução..."
              rows={3}
              className="resize-none"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !resolucao || !justificativa || !analista}>
              {submitting ? 'Resolvendo...' : 'Resolver'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
