import { useState, useEffect, useMemo } from 'react'
import { Check, Loader2 } from 'lucide-react'
import {
  Button, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectGroup, SelectLabel,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input,
} from '@bhubai/bhub-design-system'
import { useClassificationOverrides, useSaveClassificationOverrides } from '../../hooks/useInvoices'
import { CST_ICMS, CSOSN, TIPO_ITEM, CST_PIS_COFINS, CFOP_ENTRADA } from '../../constants/classificationOptions'

function hasOverride(edits, itemId, field, originalValue) {
  const edit = edits[itemId]
  if (!edit) return false
  const val = edit[field]
  if (val === undefined || val === null || val === '') return false
  return String(val) !== String(originalValue ?? '')
}

export default function ClassificationTab({ items, invoiceId, escrituracaoData }) {
  const { data: overrides, isLoading: ovLoading } = useClassificationOverrides(invoiceId)
  const saveOverrides = useSaveClassificationOverrides()

  // Local edit state: { [item_id]: { tipo_item, cfop, aliq_icms, cst_icms, ncm, cst_pis, cst_cofins } }
  const [edits, setEdits] = useState({})
  const [initialized, setInitialized] = useState(false)

  // Initialize edits from loaded overrides
  useEffect(() => {
    if (ovLoading || !overrides || initialized) return
    const init = {}
    for (const ov of overrides) {
      init[ov.invoice_item_id] = {
        tipo_item: ov.tipo_item ?? '',
        cfop: ov.cfop ?? '',
        aliq_icms: ov.aliq_icms != null ? String(ov.aliq_icms) : '',
        cst_icms: ov.cst_icms ?? '',
        ncm: ov.ncm ?? '',
        cst_pis: ov.cst_pis ?? '',
        cst_cofins: ov.cst_cofins ?? '',
      }
    }
    setEdits(init)
    setInitialized(true)
  }, [overrides, ovLoading, initialized])

  const updateField = (itemId, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }))
  }

  // Determine if there are pending changes vs saved overrides
  const hasPendingChanges = useMemo(() => {
    if (!items) return false
    const overrideMap = {}
    if (overrides) {
      for (const ov of overrides) {
        overrideMap[ov.invoice_item_id] = ov
      }
    }
    for (const item of items) {
      const edit = edits[item.id]
      if (!edit) {
        // If there was an override before but now no edit, that's not a change (edits initialized from overrides)
        continue
      }
      const saved = overrideMap[item.id]
      const fields = ['tipo_item', 'cfop', 'aliq_icms', 'cst_icms', 'ncm', 'cst_pis', 'cst_cofins']
      for (const f of fields) {
        const editVal = edit[f] ?? ''
        const savedVal = saved ? String(saved[f] ?? '') : ''
        if (String(editVal) !== savedVal) return true
      }
    }
    return false
  }, [edits, overrides, items])

  const handleSave = () => {
    if (!items || !invoiceId) return
    const batch = items
      .filter((item) => edits[item.id])
      .map((item) => {
        const e = edits[item.id]
        return {
          invoice_item_id: item.id,
          tipo_item: e.tipo_item || null,
          cfop: e.cfop || null,
          aliq_icms: e.aliq_icms ? Number(e.aliq_icms) : null,
          cst_icms: e.cst_icms || null,
          ncm: e.ncm || null,
          cst_pis: e.cst_pis || null,
          cst_cofins: e.cst_cofins || null,
        }
      })
    if (batch.length === 0) return
    saveOverrides.mutate({ invoiceId, items: batch, motivo: null })
  }

  // CST + CSOSN combined list (CST para Regime Normal, CSOSN para Simples Nacional)
  const cstOptions = useMemo(() => {
    const opts = []
    for (const o of CST_ICMS) {
      opts.push({ code: o.code, label: `${o.code} - ${o.description}`, group: 'CST' })
    }
    for (const o of CSOSN) {
      opts.push({ code: o.code, label: `${o.code} - ${o.description}`, group: 'CSOSN' })
    }
    return opts
  }, [])

  const tipoOptions = TIPO_ITEM
  const cfopOptions = CFOP_ENTRADA
  const cstPisCofinsOptions = CST_PIS_COFINS

  return (
    <>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Classificação dos itens</h2>
          <p className="text-sm text-muted-foreground">Visualize e edite a classificação fiscal dos itens da nota</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasPendingChanges || saveOverrides.isPending}
        >
          {saveOverrides.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {saveOverrides.isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>

      {saveOverrides.isSuccess && (
        <div className="mb-4 px-3 py-2 bg-success-subtle border border-success-border rounded-lg text-sm text-success-text">
          Alterações salvas com sucesso.
        </div>
      )}

      {/* w-[1400px]: tabela densa de 8 colunas fixas (NCM/CFOP/CST...) — largura
          arbitrária mantida de propósito para caber todas as colunas sem quebra
          de linha; não há classe padrão da escala Tailwind equivalente. */}
      <Table className="text-sm w-[1400px]" style={{ tableLayout: 'fixed' }}>
          <TableHeader className="border-b border-border">
            <TableRow>
              <TableHead className="px-3 py-3 text-left font-semibold text-foreground border-r border-border h-auto w-56">Item na Nota</TableHead>
              <TableHead className="px-3 py-3 text-left font-semibold text-foreground border-r border-border h-auto w-28">NCM</TableHead>
              <TableHead className="px-3 py-3 text-left font-semibold text-foreground border-r border-border h-auto w-44">Classificação</TableHead>
              <TableHead className="px-3 py-3 text-left font-semibold text-foreground border-r border-border h-auto w-28">CFOP</TableHead>
              <TableHead className="px-3 py-3 text-left font-semibold text-foreground border-r border-border h-auto w-24">Aliq. ICMS</TableHead>
              <TableHead className="px-3 py-3 text-left font-semibold text-foreground border-r border-border h-auto w-36">CST ICMS</TableHead>
              <TableHead className="px-3 py-3 text-left font-semibold text-foreground border-r border-border h-auto w-32">CST PIS</TableHead>
              <TableHead className="px-3 py-3 text-left font-semibold text-foreground h-auto w-32">CST COFINS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-card">
            {(items || []).map((item, index) => {
              const edit = edits[item.id] || {}

              // Find matching escrituracao suggestion for this item
              const sugestao = escrituracaoData?.sugestoes?.find(s => s.invoice_item_id === item.id)

              const origTipo = item.tipo_item_computed || item.tipo_item_sped || ''
              const origCfop = item.cfop_emitente || ''
              const origAliq = item.aliq_icms != null ? String(item.aliq_icms) : ''
              const origCst = item.cst_icms || ''
              const origNcm = item.ncm || ''
              const origCstPis = item.cst_pis || ''
              const origCstCofins = item.cst_cofins || ''

              // Use escrituracao suggestions as fallback when no override exists
              const sugTipo = sugestao?.finalidade || ''
              const sugCfop = sugestao?.cfop_entrada || ''
              const sugAliq = sugestao?.credito_icms?.aliquota != null ? String(sugestao.credito_icms.aliquota) : ''
              const sugCst = sugestao?.cst_icms_entrada || ''

              const effNcm = edit.ncm !== undefined && edit.ncm !== '' ? edit.ncm : origNcm
              const effTipo = edit.tipo_item !== undefined && edit.tipo_item !== '' ? edit.tipo_item : (origTipo || sugTipo)
              const effCfop = edit.cfop !== undefined && edit.cfop !== '' ? edit.cfop : (origCfop || sugCfop)
              const effAliq = edit.aliq_icms !== undefined && edit.aliq_icms !== '' ? edit.aliq_icms : (origAliq || sugAliq)
              const effCst = edit.cst_icms !== undefined && edit.cst_icms !== '' ? edit.cst_icms : (origCst || sugCst)
              const effCstPis = edit.cst_pis !== undefined && edit.cst_pis !== '' ? edit.cst_pis : origCstPis
              const effCstCofins = edit.cst_cofins !== undefined && edit.cst_cofins !== '' ? edit.cst_cofins : origCstCofins

              // Track which fields come from engine suggestion
              const isSuggested = {
                tipo_item: !origTipo && !!sugTipo && effTipo === sugTipo,
                cfop: !origCfop && !!sugCfop && effCfop === sugCfop,
                aliq_icms: !origAliq && !!sugAliq && effAliq === sugAliq,
                cst_icms: !origCst && !!sugCst && effCst === sugCst,
              }

              const ovBorder = 'border-l-2 border-l-info pl-2'

              return (
                <TableRow key={item.id} className="border-b border-border last:border-0">
                  {/* Item name - read only */}
                  <TableCell className="px-3 py-3 border-r border-border text-foreground">
                    <div className="font-medium text-xs truncate">{item.num_item || item.nitem || (index + 1)} - {item.descr_compl || item.xprod || item.cod_item || '-'}</div>
                  </TableCell>

                  {/* NCM - text input */}
                  <TableCell className="px-3 py-3 border-r border-border">
                    <Input
                      type="text"
                      maxLength={8}
                      value={effNcm}
                      onChange={(e) => updateField(item.id, 'ncm', e.target.value.replace(/\D/g, '').slice(0, 8))}
                      className={`font-mono text-xs ${
                        hasOverride(edits, item.id, 'ncm', origNcm) ? ovBorder : ''
                      }`}
                      placeholder="00000000"
                    />
                  </TableCell>

                  {/* Classificacao (tipo_item) - select */}
                  <TableCell className="px-3 py-3 border-r border-border">
                    <div className="relative">
                    {isSuggested.tipo_item && <span className="absolute -top-1 right-0 text-xs text-info font-medium">Motor</span>}
                    <Select value={effTipo} onValueChange={(val) => updateField(item.id, 'tipo_item', val)}>
                      <SelectTrigger
                        className={`w-full px-2 py-1.5 h-auto border rounded text-xs truncate focus:outline-none focus:ring-1 focus:ring-info ${
                          isSuggested.tipo_item ? 'border-info bg-info-subtle' :
                          hasOverride(edits, item.id, 'tipo_item', origTipo) ? ovBorder : 'border-border'
                        }`}
                      >
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-</SelectItem>
                        {tipoOptions.map((o) => (
                          <SelectItem key={o.code} value={o.code}>{o.code} - {o.description}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    </div>
                  </TableCell>

                  {/* CFOP - input with datalist */}
                  <TableCell className="px-3 py-3 border-r border-border">
                    <div className="relative">
                    {isSuggested.cfop && <span className="absolute -top-1 right-0 text-xs text-info font-medium">Motor</span>}
                    <Input
                      type="text"
                      maxLength={4}
                      value={effCfop}
                      onChange={(e) => updateField(item.id, 'cfop', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      list="cfop-options"
                      className={`font-mono text-xs ${
                        isSuggested.cfop ? 'border-info bg-info-subtle' :
                        hasOverride(edits, item.id, 'cfop', origCfop) ? ovBorder : ''
                      }`}
                      placeholder="0000"
                    />
                    </div>
                  </TableCell>

                  {/* Aliq ICMS - number input */}
                  <TableCell className="px-3 py-3 border-r border-border">
                    <div className="relative">
                    {isSuggested.aliq_icms && <span className="absolute -top-1 right-0 text-xs text-info font-medium">Motor</span>}
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="99.99"
                      value={effAliq}
                      onChange={(e) => updateField(item.id, 'aliq_icms', e.target.value)}
                      className={`font-mono text-xs ${
                        isSuggested.aliq_icms ? 'border-info bg-info-subtle' :
                        hasOverride(edits, item.id, 'aliq_icms', origAliq) ? ovBorder : ''
                      }`}
                      placeholder="0.00"
                    />
                    </div>
                  </TableCell>

                  {/* CST ICMS - select (CST + CSOSN) */}
                  <TableCell className="px-3 py-3 border-r border-border">
                    <div className="relative">
                    {isSuggested.cst_icms && <span className="absolute -top-1 right-0 text-xs text-info font-medium">Motor</span>}
                    <Select value={effCst} onValueChange={(val) => updateField(item.id, 'cst_icms', val)}>
                      <SelectTrigger
                        className={`w-full px-2 py-1.5 h-auto border rounded text-xs truncate focus:outline-none focus:ring-1 focus:ring-info ${
                          isSuggested.cst_icms ? 'border-info bg-info-subtle' :
                          hasOverride(edits, item.id, 'cst_icms', origCst) ? ovBorder : 'border-border'
                        }`}
                      >
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-</SelectItem>
                        {cstOptions.length > 0 && (
                          <>
                            <SelectGroup>
                              <SelectLabel>CST ICMS</SelectLabel>
                              {cstOptions.filter((o) => o.group === 'CST').map((o) => (
                                <SelectItem key={o.code} value={o.code}>{o.label}</SelectItem>
                              ))}
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>CSOSN (Simples Nacional)</SelectLabel>
                              {cstOptions.filter((o) => o.group === 'CSOSN').map((o) => (
                                <SelectItem key={o.code} value={o.code}>{o.label}</SelectItem>
                              ))}
                            </SelectGroup>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    </div>
                  </TableCell>

                  {/* CST PIS - select */}
                  <TableCell className="px-3 py-3 border-r border-border">
                    <Select value={effCstPis} onValueChange={(val) => updateField(item.id, 'cst_pis', val)}>
                      <SelectTrigger
                        className={`w-full px-2 py-1.5 h-auto border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-info ${
                          hasOverride(edits, item.id, 'cst_pis', origCstPis) ? ovBorder : ''
                        }`}
                      >
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-</SelectItem>
                        {cstPisCofinsOptions.map((o) => (
                          <SelectItem key={o.code} value={o.code}>{o.code} - {o.description}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* CST COFINS - select */}
                  <TableCell className="px-3 py-3">
                    <Select value={effCstCofins} onValueChange={(val) => updateField(item.id, 'cst_cofins', val)}>
                      <SelectTrigger
                        className={`w-full px-2 py-1.5 h-auto border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-info ${
                          hasOverride(edits, item.id, 'cst_cofins', origCstCofins) ? ovBorder : ''
                        }`}
                      >
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-</SelectItem>
                        {cstPisCofinsOptions.map((o) => (
                          <SelectItem key={o.code} value={o.code}>{o.code} - {o.description}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              )
            })}
            {(!items || items.length === 0) && (
              <TableRow>
                <TableCell colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nenhum item</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

      {/* Shared datalist for CFOP */}
      <datalist id="cfop-options">
        {cfopOptions.map((o) => (
          <option key={o.code} value={o.code}>{o.code} - {o.description}</option>
        ))}
      </datalist>
    </>
  )
}
