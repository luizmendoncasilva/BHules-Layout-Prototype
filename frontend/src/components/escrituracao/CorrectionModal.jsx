import { useState } from 'react'
import { Send } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  Button, Input, Label, Spinner, LoadingButton,
  Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem,
} from '@bhubai/bhub-design-system'
import { CST_ICMS, CSOSN } from '../../constants/classificationOptions'

const FINALIDADES = [
  'REVENDA', 'MATERIA_PRIMA', 'USO_CONSUMO', 'ATIVO_IMOBILIZADO',
  'SERVICO', 'IMPORTACAO', 'DEVOLUCAO', 'RETORNO', 'BONIFICACAO', 'TRANSFERENCIA',
]

const FINALIDADE_LABELS = {
  REVENDA: 'Revenda',
  MATERIA_PRIMA: 'Matéria-prima / Insumo',
  USO_CONSUMO: 'Uso e consumo',
  ATIVO_IMOBILIZADO: 'Ativo imobilizado',
  SERVICO: 'Serviço',
  IMPORTACAO: 'Importação',
  DEVOLUCAO: 'Devolução',
  RETORNO: 'Retorno',
  BONIFICACAO: 'Bonificação',
  TRANSFERENCIA: 'Transferência',
}

// CST PIS/COFINS por regime tributário do destinatário
const CST_PIS_COFINS_LUCRO_REAL = [
  { code: '50', desc: 'Com direito a crédito' },
  { code: '51', desc: 'Com direito a crédito - vinculada receita tributada MI' },
  { code: '52', desc: 'Com direito a crédito - vinculada receita não tributada MI' },
  { code: '53', desc: 'Com direito a crédito - vinculada receita tributada e não tributada MI' },
  { code: '54', desc: 'Com direito a crédito - vinculada receita tributada exportação' },
  { code: '55', desc: 'Com direito a crédito - vinculada receita não tributada exportação' },
  { code: '56', desc: 'Com direito a crédito - vinculada receita tributada e não tributada exportação' },
  { code: '60', desc: 'Crédito presumido - operação de aquisição vinculada receita tributada MI' },
  { code: '61', desc: 'Crédito presumido - vinculada receita não tributada MI' },
  { code: '62', desc: 'Crédito presumido - vinculada receita exportação' },
  { code: '63', desc: 'Crédito presumido - vinculada receita tributada e não tributada MI' },
  { code: '70', desc: 'Sem direito a crédito' },
  { code: '71', desc: 'Sem direito a crédito - vinculada a receita isenta' },
  { code: '72', desc: 'Sem direito a crédito - operação com suspensão' },
  { code: '73', desc: 'Sem direito a crédito - operação com alíquota zero' },
  { code: '74', desc: 'Sem direito a crédito - operação sem incidência' },
  { code: '75', desc: 'Sem direito a crédito - operação por ST' },
  { code: '98', desc: 'Outras operações de entrada' },
  { code: '99', desc: 'Outras operações' },
]

const CST_PIS_COFINS_PRESUMIDO = [
  { code: '70', desc: 'Sem direito a crédito' },
  { code: '71', desc: 'Sem direito a crédito - vinculada a receita isenta' },
  { code: '72', desc: 'Sem direito a crédito - operação com suspensão' },
  { code: '73', desc: 'Sem direito a crédito - operação com alíquota zero' },
  { code: '74', desc: 'Sem direito a crédito - operação sem incidência' },
  { code: '75', desc: 'Sem direito a crédito - operação por ST' },
  { code: '98', desc: 'Outras operações de entrada' },
  { code: '99', desc: 'Outras operações' },
]

const CST_PIS_COFINS_SIMPLES = [
  { code: '98', desc: 'Outras operações de entrada' },
  { code: '99', desc: 'Outras operações' },
]

function getCstPisCofinsOptions(regime) {
  if (regime === 'SIMPLES' || regime === 'MEI') return CST_PIS_COFINS_SIMPLES
  if (regime === 'PRESUMIDO') return CST_PIS_COFINS_PRESUMIDO
  return CST_PIS_COFINS_LUCRO_REAL
}

