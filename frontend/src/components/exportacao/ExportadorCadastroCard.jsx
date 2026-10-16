import React, { useState } from 'react'
import {
  Globe2,
  Building,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Edit3,
  ShieldCheck,
  FileText,
  Clock,
  User,
  Hash,
  Loader2,
  Info,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  Badge,
  Button,
  IconButton,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  Checkbox,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@bhubai/bhub-design-system'
import { TabelaHistoricoAlteracoes } from '../tributacao/TabelaHistoricoAlteracoes'

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

export function ExportadorCadastroCard({
  empresa,
  cadastroVivo = [],
  historico = [],
  tomadores = [],
  onSalvarCadastro,
  onSubstituirCadastro,
  onRevogarCadastro,
  onCriarTomador,
  onRevogarTomador,
  loading = false,
}) {
  const [showCadastroModal, setShowCadastroModal] = useState(false)
  const [cadastroMode, setCadastroMode] = useState('NOVO') // 'NOVO' | 'SUBSTITUIR'
  const [cadastroToEdit, setCadastroToEdit] = useState(null)

  const [showRevogarModal, setShowRevogarModal] = useState(false)
  const [cadastroToRevoke, setCadastroToRevoke] = useState(null)
  const [revogarCompFim, setRevogarCompFim] = useState('')
  const [revogarMotivo, setRevogarMotivo] = useState('')

  const [showTomadorModal, setShowTomadorModal] = useState(false)
  const [showRevogarTomadorModal, setShowRevogarTomadorModal] = useState(false)
  const [tomadorToRevoke, setTomadorToRevoke] = useState(null)
  const [motivoRevogarTomador, setMotivoRevogarTomador] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState(null)
  const [showHistorico, setShowHistorico] = useState(false)

  // Form de Cadastro (6 campos + checklist de auditoria)
  const [formCadastro, setFormCadastro] = useState({
    subitem_lc116: '01.07',
    competencia_inicio: '202607',
    forma_recebimento: 'CONTRATO_CAMBIO',
    evidencia_recebimento: '',
    receita_mista: false,
    justificativa: '',
    objeto_conferido_por: '',
    objeto_conferido_em: new Date().toISOString(),
    art2_iii_conferido_por: '',
    art2_iii_conferido_em: new Date().toISOString(),
  })

  // Form de Tomador
  const [formTomador, setFormTomador] = useState({
    nome: '',
    apelidosText: '',
    nif: '',
    pais: 'US',
    evidencia: '',
  })

  const ativo = cadastroVivo && cadastroVivo.length > 0 ? cadastroVivo[0] : null

  // Prepara histórico formatado para o componente TabelaHistoricoAlteracoes
  const historicoFormatado = historico.map((h, idx) => ({
    id: h.id || idx,
    quando: h.created_at || h.objeto_conferido_em,
    quem: h.criado_por || h.objeto_conferido_por || 'sistema',
    subitem_lc116: h.subitem_lc116,
    campo: h.revogado_em
      ? 'REVOGADO'
      : h.substituido_por_id
      ? 'SUBSTITUÍDO'
      : 'ATIVO',
    valor_anterior: h.competencia_fim ? `Até ${formatCompetenciaDisplay(h.competencia_fim)}` : 'Vigente',
    valor_novo: `${h.forma_recebimento || '—'} (Mista: ${h.receita_mista ? 'Sim' : 'Não'})`,
    vigencia: `A partir de ${formatCompetenciaDisplay(h.competencia_inicio)}`,
    motivo: h.motivo_revogacao || h.justificativa || 'Cadastro de exportador',
  }))

  const handleOpenNovoCadastro = () => {
    setCadastroMode('NOVO')
    setCadastroToEdit(null)
    setFormCadastro({
      subitem_lc116: '01.07',
      competencia_inicio: '202607',
      forma_recebimento: 'CONTRATO_CAMBIO',
      evidencia_recebimento: '',
      receita_mista: false,
      justificativa: '',
      objeto_conferido_por: '',
      objeto_conferido_em: new Date().toISOString(),
      art2_iii_conferido_por: '',
      art2_iii_conferido_em: new Date().toISOString(),
    })
    setShowCadastroModal(true)
  }

  const handleOpenSubstituirCadastro = (item) => {
    setCadastroMode('SUBSTITUIR')
    setCadastroToEdit(item)
    setFormCadastro({
      subitem_lc116: item.subitem_lc116,
      competencia_inicio: item.competencia_inicio,
      forma_recebimento: item.forma_recebimento || 'CONTRATO_CAMBIO',
      evidencia_recebimento: item.evidencia_recebimento || '',
      receita_mista: Boolean(item.receita_mista),
      justificativa: item.justificativa || '',
      objeto_conferido_por: item.objeto_conferido_por || '',
      objeto_conferido_em: new Date().toISOString(),
      art2_iii_conferido_por: item.art2_iii_conferido_por || '',
      art2_iii_conferido_em: new Date().toISOString(),
    })
    setShowCadastroModal(true)
  }

  const handleSalvarCadastroSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFeedbackMsg(null)

    const payload = {
      subitem_lc116: formCadastro.subitem_lc116.trim(),
      competencia_inicio: formCadastro.competencia_inicio.replace(/[-/]/g, '').trim(),
      tributos_desonerados: ['ISS', 'PIS', 'COFINS'], // Fixado por LC 123 art. 18 §14
      forma_recebimento: formCadastro.forma_recebimento,
      evidencia_recebimento: formCadastro.evidencia_recebimento.trim(),
      receita_mista: Boolean(formCadastro.receita_mista),
      objeto_conferido_por: formCadastro.objeto_conferido_por.trim(),
      objeto_conferido_em: formCadastro.objeto_conferido_em || new Date().toISOString(),
      art2_iii_conferido_por: formCadastro.art2_iii_conferido_por.trim(),
      art2_iii_conferido_em: formCadastro.art2_iii_conferido_em || new Date().toISOString(),
      justificativa: formCadastro.justificativa.trim(),
    }

    try {
      if (cadastroMode === 'SUBSTITUIR' && cadastroToEdit) {
        await onSubstituirCadastro(cadastroToEdit.id, payload)
        setFeedbackMsg({ type: 'success', text: 'Cadastro substituído com sucesso!' })
      } else {
        await onSalvarCadastro(payload)
        setFeedbackMsg({ type: 'success', text: 'Novo cadastro de exportador salvo com sucesso!' })
      }
      setShowCadastroModal(false)
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Falha ao gravar cadastro.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevogarCadastroSubmit = async (e) => {
    e.preventDefault()
    if (!cadastroToRevoke) return
    setSubmitting(true)
    setFeedbackMsg(null)

    try {
      await onRevogarCadastro(cadastroToRevoke.id, {
        competencia_fim: revogarCompFim.replace(/[-/]/g, '').trim(),
        motivo: revogarMotivo.trim(),
      })
      setShowRevogarModal(false)
      setFeedbackMsg({ type: 'success', text: 'Cadastro revogado com sucesso.' })
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Falha ao revogar cadastro.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCriarTomadorSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFeedbackMsg(null)

    const apelidos = formTomador.apelidosText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const payload = {
      nome: formTomador.nome.trim(),
      apelidos,
      nif: formTomador.nif ? formTomador.nif.trim() : null,
      pais: formTomador.pais.trim().toUpperCase(),
      evidencia: formTomador.evidencia.trim(),
    }

    try {
      await onCriarTomador(payload)
      setShowTomadorModal(false)
      setFormTomador({ nome: '', apelidosText: '', nif: '', pais: 'US', evidencia: '' })
      setFeedbackMsg({ type: 'success', text: 'Tomador estrangeiro cadastrado com sucesso!' })
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Falha ao cadastrar tomador.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevogarTomadorSubmit = async (e) => {
    e.preventDefault()
    if (!tomadorToRevoke) return
    setSubmitting(true)
    setFeedbackMsg(null)

    try {
      await onRevogarTomador(tomadorToRevoke.id, {
        motivo: motivoRevogarTomador.trim(),
      })
      setShowRevogarTomadorModal(false)
      setFeedbackMsg({ type: 'success', text: 'Tomador revogado com sucesso.' })
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Falha ao revogar tomador.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card padding="none" className="gap-0 overflow-hidden">
      {/* Cabeçalho */}
      <div className="px-6 py-4 bg-muted border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-info-subtle text-info-text rounded-md">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Cadastro de Exportadores de Serviços & Tomadores
              </h3>
              {ativo ? (
                <Badge variant="success">
                  Habilitado (Vigente)
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Sem cadastro ativo
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enquadramento no benefício fiscal de exportação (LC 116/2003 c/c LC 123/2006 art. 18 §14)
            </p>
          </div>
        </div>

        <div>
          {!ativo ? (
            <Button
              type="button"
              variant="info"
              size="sm"
              onClick={handleOpenNovoCadastro}
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              <span>Novo Cadastro de Exportador</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenSubstituirCadastro(ativo)}
                disabled={loading}
              >
                <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Substituir</span>
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  setCadastroToRevoke(ativo)
                  setRevogarCompFim('')
                  setRevogarMotivo('')
                  setShowRevogarModal(true)
                }}
                disabled={loading}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Revogar</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`mx-6 mt-4 p-3 rounded-md text-xs flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-success-subtle text-success-text border border-success-border'
              : 'bg-destructive-subtle text-destructive-text border border-destructive-border'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-success-text shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-destructive-text shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Conteúdo: Cadastro Ativo */}
      <div className="p-6 space-y-6">
        {ativo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/70 border border-border rounded-lg">
            {/* Campo 1: Subitem */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Subitem LC 116</span>
              <div className="font-mono text-sm font-semibold text-foreground">
                {ativo.subitem_lc116}
              </div>
            </div>

            {/* Campo 2: Competência Início */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Vigência Início</span>
              <div className="text-sm font-medium text-foreground">
                {formatCompetenciaDisplay(ativo.competencia_inicio)}
              </div>
            </div>

            {/* Campo 3: Tributos Desonerados (Fixed) */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Tributos Desonerados</span>
              <div>
                <Badge variant="info">
                  ISS, PIS, COFINS
                </Badge>
                <span className="block text-[10px] text-muted-foreground mt-0.5">
                  LC 123/2006, art. 18, §14 (indivisível)
                </span>
              </div>
            </div>

            {/* Campo 4: Forma de Recebimento */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Forma de Recebimento</span>
              <div className="text-sm text-foreground font-medium">
                {ativo.forma_recebimento}
              </div>
            </div>

            {/* Campo 5: Evidência de Recebimento */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Evidência de Recebimento</span>
              <div className="text-sm text-foreground truncate" title={ativo.evidencia_recebimento}>
                {ativo.evidencia_recebimento || '—'}
              </div>
            </div>

            {/* Campo 6: Receita Mista */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Receita Mista</span>
              <div className="text-sm">
                {ativo.receita_mista ? (
                  <Badge variant="warning">
                    Sim (Mercado Interno e Externo)
                  </Badge>
                ) : (
                  <Badge variant="info">
                    Não (Apenas Externo)
                  </Badge>
                )}
              </div>
            </div>

            {/* Auditoria / Timestamps */}
            <div className="col-span-full pt-3 border-t border-border/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-success-text shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Objeto Social Conferido:</span>{' '}
                  por <span className="font-medium text-foreground">{ativo.objeto_conferido_por}</span> em{' '}
                  <span>{formatDate(ativo.objeto_conferido_em)}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-success-text shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Art. 2º, III Conferido (Resultado):</span>{' '}
                  por <span className="font-medium text-foreground">{ativo.art2_iii_conferido_por}</span> em{' '}
                  <span>{formatDate(ativo.art2_iii_conferido_em)}</span>
                </div>
              </div>
              {ativo.justificativa && (
                <div className="col-span-full text-xs text-muted-foreground bg-card p-2.5 rounded border border-border">
                  <span className="font-semibold text-foreground">Justificativa técnica:</span>{' '}
                  {ativo.justificativa}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 px-4 border border-dashed border-border rounded-lg">
            <Globe2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-medium">
              Esta empresa ainda não possui parâmetros de exportador cadastrados.
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Cadastre o enquadramento do subitem para que as notas com tomador no exterior e ingresso de divisas sejam desoneradas.
            </p>
          </div>
        )}

        {/* Seção: Tomadores Conhecidos */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Tomadores Estrangeiros Conhecidos
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Clientes no exterior vinculados a esta empresa com NIF, país e evidência pré-validados
              </p>
            </div>
            <Button
              type="button"
              variant="info"
              size="sm"
              onClick={() => setShowTomadorModal(true)}
              disabled={loading}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Tomador</span>
            </Button>
          </div>

          <div className="overflow-x-auto border border-border rounded-md">
            <Table className="text-left text-xs bg-card">
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead scope="col" className="px-4 py-2.5 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Nome</TableHead>
                  <TableHead scope="col" className="px-3 py-2.5 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Apelidos / Variações</TableHead>
                  <TableHead scope="col" className="px-3 py-2.5 h-auto font-semibold uppercase tracking-wider text-muted-foreground">NIF / Tax ID</TableHead>
                  <TableHead scope="col" className="px-3 py-2.5 h-auto font-semibold uppercase tracking-wider text-muted-foreground">País</TableHead>
                  <TableHead scope="col" className="px-4 py-2.5 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Evidência</TableHead>
                  <TableHead scope="col" className="px-3 py-2.5 text-right h-auto font-semibold uppercase tracking-wider text-muted-foreground">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tomadores.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="px-4 py-4 text-center text-muted-foreground italic">
                      Nenhum tomador conhecido cadastrado para esta empresa.
                    </TableCell>
                  </TableRow>
                ) : (
                  tomadores.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted transition-colors">
                      <TableCell className="px-4 py-2.5 font-medium text-foreground">{t.nome}</TableCell>
                      <TableCell className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {t.apelidos_normalizados && t.apelidos_normalizados.length > 0 ? (
                            t.apelidos_normalizados.map((a, i) => (
                              <Badge key={i} variant="outline" className="bg-muted">
                                {a}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground italic">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 font-mono text-foreground">{t.nif || '—'}</TableCell>
                      <TableCell className="px-3 py-2.5 font-semibold text-foreground">{t.pais}</TableCell>
                      <TableCell className="px-4 py-2.5 text-muted-foreground truncate max-w-xs" title={t.evidencia}>
                        {t.evidencia || '—'}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-right">
                        <IconButton
                          type="button"
                          aria-label="Revogar tomador"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTomadorToRevoke(t)
                            setMotivoRevogarTomador('')
                            setShowRevogarTomadorModal(true)
                          }}
                          className="text-destructive-text hover:text-destructive-text hover:bg-destructive-subtle"
                          title="Revogar tomador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Toggle para Histórico de Alterações */}
        <div className="pt-2">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setShowHistorico(!showHistorico)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showHistorico ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>Histórico de Versões do Cadastro de Exportadores ({historico.length})</span>
          </Button>

          {showHistorico && (
            <div className="mt-3">
              <TabelaHistoricoAlteracoes historico={historicoFormatado} />
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Salvar / Substituir Cadastro */}
      {showCadastroModal && (
        <Dialog open={showCadastroModal} onOpenChange={(o) => { if (!o && !submitting) setShowCadastroModal(false) }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-left">
              <DialogTitle className="text-sm">
                {cadastroMode === 'SUBSTITUIR'
                  ? 'Substituir Cadastro de Exportador'
                  : 'Novo Cadastro de Exportador de Serviços'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Preencha os dados do enquadramento e o checklist de auditoria fiscal.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSalvarCadastroSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Subitem LC 116 */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Subitem LC 116 *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formCadastro.subitem_lc116}
                    onChange={(e) => setFormCadastro({ ...formCadastro, subitem_lc116: e.target.value })}
                    placeholder="Ex: 01.07"
                    className="w-full h-auto px-2.5 py-1.5 text-xs md:text-xs font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground">Código oficial da lista de serviços</span>
                </div>

                {/* 2. Competência Início */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Competência Início (AAAAMM) *
                  </label>
                  <Input
                    type="text"
                    required
                    maxLength={6}
                    value={formCadastro.competencia_inicio}
                    onChange={(e) => setFormCadastro({ ...formCadastro, competencia_inicio: e.target.value })}
                    placeholder="Ex: 202607"
                    className="w-full h-auto px-2.5 py-1.5 text-xs md:text-xs font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground">Primeiro mês de vigência do benefício</span>
                </div>

                {/* 3. Tributos Desonerados (Read-only) */}
                <div className="col-span-full bg-info-subtle border border-info-border p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-info-text">
                      Tributos Desonerados (Fixado por Lei):
                    </span>
                    <span className="font-semibold text-info-text bg-card px-2 py-0.5 rounded border border-info-border">
                      ISS, PIS e COFINS
                    </span>
                  </div>
                  <p className="text-[10px] text-info-text mt-1">
                    Conforme LC 123/2006, art. 18, §14, a desoneração na exportação é indivisível e restrita a ISS, PIS e Cofins. IRPJ, CSLL e CPP continuam devidos normalmente.
                  </p>
                </div>

                {/* 4. Forma de Recebimento */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Forma de Recebimento *
                  </label>
                  <Select
                    value={formCadastro.forma_recebimento}
                    onValueChange={(v) => setFormCadastro({ ...formCadastro, forma_recebimento: v })}
                  >
                    <SelectTrigger size="sm" className="w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONTRATO_CAMBIO">Contrato de Câmbio (Swift/Bacen)</SelectItem>
                      <SelectItem value="CARTAO_CREDITO">Cartão de Crédito Internacional</SelectItem>
                      <SelectItem value="PLATAFORMA_INTERNACIONAL">Plataforma Internacional (Stripe/PayPal)</SelectItem>
                      <SelectItem value="TRANSFERENCIA_INTERNACIONAL">Transferência Internacional em Moeda Estrangeira</SelectItem>
                      <SelectItem value="OUTRO">Outro Meio Comprovado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 5. Evidência de Recebimento */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Evidência do Ingresso de Divisas *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formCadastro.evidencia_recebimento}
                    onChange={(e) => setFormCadastro({ ...formCadastro, evidencia_recebimento: e.target.value })}
                    placeholder="Ex: Swift do Banco Rendimento / Contrato de câmbio"
                    className="w-full h-auto px-2.5 py-1.5 text-xs md:text-xs"
                  />
                </div>

                {/* 6. Receita Mista */}
                <div className="col-span-full flex items-center gap-2 pt-1">
                  <Checkbox
                    id="chk_receita_mista"
                    checked={formCadastro.receita_mista}
                    onCheckedChange={(v) => setFormCadastro({ ...formCadastro, receita_mista: v === true })}
                  />
                  <label htmlFor="chk_receita_mista" className="font-medium text-foreground cursor-pointer">
                    Empresa opera com Receita Mista (mercado interno e externo sob o mesmo subitem)
                  </label>
                </div>

                {/* Checklist de Auditoria Fiscal */}
                <div className="col-span-full pt-3 border-t border-border space-y-3">
                  <h4 className="font-semibold text-foreground uppercase tracking-wide text-[11px]">
                    Checklist de Auditoria Fiscal Obrigatória
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-muted-foreground mb-0.5">
                        Objeto Social Conferido Por *
                      </label>
                      <Input
                        type="text"
                        required
                        value={formCadastro.objeto_conferido_por}
                        onChange={(e) => setFormCadastro({ ...formCadastro, objeto_conferido_por: e.target.value })}
                        className="w-full h-auto px-2.5 py-1 text-xs md:text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-0.5">
                        Art. 2º, III (Resultado fora do Brasil) Conferido Por *
                      </label>
                      <Input
                        type="text"
                        required
                        value={formCadastro.art2_iii_conferido_por}
                        onChange={(e) => setFormCadastro({ ...formCadastro, art2_iii_conferido_por: e.target.value })}
                        className="w-full h-auto px-2.5 py-1 text-xs md:text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-0.5">
                      Justificativa Técnica do Enquadramento *
                    </label>
                    <Textarea
                      required
                      rows={2}
                      value={formCadastro.justificativa}
                      onChange={(e) => setFormCadastro({ ...formCadastro, justificativa: e.target.value })}
                      placeholder="Descreva a fundamentação da desoneração e comprovação dos três requisitos da LC 116..."
                      className="w-full h-auto px-2.5 py-1.5 text-xs md:text-xs"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={submitting}
                  onClick={() => setShowCadastroModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="info"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{cadastroMode === 'SUBSTITUIR' ? 'Substituir Cadastro' : 'Salvar Cadastro'}</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 2: Revogar Cadastro */}
      {showRevogarModal && (
        <AlertDialog open={showRevogarModal} onOpenChange={(o) => { if (!o && !submitting) setShowRevogarModal(false) }}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm text-destructive-text">
                Revogar Cadastro de Exportador
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                Encerra a vigência do cadastro na competência informada.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form onSubmit={handleRevogarCadastroSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Última Competência Válida (AAAAMM) *
                </label>
                <Input
                  type="text"
                  required
                  maxLength={6}
                  value={revogarCompFim}
                  onChange={(e) => setRevogarCompFim(e.target.value)}
                  placeholder="Ex: 202606"
                  className="w-full h-auto px-2.5 py-1.5 text-xs md:text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">A desoneração cessará a partir do mês seguinte</span>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Motivo da Revogação *
                </label>
                <Textarea
                  required
                  rows={3}
                  value={revogarMotivo}
                  onChange={(e) => setRevogarMotivo(e.target.value)}
                  placeholder="Ex: Alteração de atividade do cliente / cessação de contratos com o exterior..."
                  className="w-full h-auto px-2.5 py-1.5 text-xs md:text-xs"
                />
              </div>

              <AlertDialogFooter className="pt-3 border-t border-border">
                <AlertDialogCancel size="sm" disabled={submitting}>
                  Cancelar
                </AlertDialogCancel>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirmar Revogação</span>
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* MODAL 3: Adicionar Tomador Conhecido */}
      {showTomadorModal && (
        <Dialog open={showTomadorModal} onOpenChange={(o) => { if (!o && !submitting) setShowTomadorModal(false) }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader className="text-left">
              <DialogTitle className="text-sm">
                Adicionar Tomador Estrangeiro Conhecido
              </DialogTitle>
              <DialogDescription className="text-xs">
                Cadastre o tomador no exterior e a evidência documental da relação.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCriarTomadorSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Razão Social / Nome no Exterior *
                </label>
                <Input
                  type="text"
                  required
                  value={formTomador.nome}
                  onChange={(e) => setFormTomador({ ...formTomador, nome: e.target.value })}
                  placeholder="Ex: Google LLC"
                  className="w-full h-auto px-2.5 py-1.5 text-xs md:text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Apelidos / Variações (separados por vírgula)
                </label>
                <Input
                  type="text"
                  value={formTomador.apelidosText}
                  onChange={(e) => setFormTomador({ ...formTomador, apelidosText: e.target.value })}
                  placeholder="Ex: GOOGLE, GOOGLE IRELAND, GOOGLE LLC US"
                  className="w-full h-auto px-2.5 py-1.5 text-xs md:text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    NIF / Tax ID
                  </label>
                  <Input
                    type="text"
                    value={formTomador.nif}
                    onChange={(e) => setFormTomador({ ...formTomador, nif: e.target.value })}
                    placeholder="Ex: US123456789"
                    className="w-full h-auto px-2.5 py-1.5 text-xs md:text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    País (ISO alpha-2) *
                  </label>
                  <Input
                    type="text"
                    required
                    maxLength={2}
                    value={formTomador.pais}
                    onChange={(e) => setFormTomador({ ...formTomador, pais: e.target.value.toUpperCase() })}
                    placeholder="Ex: US, DE, GB"
                    className="w-full h-auto px-2.5 py-1.5 text-xs md:text-xs font-mono uppercase"
                  />
                  <span className="text-[10px] text-muted-foreground">Deve ser diferente de BR</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Evidência Documental *
                </label>
                <Textarea
                  required
                  rows={2}
                  value={formTomador.evidencia}
                  onChange={(e) => setFormTomador({ ...formTomador, evidencia: e.target.value })}
                  placeholder="Ex: Contrato de prestação de serviços nº 2026-X assinado eletronicamente..."
                  className="w-full h-auto px-2.5 py-1.5 text-xs md:text-xs"
                />
              </div>

              <DialogFooter className="pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={submitting}
                  onClick={() => setShowTomadorModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="info"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Salvar Tomador</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 4: Revogar Tomador */}
      {showRevogarTomadorModal && (
        <AlertDialog open={showRevogarTomadorModal} onOpenChange={(o) => { if (!o && !submitting) setShowRevogarTomadorModal(false) }}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm text-destructive-text">
                Revogar Tomador Conhecido
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                Deseja revogar o tomador <strong className="text-foreground">{tomadorToRevoke?.nome}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form onSubmit={handleRevogarTomadorSubmit} className="space-y-4 text-xs">

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Motivo da Revogação *
                </label>
                <Textarea
                  required
                  rows={3}
                  value={motivoRevogarTomador}
                  onChange={(e) => setMotivoRevogarTomador(e.target.value)}
                  placeholder="Ex: Rescisão contratual / Tomador encerrou operações..."
                  className="w-full h-auto px-2.5 py-1.5 text-xs md:text-xs"
                />
              </div>

              <AlertDialogFooter className="pt-3 border-t border-border">
                <AlertDialogCancel size="sm" disabled={submitting}>
                  Cancelar
                </AlertDialogCancel>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirmar Revogação</span>
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  )
}

export default ExportadorCadastroCard
