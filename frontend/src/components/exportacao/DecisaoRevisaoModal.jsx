import React, { useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  RadioGroup,
  RadioGroupItem,
  Label,
  Checkbox,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@bhubai/bhub-design-system'
import {
  FORMAS_RECEBIMENTO,
  GATILHO_REVISAO,
  STATUS_REVISAO,
  depoisDoCorte,
  formatCompetencia,
  formatData,
  formatValorMoeda,
  tomadorDaNota,
} from './revisaoLabels'

/**
 * Modal de decisão de uma revisão de exportação (design.md §6.3, Revisão AC2/AC3/AC6).
 * Corpo enviado: {escolha, justificativa, inscrever?: CadastroExportadorIn}.
 * A inscrição no cadastro vai no mesmo POST, para o backend gravar tudo junto.
 */
export function DecisaoRevisaoModal({ revisao, empresaNome, onDecidir, onClose }) {
  const [escolha, setEscolha] = useState('EXPORTACAO')
  const [justificativa, setJustificativa] = useState('')
  const [inscrever, setInscrever] = useState(false)
  const [cad, setCad] = useState({
    subitem_lc116: revisao.valores_nota?.codigo_servico_lc116 || '',
    competencia_inicio: revisao.competencia || '',
    forma_recebimento: 'CONTRATO_CAMBIO',
    evidencia_recebimento: '',
    receita_mista: false,
    objeto_conferido_por: '',
    art2_iii_conferido_por: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [erro, setErro] = useState(null)

  const tomador = tomadorDaNota(revisao.valores_nota)
  const tardia = escolha === 'EXPORTACAO' && depoisDoCorte(revisao)
  const setCampo = (k) => (e) =>
    setCad({ ...cad, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErro(null)
    const body = { escolha, justificativa: justificativa.trim() }
    if (escolha === 'EXPORTACAO' && inscrever) {
      const agora = new Date().toISOString()
      body.inscrever = {
        subitem_lc116: cad.subitem_lc116.trim(),
        competencia_inicio: cad.competencia_inicio.replace(/[-/]/g, '').trim(),
        tributos_desonerados: ['ISS', 'PIS', 'COFINS'],
        forma_recebimento: cad.forma_recebimento,
        evidencia_recebimento: cad.evidencia_recebimento.trim(),
        receita_mista: Boolean(cad.receita_mista),
        objeto_conferido_por: cad.objeto_conferido_por.trim(),
        objeto_conferido_em: agora,
        art2_iii_conferido_por: cad.art2_iii_conferido_por.trim(),
        art2_iii_conferido_em: agora,
        justificativa: justificativa.trim(),
      }
    }
    try {
      const resultado = await onDecidir(revisao.id, body)
      onClose(resultado)
    } catch (err) {
      // 422 (trava dura, tomador BR, sem moeda) e 409 (mesma escolha) chegam aqui com o motivo.
      setErro(err.message || 'Falha ao gravar decisão.')
    } finally {
      setSubmitting(false)
    }
  }

  const input = 'w-full h-auto px-2.5 py-1 text-xs md:text-xs'

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !submitting) onClose(null) }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="text-sm">
            Decisão de revisão — nota #{revisao.invoice_id}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Escolha o desfecho da revisão e registre a justificativa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="bg-muted p-3 rounded border border-border space-y-1 text-foreground">
            {empresaNome && <div><strong>Empresa:</strong> {empresaNome}</div>}
            <div><strong>Competência:</strong> {formatCompetencia(revisao.competencia)} · <strong>Gatilho:</strong> {GATILHO_REVISAO[revisao.gatilho] || revisao.gatilho}</div>
            <div><strong>Tomador:</strong> {tomador.nome}{tomador.pais ? ` (${tomador.pais})` : ''} {tomador.doc}</div>
            <div>
              <strong>Subitem:</strong> {revisao.valores_nota?.codigo_servico_lc116 || '—'} · <strong>Moeda:</strong> {formatValorMoeda(revisao.valores_nota)}
            </div>
            <div>
              <strong>Situação:</strong> {STATUS_REVISAO[revisao.status] || revisao.status} · <strong>Prazo:</strong> {formatData(revisao.prazo)} · <strong>Corte:</strong> {formatData(revisao.corte)}
            </div>
          </div>

          <div>
            <Label className="block text-xs font-semibold text-foreground mb-2">Desfecho *</Label>
            <RadioGroup value={escolha} onValueChange={setEscolha} className="grid grid-cols-2 gap-3">
              {[
                ['EXPORTACAO', 'Exportação', 'ISS, PIS e Cofins desonerados', CheckCircle2, 'border-success-border bg-success-subtle ring-2 ring-success-border', 'text-success-text'],
                ['INTERNO', 'Mercado interno', 'Tributação normal no Simples', XCircle, 'border-destructive-border bg-destructive-subtle ring-2 ring-destructive-border', 'text-destructive-text'],
              ].map(([valor, titulo, sub, Icone, ativo, corIcone]) => (
                <Label
                  key={valor}
                  htmlFor={`escolha-${valor}`}
                  className={`border rounded-lg p-3 cursor-pointer flex flex-col items-center text-center gap-0 font-normal transition-all ${
                    escolha === valor ? ativo : 'border-border hover:bg-muted text-foreground'
                  }`}
                >
                  <RadioGroupItem id={`escolha-${valor}`} value={valor} className="sr-only" />
                  <Icone className={`w-5 h-5 mb-1 ${corIcone}`} />
                  <span className="text-xs font-semibold">{titulo}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{sub}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {tardia && (
            <div className="p-3 bg-warning-subtle border border-warning-border rounded-md flex items-start gap-2 text-warning-text">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Decisão depois do corte do DAS: a nota gera uma <strong>pendência de retificação</strong> do
                PGDAS-D para a operação (o cálculo não retifica sozinho).
              </span>
            </div>
          )}

          {escolha === 'EXPORTACAO' && (
            <div className="p-3 bg-info-subtle border border-info-border rounded-md space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={inscrever} onCheckedChange={(v) => setInscrever(v === true)} className="mt-0.5" />
                <div>
                  <span className="font-semibold text-info-text">Inscrever cliente no cadastro de exportadores</span>
                  <p className="text-[10px] text-info-text mt-0.5">
                    Abre a janela de vigência a partir desta competência; as próximas notas do subitem decidem pelo cadastro.
                  </p>
                </div>
              </label>

              {inscrever && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-info-border">
                  <div>
                    <label className="block text-muted-foreground mb-0.5">Subitem LC 116 *</label>
                    <Input required value={cad.subitem_lc116} onChange={setCampo('subitem_lc116')} className={input} />
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-0.5">Competência inicial (AAAAMM) *</label>
                    <Input required value={cad.competencia_inicio} onChange={setCampo('competencia_inicio')} className={input} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-muted-foreground mb-0.5">Tributos desonerados</label>
                    <Input disabled value="ISS + PIS + Cofins (LC 123, art. 18, §14 — indivisível)" className={`${input} bg-muted text-muted-foreground`} />
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-0.5">Forma de recebimento *</label>
                    <Select value={cad.forma_recebimento} onValueChange={(v) => setCad({ ...cad, forma_recebimento: v })}>
                      <SelectTrigger size="sm" className="w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMAS_RECEBIMENTO.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-0.5">Evidência do ingresso de divisas *</label>
                    <Input required value={cad.evidencia_recebimento} onChange={setCampo('evidencia_recebimento')} className={input} />
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-0.5">Objeto contratual conferido por *</label>
                    <Input required value={cad.objeto_conferido_por} onChange={setCampo('objeto_conferido_por')} className={input} />
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-0.5">Art. 2º, III conferido por *</label>
                    <Input required value={cad.art2_iii_conferido_por} onChange={setCampo('art2_iii_conferido_por')} className={input} />
                  </div>
                  <label className="sm:col-span-2 flex items-center gap-2 text-foreground">
                    <Checkbox checked={cad.receita_mista} onCheckedChange={(v) => setCad({ ...cad, receita_mista: v === true })} />
                    Receita mista (interno e externo no mesmo subitem)
                  </label>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block font-semibold text-foreground mb-1">Justificativa *</label>
            <Textarea
              required
              rows={3}
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Evidência verificada que sustenta o desfecho..."
              className={input}
            />
          </div>

          {erro && (
            <div className="p-3 bg-destructive-subtle border border-destructive-border rounded-md text-destructive-text flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => onClose(null)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="info" size="sm" disabled={submitting}>
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Salvar decisão</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default DecisaoRevisaoModal
