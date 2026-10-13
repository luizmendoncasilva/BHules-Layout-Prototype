import React, { useState } from 'react'
import { Edit2, X, AlertCircle, Save } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  IconButton,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@bhubai/bhub-design-system'

function formatMoney(value) {
  const num = typeof value === 'number' ? value : parseFloat(value || 0)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num)
}

function formatInt(value) {
  const num = typeof value === 'number' ? value : parseInt(value || 0, 10)
  return new Intl.NumberFormat('pt-BR').format(num)
}

function formatCompetenciaDisplay(comp) {
  if (!comp) return '—'
  const s = String(comp).trim()
  if (s.length === 6 && !s.includes('/')) {
    return `${s.slice(4, 6)}/${s.slice(0, 4)}`
  }
  return s
}

// O que se parametriza é o anexo / Fator R do código; o ID de atividade é
// derivado por linha (anexo + Fator R + ISS retido) pelo backend, como na
// apuração (review C3).
const OPCOES_ANEXO = [
  { value: 'III', label: 'Anexo III (não sujeito ao Fator R)' },
  { value: 'IV', label: 'Anexo IV' },
  { value: 'FATOR_R', label: 'Fator R (Anexo III ou V conforme a folha)' },
]

// Pré-seleção pelo que o backend diz da linha (`sujeito_fator_r`, a mesma
// regra que deriva o ID), não por texto do anexo/detalhe.
function opcaoAnexoDoItem(item) {
  if (item.sujeito_fator_r) return 'FATOR_R'
  if (item.anexo === 'IV') return 'IV'
  return 'III'
}

