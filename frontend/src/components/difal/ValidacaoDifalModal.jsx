import { useState } from 'react'
import {
  Button, Checkbox, Input, Textarea, Label, RadioGroup, RadioGroupItem,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@bhubai/bhub-design-system'

// Modal de veredito RN-25 (DV5-01, T8) — item único ou lote. Mesma casca do
// ResolveModal da fila de exceções. O autor NÃO é campo: o backend usa o JWT.
//
// Props:
//   itens        — 1 item (modo unitário) ou N itens (lote) da fila
//   onSubmit     — ({ estado, valor_conferido, motivo, usar_valor_calculado }) => Promise
//   resultados   — [{ item_result_id, status, detalhe }] do lote, para mostrar
//                  quem já validou (409) e o que não foi gravado
//   erro         — mensagem de falha da chamada (engine fora, 503…)

const ESTADOS = [
  { value: 'VALIDADO', label: 'Validar', desc: 'O valor apurado pelo motor está correto' },
  { value: 'REJEITADO', label: 'Rejeitar', desc: 'O cálculo está errado — informe o motivo' },
]

export const fmtBRL = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ValidacaoDifalModal({ itens, onClose, onSubmit, resultados, erro }) {
  const lote = itens.length > 1
  const item = itens[0]
  const soma = itens.reduce((acc, it) => acc + Number(it.total_item || 0), 0)

  const [estado, setEstado] = useState('')
  const [valor, setValor] = useState(lote ? '' : (item.total_item ?? ''))
  const [usarCalculado, setUsarCalculado] = useState(true)
  const [motivo, setMotivo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const motivoObrigatorio = estado === 'REJEITADO'
  const podeEnviar = estado && (!motivoObrigatorio || motivo.trim()) && !submitting

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!podeEnviar) return
    setSubmitting(true)
    try {
      await onSubmit({
        estado,
        valor_conferido: lote ? undefined : (valor === '' ? null : String(valor)),
        motivo: motivo.trim() || null,
        usar_valor_calculado: lote ? usarCalculado : false,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const falhas = (resultados || []).filter((r) => r.status !== 200)
  const gravados = (resultados || []).filter((r) => r.status === 200).length

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !submitting) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>
            {lote ? `Validar em lote — ${itens.length} itens` : `Item DIFAL-SN #${item.item_result_id}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Contexto */}
          <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
            {lote ? (
              <p className="font-medium text-foreground">
                {itens.length} itens, {fmtBRL(soma)} calculados pelo motor
              </p>
            ) : (
              <>
                <p className="font-medium text-foreground mb-1">
                  {item.rule_code}{item.rule_version != null ? `@v${item.rule_version}` : ''} · {fmtBRL(item.total_item)}
                </p>
                <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                  <span>NF {item.chave_acesso || item.invoice_id}</span>
                  <span>UF {item.uf_destino}</span>
                  <span>{item.competencia}</span>
                  {item.tipo_base && <span>{item.tipo_base}{item.variante_deducao ? `/${item.variante_deducao}` : ''}</span>}
                </div>
              </>
            )}
          </div>

          {/* Veredito */}
          <div>
            <Label className="block mb-2">Veredito</Label>
            <RadioGroup value={estado} onValueChange={setEstado} className="gap-2">
              {ESTADOS.map((r) => (
                <label
                  key={r.value}
                  onClick={() => setEstado(r.value)}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    estado === r.value ? 'border-primary bg-primary/5' : 'border-border hover:border-input'
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

          {/* Valor conferido */}
          {lote ? (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={usarCalculado}
                onCheckedChange={(v) => setUsarCalculado(v === true)}
              />
              Registrar o valor calculado pelo motor como valor conferido
            </label>
          ) : (
            <div>
              <Label htmlFor="difal-valor-conferido" className="block mb-1">Valor conferido (R$)</Label>
              <Input
                id="difal-valor-conferido"
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full text-sm"
              />
            </div>
          )}

          {/* Motivo */}
          <div>
            <Label htmlFor="difal-motivo" className="block mb-1">
              Motivo {motivoObrigatorio ? <span className="text-destructive-text">(obrigatório para rejeitar)</span> : <span className="text-muted-foreground">(opcional)</span>}
            </Label>
            <Textarea
              id="difal-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={motivoObrigatorio ? 'Por que o cálculo está errado?' : 'Observação da conferência'}
              rows={3}
              className="w-full text-sm resize-none"
              required={motivoObrigatorio}
            />
          </div>

          {erro && (
            <div className="text-sm text-destructive-text bg-destructive-subtle border border-destructive-border rounded-lg p-3">{erro}</div>
          )}

          {resultados && (
            <div className="text-xs rounded-lg border border-border p-3 space-y-1 max-h-40 overflow-y-auto">
              <p className="font-medium text-foreground">
                {gravados} de {resultados.length} gravados{falhas.length > 0 ? ` — ${falhas.length} não gravados:` : ''}
              </p>
              {falhas.map((r) => (
                <p key={r.item_result_id} className={r.status === 409 ? 'text-warning-text' : 'text-destructive-text'}>
                  #{r.item_result_id} · {r.status} · {r.detalhe}
                </p>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              onClick={onClose}
              disabled={submitting}
              variant="outline"
            >
              {resultados ? 'Fechar' : 'Cancelar'}
            </Button>
            {!resultados && (
              <Button
                type="submit"
                disabled={!podeEnviar}
              >
                {submitting ? 'Gravando...' : estado === 'REJEITADO' ? 'Rejeitar' : 'Validar'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