export default function CorrectionModal({ item, onClose, onSubmit, regimeTributario }) {
  const [finalidade, setFinalidade] = useState(item.finalidade || '')
  const [cfop, setCfop] = useState(item.cfop_entrada || '')
  const [cstIcms, setCstIcms] = useState(item.cst_icms_entrada || '')
  const [cstPis, setCstPis] = useState(item.cst_pis_entrada || '')
  const [cstCofins, setCstCofins] = useState(item.cst_cofins_entrada || '')
  const [aliqIcms, setAliqIcms] = useState(
    item.credito_icms?.aliquota != null ? String(Number(item.credito_icms.aliquota)) : ''
  )
  const [submitting, setSubmitting] = useState(false)

  const hasChanges =
    finalidade !== item.finalidade ||
    cfop !== (item.cfop_entrada || '') ||
    cstIcms !== (item.cst_icms_entrada || '') ||
    cstPis !== (item.cst_pis_entrada || '') ||
    cstCofins !== (item.cst_cofins_entrada || '') ||
    aliqIcms !== (item.credito_icms?.aliquota != null ? String(Number(item.credito_icms.aliquota)) : '')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!hasChanges) return
    setSubmitting(true)
    const correcoes = {}
    if (finalidade !== item.finalidade) correcoes.finalidade = finalidade
    if (cfop !== (item.cfop_entrada || '')) correcoes.cfop_entrada = cfop
    if (cstIcms !== (item.cst_icms_entrada || '')) correcoes.cst_icms = cstIcms
    if (cstPis !== (item.cst_pis_entrada || '')) correcoes.cst_pis = cstPis
    if (cstCofins !== (item.cst_cofins_entrada || '')) correcoes.cst_cofins = cstCofins
    if (aliqIcms !== (item.credito_icms?.aliquota != null ? String(Number(item.credito_icms.aliquota)) : '')) {
      correcoes.aliq_icms = aliqIcms ? Number(aliqIcms) : 0
    }
    try {
      await onSubmit(item.invoice_item_id, correcoes)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={!!item} onOpenChange={(open) => { if (!open && !submitting) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 gap-0 relative"
        showCloseButton={!submitting}
        onPointerDownOutside={(e) => { if (submitting) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (submitting) e.preventDefault() }}
      >
        {/* Full-screen loading overlay */}
        {submitting && (
          <div className="absolute inset-0 bg-card/80 z-10 flex flex-col items-center justify-center">
            <Spinner size="xl" className="text-primary mb-3" />
            <p className="text-sm text-foreground font-medium">Enviando correção...</p>
            <p className="text-xs text-muted-foreground mt-1">Aguarde, o motor está reprocessando.</p>
          </div>
        )}

        <SheetHeader className="border-b border-border">
          <SheetTitle className="text-xl font-semibold">Corrigir Item #{item.num_item}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {/* Context */}
          <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground truncate">{item.descricao || `Item ${item.num_item}`}</p>
            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
              <span>NCM: {item.ncm}</span>
              <span>Valor: R$ {Number(item.valor_item).toFixed(2)}</span>
            </div>
          </div>

          {/* Finalidade */}
          <div>
            <Label className="block mb-1">Finalidade</Label>
            <Select value={finalidade} onValueChange={setFinalidade}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {FINALIDADES.map((f) => (
                  <SelectItem key={f} value={f}>{FINALIDADE_LABELS[f] || f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {finalidade !== item.finalidade && (
              <p className="text-xs text-warning-text mt-1">
                Motor sugeriu: {FINALIDADE_LABELS[item.finalidade] || item.finalidade}
              </p>
            )}
          </div>

          {/* CFOP + Aliq ICMS side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="correction-cfop" className="block mb-1">CFOP de Entrada</Label>
              <Input
                id="correction-cfop"
                type="text"
                value={cfop}
                onChange={(e) => setCfop(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Ex: 1102, 2101"
                maxLength={4}
                className="font-mono"
              />
              {cfop !== (item.cfop_entrada || '') && item.cfop_entrada && (
                <p className="text-xs text-warning-text mt-1">Motor: {item.cfop_entrada}</p>
              )}
            </div>

            <div>
              <Label htmlFor="correction-aliq-icms" className="block mb-1">Aliq. ICMS (%)</Label>
              <Input
                id="correction-aliq-icms"
                type="number"
                step="0.01"
                min="0"
                max="99.99"
                value={aliqIcms}
                onChange={(e) => setAliqIcms(e.target.value)}
                placeholder="Ex: 18, 12, 7"
                className="font-mono"
              />
            </div>
          </div>

          {/* CST/CSOSN ICMS */}
          <div>
            <Label className="block mb-1">
              CST/CSOSN ICMS de Entrada
            </Label>
            <Select value={cstIcms} onValueChange={setCstIcms}>
              <SelectTrigger className="w-full font-mono">
                <SelectValue placeholder="--" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>CST ICMS</SelectLabel>
                  {CST_ICMS.map((o) => (
                    <SelectItem key={`cst-${o.code}`} value={o.code}>{o.code} - {o.description}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>CSOSN (Simples Nacional)</SelectLabel>
                  {CSOSN.map((o) => (
                    <SelectItem key={`csosn-${o.code}`} value={o.code}>{o.code} - {o.description}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {cstIcms !== (item.cst_icms_entrada || '') && item.cst_icms_entrada && (
              <p className="text-xs text-warning-text mt-1">Motor: {item.cst_icms_entrada}</p>
            )}
          </div>

          {/* CST PIS + COFINS side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="block mb-1">CST PIS</Label>
              <Select value={cstPis} onValueChange={setCstPis}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="--" />
                </SelectTrigger>
                <SelectContent>
                  {getCstPisCofinsOptions(regimeTributario).map((o) => (
                    <SelectItem key={o.code} value={o.code}>{o.code} - {o.desc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cstPis !== (item.cst_pis_entrada || '') && item.cst_pis_entrada && (
                <p className="text-xs text-warning-text mt-1">Motor: {item.cst_pis_entrada}</p>
              )}
            </div>

            <div>
              <Label className="block mb-1">CST COFINS</Label>
              <Select value={cstCofins} onValueChange={setCstCofins}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="--" />
                </SelectTrigger>
                <SelectContent>
                  {getCstPisCofinsOptions(regimeTributario).map((o) => (
                    <SelectItem key={o.code} value={o.code}>{o.code} - {o.desc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cstCofins !== (item.cst_cofins_entrada || '') && item.cst_cofins_entrada && (
                <p className="text-xs text-warning-text mt-1">Motor: {item.cst_cofins_entrada}</p>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 -mx-6 mt-4 px-6 py-4 bg-card border-t border-border flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <LoadingButton
              type="submit"
              loading={submitting}
              loadingText="Enviando..."
              disabled={!hasChanges}
            >
              <Send className="w-3.5 h-3.5" />Enviar Correcao
            </LoadingButton>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
