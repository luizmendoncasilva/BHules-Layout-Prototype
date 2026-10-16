import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Textarea, Label, RadioGroup, RadioGroupItem,
} from '@bhubai/bhub-design-system'
import { AlertCircle, Loader2 } from 'lucide-react'

export const DECISOES_DIFAL = [
  ['COLLECT', 'Cobra', 'O item gera DIFAL a recolher no valor informado.'],
  ['DO_NOT_COLLECT', 'Não cobra', 'O item é elegível, mas não há DIFAL a recolher.'],
  ['NOT_ELIGIBLE', 'Não elegível', 'O item está fora do DIFAL do Simples (ex.: revenda).'],
]

const DECISOES_VALIDAS = new Set(DECISOES_DIFAL.map(([v]) => v))

// "1.234,56" → "1234.56": tira o separador de milhar antes de trocar a vírgula
// decimal (mesmo critério do filtro vl_doc do backend). Diferença: sem vírgula
// e com um ponto só, o ponto é decimal — o campo vem preenchido com o
// total_item da API ("73.17"), que o critério do vl_doc leria como 7317.
// null = não é um valor ≥ 0.
function normalizarValor(bruto) {
  let v = String(bruto ?? '').trim()
  if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.')
  else if ((v.match(/\./g) || []).length > 1) v = v.replace(/\./g, '')
  if (!/^\d+(\.\d+)?$/.test(v)) return null
  return v
}

// request() lança Error('API <status>: <corpo>'); mostra só o `detail` do
// FastAPI (string ou lista de erros de validação), nunca o corpo cru.
function mensagemDeErro(e) {
  const corpo = String(e?.message || '').replace(/^API \d+:\s*/, '')
  let detalhe = corpo
  try {
    const d = JSON.parse(corpo)?.detail
    if (typeof d === 'string') detalhe = d
    else if (Array.isArray(d)) detalhe = d.map(x => x?.msg).filter(Boolean).join('; ')
  } catch { /* corpo não-JSON: usa o texto */ }
  return `Não foi possível salvar o ajuste: ${detalhe || 'erro desconhecido'}`
}

export default function AjusteDifalModal({ item, onClose, onSave }) {
  // Decisão do motor fora das opções (BLOCKED, ELIGIBLE_ZERO…) não vira valor
  // inicial: o analista escolhe explicitamente (senão salvaria outra coisa — 422).
  const inicial = item.revisao?.decisao_conferida || item.decision
  const [decisao, setDecisao] = useState(DECISOES_VALIDAS.has(inicial) ? inicial : '')
  const [motivo, setMotivo] = useState('')
  const [valor, setValor] = useState(
    item.revisao?.valor_conferido ?? (item.decision === 'COLLECT' ? item.total_item : ''),
  )
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const salvar = async () => {
    if (!decisao) { setErro('Escolha a decisão.'); return }
    if (!motivo.trim()) { setErro('Motivo é obrigatório.'); return }
    let valorConferido = null
    if (decisao === 'COLLECT') {
      if (!String(valor ?? '').trim()) { setErro('Informe o valor.'); return }
      valorConferido = normalizarValor(valor)
      if (valorConferido === null) { setErro('Valor inválido.'); return }
    }
    setSalvando(true)
    try {
      await onSave({
        decisao_conferida: decisao,
        motivo: motivo.trim(),
        valor_conferido: valorConferido,
      })
      onClose()
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !salvando) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle>Ajustar DIFAL do item {item.invoice_item_id}</DialogTitle>
          <DialogDescription>
            {item.descricao || 'Item da nota'} · o ajuste fica registrado na auditoria com o seu usuário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="block mb-2">Decisão</Label>
            <RadioGroup value={decisao} onValueChange={(v) => { setDecisao(v); setErro(null) }} aria-label="Decisão">
              {DECISOES_DIFAL.map(([v, rotulo, dica]) => (
                <label
                  key={v}
                  htmlFor={`difal-decisao-${v}`}
                  className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                    decisao === v ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                  }`}
                >
                  <RadioGroupItem id={`difal-decisao-${v}`} value={v} className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-medium text-foreground">{rotulo}</span>
                    <span className="block text-xs text-muted-foreground">{dica}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {decisao === 'COLLECT' && (
            <div>
              <Label htmlFor="difal-valor" className="block mb-1">Valor do DIFAL (R$)</Label>
              <Input
                id="difal-valor"
                aria-label="Valor"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
          )}

          <div>
            <Label htmlFor="difal-motivo" className="block mb-1">Motivo</Label>
            <Textarea
              id="difal-motivo"
              aria-label="Motivo"
              rows={3}
              placeholder="Ex.: conferido com a GNRE paga pelo fornecedor"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          {erro && (
            <p role="alert" className="flex items-start gap-1.5 text-xs text-destructive-text">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" /> {erro}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={salvando}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar ajuste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