export function TabelaCodigosServico({
  servicos = [],
  competencia = '',
  fatorR = null,
  onSalvar,
}) {
  // Uma linha por (código, ISS retido) — AD-052. A edição é por LINHA
  // (chave abaixo), mas a parametrização salva é por CÓDIGO: vale para as
  // duas situações e o ID de cada linha é derivado pelo backend.
  const [editingLinha, setEditingLinha] = useState(null)
  const [selectedAnexo, setSelectedAnexo] = useState('III')
  const [selectedVigencia, setSelectedVigencia] = useState(competencia || '')
  const [motivo, setMotivo] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Totais (somam as duas situações de ISS); códigos contados uma vez
  const totalCodigos = new Set(servicos.map((s) => s.subitem_lc116)).size
  const totalNotas = servicos.reduce((acc, s) => acc + (s.notas || 0), 0)
  const totalBruto = servicos.reduce((acc, s) => acc + (s.valor_bruto || 0), 0)
  const totalCanceladas = servicos.reduce((acc, s) => acc + (s.canceladas || 0), 0)
  const totalBase = servicos.reduce((acc, s) => acc + (s.base_tributavel || 0), 0)

  const chaveLinha = (item) => `${item.subitem_lc116}|${item.iss_retido ? 'retido' : 'livre'}`

  const handleStartEdit = (item) => {
    setEditingLinha(chaveLinha(item))
    setSelectedAnexo(opcaoAnexoDoItem(item))
    setSelectedVigencia(competencia || item.vigencia_inicio || '202607')
    setMotivo('')
    setErrorMsg('')
  }

  const handleCancelEdit = () => {
    setEditingLinha(null)
    setErrorMsg('')
  }

  // Anexo gravado e detalhe, a partir da opção escolhida. "Fator R" grava
  // Anexo III com sujeito_fator_r=true: quem decide III × V é o Fator R REAL
  // na apuração de cada competência — nunca o percentual mostrado aqui.
  const getAnexoDerivado = () => {
    if (selectedAnexo === 'FATOR_R') {
      const temFatorR =
        fatorR && fatorR.percentual !== null && fatorR.percentual !== undefined
      const pctStr = temFatorR ? `${fatorR.percentual.toFixed(2)}%`.replace('.', ',') : null
      return {
        anexo: 'III',
        sujeito_fator_r: true,
        detalhe: temFatorR
          ? `sujeito ao Fator R (hoje ${pctStr}); III ou V decidido na apuração`
          : 'sujeito ao Fator R (não apurado); III ou V decidido na apuração',
      }
    }
    const anexo = selectedAnexo === 'IV' ? 'IV' : 'III'
    return {
      anexo,
      sujeito_fator_r: false,
      detalhe: `Anexo ${anexo} fixo, não sujeito ao Fator R`,
    }
  }

  const handleSave = async (item) => {
    if (!motivo || motivo.trim().length < 5) {
      setErrorMsg('O motivo da alteração é obrigatório (ao menos 5 caracteres).')
      return
    }

    const derivado = getAnexoDerivado()
    setSaving(true)
    setErrorMsg('')

    try {
      if (onSalvar) {
        await onSalvar({
          subitem_lc116: item.subitem_lc116,
          anexo: derivado.anexo,
          sujeito_fator_r: derivado.sujeito_fator_r,
          competencia_inicio: selectedVigencia,
          motivo: motivo.trim(),
        })
      }
      setEditingLinha(null)
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao salvar alteração.')
    } finally {
      setSaving(false)
    }
  }

  const anexoDerivado = getAnexoDerivado()

  return (
    <Card padding="none" className="gap-0 mb-6 overflow-hidden">
      {/* Cabeçalho da Tabela */}
      <div className="px-6 py-4 border-b border-border bg-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Tributação por Código de Serviço
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            O id da atividade é o que vai no envio da declaração ao SERPRO
          </p>
        </div>
      </div>

      {/* Tabela Responsiva */}
      <Table className="min-w-full text-left text-xs">
          <TableHeader className="bg-muted text-muted-foreground font-semibold uppercase tracking-wider">
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead scope="col" className="px-4 py-3 h-auto text-xs">Código</TableHead>
              <TableHead scope="col" className="px-4 py-3 min-w-[200px] h-auto text-xs">Descrição do Serviço</TableHead>
              <TableHead scope="col" className="px-3 py-3 text-center whitespace-nowrap h-auto text-xs">ISS retido</TableHead>
              <TableHead scope="col" className="px-3 py-3 text-right h-auto text-xs">Notas</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-right h-auto text-xs">Valor Bruto</TableHead>
              <TableHead scope="col" className="px-3 py-3 text-right h-auto text-xs">Canceladas</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-right font-bold text-foreground h-auto text-xs">Base Tributável</TableHead>
              <TableHead scope="col" className="px-4 py-3 h-auto text-xs">Anexo</TableHead>
              <TableHead scope="col" className="px-3 py-3 text-center h-auto text-xs">ID Atividade</TableHead>
              <TableHead scope="col" className="px-4 py-3 min-w-[180px] h-auto text-xs">Atividade no PGDAS-D</TableHead>
              <TableHead scope="col" className="px-3 py-3 h-auto text-xs">Vigência</TableHead>
              <TableHead scope="col" className="px-3 py-3 text-center h-auto text-xs">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-card">
            {servicos.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={12} className="px-6 py-8 text-xs text-center text-muted-foreground whitespace-normal">
                  Nenhuma NFS-e emitida encontrada para esta empresa na competência informada.
                </TableCell>
              </TableRow>
            ) : (
              servicos.map((item) => {
                const linha = chaveLinha(item)
                const isEditing = editingLinha === linha

                return (
                  <React.Fragment key={linha}>
                    <TableRow className={`hover:bg-muted/75 transition-colors ${isEditing ? 'bg-info-subtle' : ''}`}>
                      <TableCell className="px-4 py-3 font-mono font-bold text-foreground whitespace-nowrap text-xs">
                        {item.subitem_lc116}
                        {item.subitem_inferido && (
                          <Badge
                            variant="warning"
                            className="ml-2 px-1.5 font-sans text-[10px]"
                            title="Subitem inferido do código do município da nota (ex.: '1706' → 17.06), sem LC 116, cTribNac nem de-para. Confirme antes de fechar a apuração."
                          >
                            inferido
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-foreground max-w-xs truncate text-xs" title={item.descricao}>
                        {item.descricao || '—'}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-center whitespace-nowrap text-xs">
                        {item.iss_retido ? (
                          <Badge
                            variant="warning"
                            className="px-2 text-[11px] font-semibold"
                            title="Notas com ISS retido/substituído pelo tomador: a apuração usa o ID de atividade 'com retenção'."
                          >
                            Sim
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Não</span>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right font-medium text-foreground whitespace-nowrap text-xs">
                        {formatInt(item.notas)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-medium text-foreground whitespace-nowrap text-xs">
                        {formatMoney(item.valor_bruto)}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right whitespace-nowrap text-muted-foreground text-xs">
                        {item.canceladas > 0 ? (
                          <span className="text-destructive-text font-medium">
                            -{formatMoney(item.canceladas)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-bold text-foreground whitespace-nowrap text-xs">
                        {formatMoney(item.base_tributavel)}
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-xs">
                        {item.anexo ? (
                          <div className="flex flex-col">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold w-fit ${
                                item.anexo === 'V'
                                  ? 'bg-magic-subtle text-magic-bold'
                                  : item.anexo === 'III'
                                  ? 'bg-success-subtle text-success-text'
                                  : item.anexo === 'IV'
                                  ? 'bg-info-subtle text-info-text'
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              Anexo {item.anexo}
                            </span>
                            {item.anexo_detalhe && (
                              <span className="text-[10px] text-muted-foreground mt-0.5">
                                {item.anexo_detalhe}
                              </span>
                            )}
                            {item.resolucao_mista && (
                              <span
                                className="text-[10px] text-warning-text mt-0.5"
                                title="As notas deste código resolvem o anexo de formas diferentes. O anexo mostrado é o predominante em valor; o cálculo do DAS aplica cada nota pelo seu."
                              >
                                Resolução mista
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">não definido</span>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-center whitespace-nowrap text-xs">
                        {item.id_atividade ? (
                          <span className="inline-flex items-center justify-center w-7 h-6 rounded bg-muted font-mono font-bold text-foreground">
                            {item.id_atividade}
                          </span>
                        ) : (
                          <Badge variant="warning" className="px-2 text-[10px]">
                            pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-foreground max-w-sm truncate text-xs" title={item.atividade_pgdasd}>
                        {item.atividade_pgdasd || <span className="text-muted-foreground italic">não configurado</span>}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {item.vigencia_inicio ? `desde ${formatCompetenciaDisplay(item.vigencia_inicio)}` : '—'}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-center whitespace-nowrap text-xs">
                        <Button
                          type="button"
                          variant="info"
                          size="sm"
                          onClick={() => handleStartEdit(item)}
                          className="h-auto py-1 gap-1 text-xs"
                        >
                          <Edit2 className="w-3 h-3" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Formulário Inline de Edição Expansível */}
                    {isEditing && (
                      <TableRow className="bg-info-subtle hover:bg-info-subtle border-y-2 border-info-border">
                        <TableCell colSpan={12} className="p-4 text-xs whitespace-normal">
                          <div className="bg-card border border-info-border rounded-lg p-4 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-border pb-2.5">
                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-info-text">
                                  Editar Parametrização — Código {item.subitem_lc116}
                                </h4>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  A parametrização vale para o código inteiro (com e sem ISS retido).
                                </p>
                              </div>
                              <IconButton
                                type="button"
                                aria-label="Fechar edição"
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="w-4 h-4" />
                              </IconButton>
                            </div>

                            {errorMsg && (
                              <div className="flex items-center gap-2 p-2.5 bg-destructive-subtle border border-destructive-border rounded text-destructive-text text-xs">
                                <AlertCircle className="w-4 h-4 text-destructive-text shrink-0" />
                                <span>{errorMsg}</span>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Campo 1: ANEXO / FATOR R (o que se parametriza) */}
                              <div className="lg:col-span-2">
                                <label
                                  htmlFor={`anexo-${linha}`}
                                  className="block text-[11px] font-bold uppercase text-foreground mb-1"
                                >
                                  Anexo do código
                                </label>
                                <Select value={selectedAnexo} onValueChange={setSelectedAnexo}>
                                  <SelectTrigger
                                    id={`anexo-${linha}`}
                                    size="sm"
                                    className="w-full text-xs bg-card"
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {OPCOES_ANEXO.map((op) => (
                                      <SelectItem key={op.value} value={op.value} className="text-xs">
                                        {op.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="text-[10px] text-muted-foreground mt-1 block">
                                  Grava: Anexo {anexoDerivado.anexo} — {anexoDerivado.detalhe}
                                </span>
                              </div>

                              {/* Campo 2: ID ATIVIDADE (derivado, somente leitura) */}
                              <div>
                                <label className="block text-[11px] font-bold uppercase text-foreground mb-1">
                                  ID Atividade desta linha
                                </label>
                                <div className="p-2 border border-border bg-muted rounded-md">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-foreground" data-testid="id-derivado">
                                      {item.id_atividade ?? 'pendente'}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      ISS retido: {item.iss_retido ? 'Sim' : 'Não'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5">
                                    derivado do anexo, do Fator R e do ISS retido, como na apuração
                                  </div>
                                </div>
                              </div>

                              {/* Campo 3: VIGENTE A PARTIR DE */}
                              <div>
                                <label className="block text-[11px] font-bold uppercase text-foreground mb-1">
                                  Vigente a partir de
                                </label>
                                <Input
                                  type="text"
                                  value={selectedVigencia}
                                  onChange={(e) => setSelectedVigencia(e.target.value)}
                                  placeholder="AAAAMM ou MM/AAAA"
                                  className="h-auto p-2 text-xs md:text-xs bg-card font-mono"
                                />
                                <span className="text-[10px] text-muted-foreground mt-1 block">
                                  não altera competências anteriores
                                </span>
                              </div>
                            </div>

                            {/* Campo 4: MOTIVO DA ALTERAÇÃO */}
                            <div>
                              <label className="block text-[11px] font-bold uppercase text-foreground mb-1">
                                Motivo da Alteração <span className="text-destructive-text">*</span>
                              </label>
                              <Input
                                type="text"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder="Descreva o motivo da alteração (fica registrado no histórico de auditoria)"
                                className="h-auto p-2 text-xs md:text-xs bg-card"
                              />
                            </div>

                            {/* Botões de Ação */}
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEdit}
                                disabled={saving}
                                className="text-xs"
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="button"
                                variant="info"
                                size="sm"
                                onClick={() => handleSave(item)}
                                disabled={saving}
                                className="gap-1.5 px-4 text-xs font-semibold"
                              >
                                {saving ? (
                                  'Salvando...'
                                ) : (
                                  <>
                                    <Save className="w-3.5 h-3.5" />
                                    Salvar Parametrização
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>

          {/* Rodapé com Linha de Totais */}
          {servicos.length > 0 && (
            <TableFooter className="bg-muted font-bold text-foreground border-t-2 border-border">
              <TableRow className="hover:bg-muted">
                <TableCell className="px-4 py-3 text-xs">TOTAIS</TableCell>
                <TableCell className="px-4 py-3 text-muted-foreground font-normal text-xs">
                  {totalCodigos} {totalCodigos === 1 ? 'código' : 'códigos'}
                </TableCell>
                <TableCell className="px-3 py-3 text-xs"></TableCell>
                <TableCell className="px-3 py-3 text-right font-mono text-xs">{formatInt(totalNotas)}</TableCell>
                <TableCell className="px-4 py-3 text-right font-mono text-xs">{formatMoney(totalBruto)}</TableCell>
                <TableCell className="px-3 py-3 text-right font-mono text-destructive-text text-xs">
                  {totalCanceladas > 0 ? `-${formatMoney(totalCanceladas)}` : '—'}
                </TableCell>
                <TableCell className="px-4 py-3 text-right font-mono font-extrabold text-success-text text-xs">
                  {formatMoney(totalBase)}
                </TableCell>
                <TableCell colSpan={5} className="px-4 py-3 text-xs"></TableCell>
              </TableRow>
            </TableFooter>
          )}
      </Table>
    </Card>
  )
}
