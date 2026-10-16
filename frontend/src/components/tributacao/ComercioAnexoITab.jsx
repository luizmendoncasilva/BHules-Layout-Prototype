import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Package,
  Layers,
  Tags,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Store,
  FlaskConical,
  Info,
  Clock,
  Pencil,
  ListTree,
  X,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  IconButton,
  Input,
  LinkButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@bhubai/bhub-design-system'
import {
  getNaturezaResumo,
  getNaturezaItens,
  getNaturezaPorCfop,
  exportNaturezaXlsx,
  listarVarejistaArt17,
  salvarVarejistaArt17,
  setNaturezaPiloto,
  ajustarNaturezaItem,
  ajustarNaturezaLote,
  revogarAjusteNatureza,
  listarAjustesItem,
} from '../../services/naturezaItensService'
import { ROLE_FISCAL_ADM, useHasRole } from '../../auth/roles'
import { useBuscaComContexto } from './useBuscaComContexto'

/**
 * Sub-aba "Comércio · Anexo I" (FIS-1227, design C12): conferência da natureza da
 * receita por item de NF-e de saída própria. A natureza mostrada é a EFETIVA:
 * o ajuste da Célula (FIS-1253) ou, sem ele, a calculada. Escrita: ajuste por
 * item e em lote por CFOP (só fiscal-adms), cadastro da condição de varejista
 * (art. 17) e o toggle da empresa no piloto.
 *
 * Protótipo: porta do frontend oficial no design system BHub (componentes de
 * @bhubai/bhub-design-system e tokens semânticos); comportamento igual.
 */

export const NATUREZAS = {
  G1: 'Revenda tributada',
  G2: 'Monofásica / alíquota zero',
  G3: 'Com ST de ICMS',
  G4: 'Monofásica + ST de ICMS',
  G5: 'Exportação',
}

// Espelho do dict do backend (contrato §Códigos): severidade e origem por código.
export const SINAIS = {
  NCM_INVALIDO: { severidade: 'PENDENCIA', origem: 'RN-07' },
  TABELA_AMBIGUA: { severidade: 'PENDENCIA', origem: 'RN-04' },
  EMITENTE_DESCONHECIDO: { severidade: 'ALERTA', origem: 'CS-02' },
  IMPORTACAO_DIRETA: { severidade: 'ALERTA', origem: 'VD-07/VD-08' },
  BEBIDA_FRIA_SEM_VAREJISTA: { severidade: 'ALERTA', origem: 'RN-06/CS-07' },
  NCM_SEM_DESCRICAO_COERENTE: { severidade: 'ALERTA', origem: 'RN-05' },
  CST_MONOFASICO_SEM_TABELA: { severidade: 'ALERTA', origem: 'RN-22' },
  CST_MONOFASICO_CONTRARIADO_PELA_TABELA: { severidade: 'ALERTA', origem: 'RN-22' },
  DOC_SEM_ITENS_NATUREZA_INDETERMINADA: { severidade: 'ALERTA', origem: 'CS-01' },
  EXCLUSAO_TABELA: { severidade: 'INFO', origem: 'RN-04' },
  CONDICAO_NAO_VERIFICAVEL: { severidade: 'INFO', origem: 'RN-04' },
  TIPI_NAO_CARREGADA: { severidade: 'INFO', origem: 'RN-07' },
}

const PAGE_SIZE = 50

// Valor "sem filtro" dos Selects do DS (o Radix não aceita SelectItem com value vazio).
const TODOS = '__todos__'

// Ajuste gravado em empresa fora do piloto efetivo: fica no histórico, mas o DAS não muda.
export const AVISO_SEM_EFEITO_DAS = 'sem efeito no DAS enquanto a empresa não estiver no piloto'

// Causa real de um ajuste não mudar o DAS, pelo motivo que o backend devolve (efeitoNoDasMotivo).
export const AVISOS_SEM_EFEITO_DAS = {
  FORA_DO_PILOTO: AVISO_SEM_EFEITO_DAS,
  TABELA_INDISPONIVEL: 'sem efeito no DAS: tabela de natureza indisponível na competência',
  NOTA_FORA_DA_APURACAO: 'sem efeito no DAS: cupom (NFC-e/CF-e) fora da apuração',
}

export function avisoSemEfeito(motivo) {
  return AVISOS_SEM_EFEITO_DAS[motivo] || AVISO_SEM_EFEITO_DAS
}

function competenciaComHifen(comp) {
  const c = String(comp || '')
  return c.length === 6 ? `${c.slice(0, 4)}-${c.slice(4, 6)}` : c
}

// Valor do filtro de CFOP que abre o grupo de itens sem CFOP (contrato do backend).
export const CFOP_VAZIO = 'vazio'

// idAtividade do PGDAS-D por item (FIS-1253): a matriz natureza × ID aceito e os
// rótulos vêm do resumo (idsAtividadePorNatureza, atividades). A tela não espelha
// a regra; o backend valida e devolve 422 com a combinação aceita.
function mapaAtividades(resumo) {
  const atividades = resumo?.atividades || []
  return {
    rotulo: Object.fromEntries(atividades.map((a) => [a.id, a.rotulo])),
    anexoII: atividades.filter((a) => a.anexo === 'II').map((a) => a.id),
    porNatureza: resumo?.idsAtividadePorNatureza || {},
    // Exportação direta (CFOP 7xxx, destinatário no exterior): qualquer natureza, só estes.
    exportacao: resumo?.idsAtividadeExportacao || [],
    // ID derivado de cada natureza (interno) e na exportação: o "Manter" mostra o que vale.
    derivados: resumo?.idsAtividadeDerivados || {},
    derivadoExportacao: resumo?.idAtividadeDerivadoExportacao ?? null,
  }
}

// O backend marca os CFOPs (remessaVerificar); a tela só põe o selo. A correção é a FIS-1251.
export const SELO_REMESSA = 'verificar: remessa contada como receita'

const SEVERIDADE_VARIANTE = {
  PENDENCIA: 'destructive',
  ALERTA: 'warning',
  INFO: 'secondary',
}

// Badge compacto para selos dentro de tabela.
const SELO = 'h-auto px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap'

function formatMoney(value) {
  const num = typeof value === 'number' ? value : parseFloat(value || 0)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(num) ? num : 0
  )
}

function formatInt(value) {
  return new Intl.NumberFormat('pt-BR').format(Number(value || 0))
}

function qtdItens(n) {
  return `${formatInt(n)} ${Number(n) === 1 ? 'item' : 'itens'}`
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = String(iso).slice(0, 10).split('-')
  return d && m && y ? `${d}/${m}/${y}` : iso
}

function competenciaLabel(comp) {
  const c = String(comp || '')
  return c.length === 6 ? `${c.slice(4, 6)}/${c.slice(0, 4)}` : c
}

function KpiCard({ titulo, icon: Icon, iconClass, children, rodape }) {
  return (
    <Card padding="none" className="gap-0 p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{titulo}</span>
        <div className={`p-1.5 rounded ${iconClass}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-2">{children}</div>
      {rodape && <div className="text-xs text-muted-foreground mt-1">{rodape}</div>}
    </Card>
  )
}

function SecaoCabecalho({ icon: Icon, iconClass = 'text-primary', titulo, children }) {
  return (
    <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-2">
      <Icon className={`w-4 h-4 ${iconClass}`} />
      <h3 className="text-sm font-semibold text-foreground">{titulo}</h3>
      {children}
    </div>
  )
}

function ModoBadge({ modo }) {
  if (!modo) return null
  const ativo = modo === 'ATIVO'
  return (
    <Badge
      variant={ativo ? 'success' : 'warning'}
      className="text-[11px] font-bold"
      title={ativo ? 'A natureza entra na apuração do PGDAS-D.' : 'Modo sombra: só registra; a apuração continua como hoje.'}
    >
      {modo}
    </Badge>
  )
}

function SeloRemessa() {
  return (
    <Badge
      variant="warning"
      className={`${SELO} mt-0.5`}
      title="CFOP que não é venda e hoje entra como receita (FIS-1251)."
    >
      {SELO_REMESSA}
    </Badge>
  )
}

function SinalChip({ sinal }) {
  const sev = sinal.severidade || SINAIS[sinal.codigo]?.severidade || 'INFO'
  return (
    <Badge
      variant={SEVERIDADE_VARIANTE[sev] || 'secondary'}
      className={SELO}
      title={`${sinal.origem || ''} ${sinal.acaoEsperada || ''}`.trim()}
    >
      {sinal.codigo}
    </Badge>
  )
}

function LinkAcao({ className = '', ...props }) {
  return <LinkButton className={`text-xs font-semibold ${className}`} {...props} />
}

export default function ComercioAnexoITab({ companyId, competencia, reloadKey = 0 }) {
  const [page, setPage] = useState(1)
  const [filtros, setFiltros] = useState({ natureza: '', sinal: '', cfop: '', anexo: '' })
  const [cfopDigitado, setCfopDigitado] = useState('')

  // Ajuste gravado: recarrega resumo, lista e resumo por CFOP.
  const [versaoAjuste, setVersaoAjuste] = useState(0)
  // { tipo: 'item', item } | { tipo: 'lote', linha } | null
  const [edicao, setEdicao] = useState(null)
  const podeAjustar = useHasRole(ROLE_FISCAL_ADM)

  const [toast, setToast] = useState(null)
  const [exportando, setExportando] = useState(false)

  // Contexto atual (empresa|competência) e senha da última requisição de cada busca:
  // resposta de contexto ou de requisição antiga é descartada (review #834).
  const contexto = `${companyId}|${competencia}`
  const contextoRef = useRef(contexto)
  contextoRef.current = contexto
  const timerToast = useRef(null)

  const mostrarToast = useCallback((tipo, texto) => {
    // Um toast novo cancela o timer do anterior (review #834).
    clearTimeout(timerToast.current)
    setToast({ tipo, texto })
    timerToast.current = setTimeout(() => setToast(null), 5000)
  }, [])

  useEffect(() => () => clearTimeout(timerToast.current), [])

  // Três fontes, cada uma com guarda de requisição e erro próprio (review #834).
  const buscaResumo = useBuscaComContexto(
    () => getNaturezaResumo(companyId, competencia),
    [companyId, competencia, reloadKey, versaoAjuste],
    { ativo: Boolean(companyId) }
  )
  const resumo = buscaResumo.dados
  const temRodada = Boolean(resumo?.calculadoEm)
  const buscaLista = useBuscaComContexto(
    () =>
      getNaturezaItens(companyId, competencia, page, {
        natureza: filtros.natureza || undefined,
        sinal: filtros.sinal || undefined,
        cfop: filtros.cfop || undefined,
        anexo: filtros.anexo || undefined,
        pageSize: PAGE_SIZE,
      }),
    [companyId, competencia, page, filtros, reloadKey, versaoAjuste],
    { ativo: Boolean(companyId) && temRodada }
  )
  const lista = buscaLista.dados
  const buscaPorCfop = useBuscaComContexto(
    () => getNaturezaPorCfop(companyId, competencia),
    [companyId, competencia, reloadKey, versaoAjuste],
    { ativo: Boolean(companyId) && temRodada }
  )
  const porCfop = buscaPorCfop.dados

  const recarregarTudo = () => {
    buscaResumo.recarregar()
    buscaLista.recarregar()
    buscaPorCfop.recarregar()
  }

  // Empresa/competência mudou: volta à página 1 sem filtro, já no render (antes dos
  // efeitos), para a lista não buscar duas vezes — uma com os filtros velhos — e
  // invalida o que estiver em voo nas três fontes.
  const [contextoEstado, setContextoEstado] = useState(contexto)
  if (contextoEstado !== contexto) {
    setContextoEstado(contexto)
    setPage(1)
    setFiltros({ natureza: '', sinal: '', cfop: '', anexo: '' })
    setCfopDigitado('')
    setEdicao(null)
    buscaResumo.limpar()
    buscaLista.limpar()
    buscaPorCfop.limpar()
  }

  const atividades = useMemo(() => mapaAtividades(resumo), [resumo])

  // Lote sem nada a gravar: informação, não sucesso, e não recarrega (review #835).
  const aoInformar = (texto) => {
    setEdicao(null)
    mostrarToast('info', texto)
  }

  const aoAjustar = (texto, res) => {
    setEdicao(null)
    mostrarToast(
      'ok',
      res?.efeitoNoDas === false ? `${texto} Atenção: ${avisoSemEfeito(res.efeitoNoDasMotivo)}.` : texto
    )
    setPage(1)
    setVersaoAjuste((v) => v + 1)
  }

  const totalPaginas = lista ? Math.max(1, Math.ceil((lista.total || 0) / (lista.pageSize || PAGE_SIZE))) : 1

  // Pendências e alertas da competência inteira (resumo.sinaisPorCodigo); INFO fica só na tabela.
  const sinaisDaCompetencia = useMemo(() => {
    return (resumo?.sinaisPorCodigo || [])
      .map((s) => ({
        ...s,
        severidade: s.severidade || SINAIS[s.codigo]?.severidade,
        origem: s.origem || SINAIS[s.codigo]?.origem || '—',
      }))
      .filter((s) => s.severidade === 'PENDENCIA' || s.severidade === 'ALERTA')
      .sort((a, b) =>
        a.severidade === b.severidade ? (b.itens || 0) - (a.itens || 0) : a.severidade === 'PENDENCIA' ? -1 : 1
      )
  }, [resumo])

  const aplicarFiltro = (campo, valor) => {
    setFiltros((f) => ({ ...f, [campo]: valor }))
    if (campo === 'cfop') setCfopDigitado(valor === CFOP_VAZIO ? '' : valor)
    setPage(1)
  }

  // CFOP digitado só vira filtro com 4 dígitos; abaixo disso o filtro aplicado sai
  // (review #834) e volta quando completar 4 dígitos de novo.
  const digitarCfop = (valor) => {
    const so = valor.replace(/\D/g, '').slice(0, 4)
    setCfopDigitado(so)
    if (so.length === 4) {
      aplicarFiltro('cfop', so)
    } else if (filtros.cfop) {
      setFiltros((f) => ({ ...f, cfop: '' }))
      setPage(1)
    }
  }

  const temFiltro = Boolean(filtros.natureza || filtros.sinal || filtros.cfop || filtros.anexo)

  const limparFiltros = () => {
    setFiltros({ natureza: '', sinal: '', cfop: '', anexo: '' })
    setCfopDigitado('')
    setPage(1)
  }

  // "Filtrar" numa linha CFOP × natureza: os dois filtros da linha, sem o de sinal.
  const filtrarLinha = (linha) => {
    // A linha é do Anexo I ou dos "movidos para o Anexo II": o filtro leva o anexo também.
    setFiltros({ natureza: linha.natureza || '', sinal: '', cfop: linha.cfop || CFOP_VAZIO, anexo: linha.anexo || 'I' })
    setCfopDigitado(linha.cfop || '')
    setPage(1)
  }

  const descricaoFiltros = () =>
    [
      filtros.cfop ? (filtros.cfop === CFOP_VAZIO ? 'sem CFOP' : `CFOP ${filtros.cfop}`) : null,
      filtros.natureza ? `natureza ${filtros.natureza}` : null,
      filtros.anexo ? `Anexo ${filtros.anexo}` : null,
      filtros.sinal ? `sinal ${filtros.sinal}` : null,
    ]
      .filter(Boolean)
      .join(', ')

  const handleExport = async () => {
    setExportando(true)
    try {
      const nome = await exportNaturezaXlsx(companyId, competencia, {
        natureza: filtros.natureza || undefined,
        sinal: filtros.sinal || undefined,
        cfop: filtros.cfop || undefined,
        anexo: filtros.anexo || undefined,
      })
      const filtro = descricaoFiltros()
      mostrarToast('ok', `Arquivo ${nome} baixado${filtro ? ` (filtro: ${filtro})` : ''}.`)
    } catch (err) {
      console.error('Erro ao exportar XLSX:', err)
      mostrarToast('erro', err.message || 'Falha ao exportar o XLSX.')
    } finally {
      setExportando(false)
    }
  }

  if (!companyId) {
    return (
      <Card padding="none" className="gap-0 text-center py-16">
        <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground">Selecione uma empresa</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
          Escolha a empresa e a competência para conferir a natureza da receita por item.
        </p>
      </Card>
    )
  }

  const estiloToast = {
    erro: { caixa: 'bg-destructive-subtle border-destructive-border text-destructive-text', Icone: AlertCircle },
    info: { caixa: 'bg-info-subtle border-info-border text-info-text', Icone: Info },
    ok: { caixa: 'bg-success-subtle border-success-border text-success-text', Icone: CheckCircle2 },
  }

  return (
    <div className="space-y-6">
      {toast && (() => {
        const { caixa, Icone } = estiloToast[toast.tipo] || estiloToast.ok
        return (
          <div role="status" className={`px-4 py-3 rounded-lg flex items-center gap-2 shadow-xs border ${caixa}`}>
            <Icone className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">{toast.texto}</span>
          </div>
        )
      })()}

      {(buscaResumo.erro || buscaLista.erro) && (
        <div
          role="alert"
          className="bg-destructive-subtle border border-destructive-border text-destructive-text px-4 py-3 rounded-lg flex items-center justify-between gap-2 shadow-xs"
        >
          <div className="flex flex-col gap-0.5">
            {/* Erro por fonte: o sucesso de uma não apaga o erro da outra. */}
            {buscaResumo.erro && (
              <span className="text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Resumo: {buscaResumo.erro}
              </span>
            )}
            {buscaLista.erro && (
              <span className="text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Itens: {buscaLista.erro}
              </span>
            )}
          </div>
          <LinkButton onClick={recarregarTudo} className="text-xs font-semibold text-inherit hover:opacity-80 hover:text-inherit">
            Tentar novamente
          </LinkButton>
        </div>
      )}

      {buscaResumo.carregando && !resumo && (
        <Card padding="none" className="gap-0 flex flex-col items-center justify-center py-20">
          <Spinner className="w-8 h-8 text-primary mb-3" />
          <p className="text-sm text-muted-foreground font-medium">
            Carregando a natureza dos itens de {competenciaLabel(competencia)}...
          </p>
        </Card>
      )}

      {resumo && !temRodada && (
        <Card padding="none" className="gap-0 text-center py-12">
          <Clock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">Sem rodada para esta competência</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mt-1">
            O classificador de natureza ainda não rodou para {competenciaLabel(competencia)} nesta empresa. A apuração
            segue como hoje; a conferência aparece aqui depois da próxima rodada.
          </p>
        </Card>
      )}

      {resumo && temRodada && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ModoBadge modo={resumo.modo} />
              <span>
                Rodada de {formatDateTime(resumo.calculadoEm)} · competência {competenciaLabel(competencia)}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exportando}>
              <Download className={`w-3.5 h-3.5 ${exportando ? 'animate-pulse text-primary' : 'text-muted-foreground'}`} />
              <span>Exportar XLSX</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard
              titulo="Receita de mercadoria"
              icon={Package}
              iconClass="bg-success-subtle text-success-text"
              rodape={`${formatInt(resumo.itens)} itens`}
            >
              <div className="text-2xl font-bold text-foreground tracking-tight">{formatMoney(resumo.receitaTotal)}</div>
              {resumo.anexoII?.itens > 0 && (
                <div className="text-xs text-muted-foreground mt-1" data-testid="anexo-ii-resumo">
                  Anexo I {formatMoney(resumo.receitaAnexoI)} · movidos para o Anexo II{' '}
                  {formatMoney(resumo.anexoII.valor)} ({qtdItens(resumo.anexoII.itens)})
                </div>
              )}
            </KpiCard>

            <KpiCard titulo="Por natureza" icon={Layers} iconClass="bg-info-subtle text-info-text">
              <ul className="space-y-0.5 text-xs">
                {Object.keys(NATUREZAS).map((g) => (
                  <li key={g} className="flex justify-between gap-2" title={NATUREZAS[g]}>
                    <span className="font-semibold text-muted-foreground">{g}</span>
                    <span className="text-foreground tabular-nums">
                      {/* Anexo I por natureza + a linha do Anexo II fecham o total (review #835). */}
                      {formatMoney((resumo.porNaturezaAnexoI || resumo.porNatureza)?.[g])}
                    </span>
                  </li>
                ))}
                {resumo.anexoII?.itens > 0 && (
                  <li className="flex justify-between gap-2 border-t border-border pt-0.5" data-testid="por-natureza-anexo-ii">
                    <span className="font-semibold text-muted-foreground">Anexo II</span>
                    <span className="text-foreground tabular-nums">{formatMoney(resumo.anexoII.valor)}</span>
                  </li>
                )}
              </ul>
            </KpiCard>

            <KpiCard titulo="G2/G4 por grupo" icon={Tags} iconClass="bg-primary/10 text-primary">
              {(resumo.g2PorGrupo || []).length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum item monofásico ou de alíquota zero.</p>
              ) : (
                <ul className="space-y-0.5 text-xs">
                  {resumo.g2PorGrupo.map((g) => (
                    <li key={g.grupo} className="flex justify-between gap-2">
                      <span className="font-semibold text-muted-foreground truncate" title={`${g.itens} itens`}>
                        {g.grupo}
                      </span>
                      <span className="text-foreground tabular-nums">{formatMoney(g.valor)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </KpiCard>

            <KpiCard
              titulo="Pendências"
              icon={AlertCircle}
              iconClass="bg-destructive-subtle text-destructive-text"
              rodape="itens que exigem correção"
            >
              <div
                className={`text-2xl font-bold tracking-tight ${resumo.pendencias > 0 ? 'text-destructive-text' : 'text-foreground'}`}
              >
                {formatInt(resumo.pendencias)}
              </div>
            </KpiCard>

            <KpiCard
              titulo="Alertas"
              icon={AlertTriangle}
              iconClass="bg-warning-subtle text-warning-text"
              rodape="itens a conferir"
            >
              <div
                className={`text-2xl font-bold tracking-tight ${resumo.alertas > 0 ? 'text-warning-text' : 'text-foreground'}`}
              >
                {formatInt(resumo.alertas)}
              </div>
            </KpiCard>
          </div>

          {/* Pendências e alertas da competência */}
          {sinaisDaCompetencia.length > 0 && (
            <Card padding="none" className="gap-0 overflow-hidden">
              <SecaoCabecalho icon={AlertTriangle} iconClass="text-warning-text" titulo="Pendências e alertas">
                <span className="text-xs text-muted-foreground">
                  (competência inteira; filtre pelo código para ver os itens)
                </span>
              </SecaoCabecalho>
              <ul className="divide-y divide-border">
                {sinaisDaCompetencia.map((s) => (
                  <li key={s.codigo} className="px-4 py-2.5 flex flex-col md:flex-row md:items-center gap-2 text-sm">
                    <div className="flex flex-wrap items-center gap-2 md:w-96 shrink-0">
                      <SinalChip sinal={s} />
                      <span className="text-xs text-muted-foreground">{s.origem}</span>
                      <span className="text-xs text-muted-foreground">
                        · {formatInt(s.itens)} {s.itens === 1 ? 'item' : 'itens'}
                        {s.valor != null ? ` · ${formatMoney(s.valor)}` : ''}
                      </span>
                    </div>
                    <span className="text-foreground flex-1">{s.acaoEsperada}</span>
                    <LinkAcao onClick={() => aplicarFiltro('sinal', s.codigo)} className="self-start md:self-auto">
                      Filtrar
                    </LinkAcao>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Resumo por CFOP × natureza (FIS-1253) */}
          {(buscaPorCfop.carregando || buscaPorCfop.erro) && !porCfop && (
            <Card padding="none" className="gap-0 px-4 py-3 flex flex-row items-center gap-2">
              <ListTree className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Resumo por CFOP × natureza</h3>
              {buscaPorCfop.erro ? (
                <div role="alert" className="ml-auto flex items-center gap-2 text-sm text-destructive-text">
                  <span>Não foi possível carregar o resumo; tente de novo.</span>
                  <LinkButton onClick={buscaPorCfop.recarregar} className="text-xs font-semibold text-inherit hover:opacity-80 hover:text-inherit">
                    Tentar de novo
                  </LinkButton>
                </div>
              ) : (
                <span className="ml-auto text-xs text-muted-foreground">Carregando…</span>
              )}
            </Card>
          )}

          {porCfop && (
            <ResumoPorCfop
              dados={porCfop}
              podeAjustar={podeAjustar}
              onFiltrar={filtrarLinha}
              onAjustarLote={(linha) => setEdicao({ tipo: 'lote', linha, contexto })}
            />
          )}

          {/* Tabela paginada */}
          <Card padding="none" className="gap-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Natureza
                <Select
                  value={filtros.natureza || TODOS}
                  onValueChange={(v) => aplicarFiltro('natureza', v === TODOS ? '' : v)}
                >
                  <SelectTrigger size="sm" aria-label="Filtro de natureza" className="min-w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS}>Todas</SelectItem>
                    {Object.entries(NATUREZAS).map(([g, rotulo]) => (
                      <SelectItem key={g} value={g}>
                        {g} · {rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Sinal
                <Select
                  value={filtros.sinal || TODOS}
                  onValueChange={(v) => aplicarFiltro('sinal', v === TODOS ? '' : v)}
                >
                  <SelectTrigger size="sm" aria-label="Filtro de sinal" className="min-w-36 max-w-72 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS}>Todos</SelectItem>
                    {Object.entries(SINAIS).map(([codigo, info]) => (
                      <SelectItem key={codigo} value={codigo}>
                        {codigo} ({info.origem})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                CFOP
                {filtros.cfop === CFOP_VAZIO ? (
                  <Badge variant="secondary" data-testid="chip-sem-cfop" className="gap-1 text-xs">
                    sem CFOP
                    <IconButton
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => aplicarFiltro('cfop', '')}
                      aria-label="Remover filtro sem CFOP"
                      className="size-4 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </IconButton>
                  </Badge>
                ) : (
                  <Input
                    aria-label="Filtro de CFOP"
                    inputMode="numeric"
                    placeholder="5102"
                    value={cfopDigitado}
                    onChange={(e) => digitarCfop(e.target.value)}
                    className="h-8 w-20 px-2 text-xs md:text-xs tabular-nums"
                  />
                )}
              </label>
              {filtros.anexo && (
                <Badge variant="secondary" data-testid="chip-anexo" className="gap-1 text-xs">
                  Anexo {filtros.anexo}
                  <IconButton
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => aplicarFiltro('anexo', '')}
                    aria-label={`Remover filtro Anexo ${filtros.anexo}`}
                    className="size-4 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </IconButton>
                </Badge>
              )}
              {temFiltro && <LinkAcao onClick={limparFiltros}>Limpar filtros</LinkAcao>}
              <span className="ml-auto text-xs text-muted-foreground">
                {buscaLista.carregando ? 'Carregando…' : `${formatInt(lista?.total)} itens`}
              </span>
            </div>
            <Table className="text-sm">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Nota</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Item</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">NCM</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">CFOP · CST/CSOSN</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Valor</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Natureza</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Motivo / norma</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Sinais</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(lista?.itens || []).map((it) => (
                  <TableRow key={it.id} className="align-top">
                    <TableCell className="whitespace-nowrap align-top">
                      <div className="font-medium text-foreground">{it.nota?.numDoc || '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        mod {it.nota?.codMod || '—'} · {formatDate(it.nota?.dtDoc)}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal align-top min-w-48">
                      <div className="text-foreground">{it.item?.descricao || '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        #{it.item?.numItem ?? '—'} · {it.item?.codItem || '—'} · orig {it.item?.orig ?? '—'}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap align-top tabular-nums">
                      {it.item?.ncm || '—'}
                      {it.item?.exTipi ? <span className="text-xs text-muted-foreground"> Ex {it.item.exTipi}</span> : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap align-top">
                      <div className="tabular-nums text-foreground">{it.item?.cfop || '—'}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {it.item?.cstIcms || '—'} · PIS/COFINS {it.item?.cstPis || '—'}/{it.item?.cstCofins || '—'}
                      </div>
                      {it.remessaVerificar && <SeloRemessa />}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap align-top tabular-nums">
                      {formatMoney(it.valor)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap align-top">
                      <span className="font-semibold text-foreground" title={NATUREZAS[it.natureza] || ''}>
                        {it.natureza}
                      </span>
                      {it.ajuste && (
                        <Badge
                          variant="info"
                          className={`${SELO} ml-1`}
                          title={`${it.ajuste.autor} · ${formatDateTime(it.ajuste.criadoEm)} · ${it.ajuste.motivo}`}
                        >
                          ajustada
                        </Badge>
                      )}
                      {it.ajuste && it.efeitoNoDas === false && (
                        <div className="text-[11px] text-warning-text">{avisoSemEfeito(it.efeitoNoDasMotivo)}</div>
                      )}
                      {it.ajusteOrfaoCompetencia && (
                        <div className="text-[11px] text-warning-text" data-testid="ajuste-orfao">
                          ajuste anterior em {competenciaComHifen(it.ajusteOrfaoCompetencia)}, não aplicado; refaça
                          ou revogue
                        </div>
                      )}
                      {it.ajuste && it.naturezaCalculada && (
                        <div className="text-xs text-muted-foreground">calculada {it.naturezaCalculada}</div>
                      )}
                      {it.idAtividade != null && (
                        <div className="text-xs text-muted-foreground" title={atividades.rotulo[it.idAtividade] || ''}>
                          ID {it.idAtividade}
                          {atividades.anexoII.includes(it.idAtividade) ? ' · Anexo II' : ''}
                          {it.idAtividadeCalculado != null && it.idAtividadeCalculado !== it.idAtividade && (
                            <span className="text-muted-foreground/80"> (calculado {it.idAtividadeCalculado})</span>
                          )}
                        </div>
                      )}
                      {it.idAtividadeIncoerente && (
                        <div className="text-[11px] text-warning-text" title="ID_ATIVIDADE_AJUSTADO_INCOERENTE">
                          ID ajustado {it.ajuste?.idAtividade} não combina mais com {it.natureza}: vale o ID{' '}
                          {it.idAtividade}
                        </div>
                      )}
                      {it.grupo && <div className="text-xs text-muted-foreground">{it.grupo}</div>}
                      {podeAjustar && (
                        <LinkAcao
                          onClick={() => setEdicao({ tipo: 'item', item: it, contexto })}
                          className="mt-1 inline-flex items-center gap-1"
                          aria-label={`Ajustar natureza do item ${it.item?.descricao || it.id}`}
                        >
                          <Pencil className="w-3 h-3" /> Ajustar
                        </LinkAcao>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal align-top">
                      <div className="text-xs font-mono text-foreground">{it.motivo}</div>
                      {it.norma && <div className="text-xs text-muted-foreground">{it.norma}</div>}
                      {it.regraVersao && (
                        <div className="text-[10px] text-muted-foreground/70">regra {it.regraVersao}</div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal align-top">
                      <div className="flex flex-wrap gap-1">
                        {(it.sinais || []).map((s) => (
                          <SinalChip key={s.codigo} sinal={s} />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!buscaLista.carregando && lista && (lista.itens || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum item com esses filtros.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="px-4 py-2.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Página {page} de {totalPaginas}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || buscaLista.carregando}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
                  disabled={page >= totalPaginas || buscaLista.carregando}
                >
                  Próxima <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}

      {edicao && (
        <AjusteModal
          companyId={companyId}
          competencia={competencia}
          edicao={edicao}
          obterContexto={() => contextoRef.current}
          atividades={atividades}
          onFechar={() => setEdicao(null)}
          onGravado={aoAjustar}
          onInformar={aoInformar}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VarejistaArt17Card companyId={companyId} reloadKey={reloadKey} onToast={mostrarToast} />
        <PilotoCard
          companyId={companyId}
          pilotoAtual={resumo?.piloto}
          onToast={mostrarToast}
          onAlterado={recarregarTudo}
        />
      </div>
    </div>
  )
}

function TabelaPorCfop({ linhas, rotulo, podeAjustar, onFiltrar, onAjustarLote }) {
  return (
    <Table className="text-sm" aria-label={rotulo}>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">CFOP</TableHead>
          <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Natureza</TableHead>
          <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Itens</TableHead>
          <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Valor</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {linhas.map((l) => (
          <TableRow
            key={`${l.cfop || '—'}-${l.natureza}-${l.anexo || 'I'}-${l.exportacaoDireta ? 'exp' : 'int'}`}
            className="align-top"
          >
            <TableCell className="whitespace-nowrap align-top">
              <span className="tabular-nums text-foreground">{l.cfop || 'sem CFOP'}</span>
              {l.exportacaoDireta && (
                <Badge variant="info" className={`${SELO} ml-1`}>
                  exportação direta
                </Badge>
              )}
              {l.remessaVerificar && (
                <div>
                  <SeloRemessa />
                </div>
              )}
            </TableCell>
            <TableCell className="whitespace-nowrap align-top" title={NATUREZAS[l.natureza] || ''}>
              <span className="font-semibold text-foreground">{l.natureza}</span>
              <span className="text-xs text-muted-foreground"> · {NATUREZAS[l.natureza] || ''}</span>
            </TableCell>
            <TableCell className="text-right align-top tabular-nums">{formatInt(l.itens)}</TableCell>
            <TableCell className="text-right align-top tabular-nums">{formatMoney(l.valor)}</TableCell>
            <TableCell className="text-right whitespace-nowrap align-top space-x-3">
              <LinkAcao onClick={() => onFiltrar(l)} aria-label={l.cfop ? 'Filtrar' : 'Filtrar itens sem CFOP'}>
                Filtrar
              </LinkAcao>
              {podeAjustar && (
                <LinkAcao
                  onClick={() => onAjustarLote(l)}
                  aria-label={`Ajustar em lote CFOP ${l.cfop || 'sem CFOP'} ${l.natureza}`}
                >
                  Ajustar em lote
                </LinkAcao>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ResumoPorCfop({ dados, podeAjustar, onFiltrar, onAjustarLote }) {
  const linhas = dados.linhas || []
  const anexoI = linhas.filter((l) => (l.anexo || 'I') === 'I')
  const anexoII = linhas.filter((l) => l.anexo === 'II')
  return (
    <Card padding="none" className="gap-0 overflow-hidden">
      <SecaoCabecalho icon={ListTree} titulo="Resumo por CFOP × natureza">
        <span className="ml-auto text-xs text-muted-foreground">
          {anexoII.length > 0 ? `Anexo I ${formatMoney(dados.receitaAnexoI)} · ` : ''}total{' '}
          {formatMoney(dados.receitaTotal)}
        </span>
      </SecaoCabecalho>
      {linhas.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground text-center">Nenhum item na competência.</p>
      ) : (
        <TabelaPorCfop
          linhas={anexoI}
          rotulo="Resumo por CFOP"
          podeAjustar={podeAjustar}
          onFiltrar={onFiltrar}
          onAjustarLote={onAjustarLote}
        />
      )}
      {anexoII.length > 0 && (
        <div className="border-t border-border">
          <div className="px-4 py-2 flex items-center gap-2 text-xs text-warning-text bg-warning-subtle">
            <span className="font-semibold">Movidos para o Anexo II</span>
            <span className="opacity-80">(ID da atividade 4–6; fora do total do Anexo I)</span>
            <span className="ml-auto tabular-nums">{formatMoney(dados.receitaAnexoII)}</span>
          </div>
          <TabelaPorCfop
            linhas={anexoII}
            rotulo="Movidos para o Anexo II"
            podeAjustar={podeAjustar}
            onFiltrar={onFiltrar}
            onAjustarLote={onAjustarLote}
          />
        </div>
      )}
    </Card>
  )
}

function HistoricoItem({ companyId, competencia, invoiceItemId }) {
  const [aberto, setAberto] = useState(false)
  const [linhas, setLinhas] = useState(null)
  const [erro, setErro] = useState(null)

  const alternar = async () => {
    const abrir = !aberto
    setAberto(abrir)
    if (!abrir || linhas) return
    setErro(null) // tentar de novo limpa o erro anterior (review #834)
    try {
      setLinhas(await listarAjustesItem(companyId, invoiceItemId, competencia))
    } catch (err) {
      console.error('Erro ao consultar o histórico do item:', err)
      setErro('Não foi possível carregar o histórico.')
    }
  }

  return (
    <div className="text-xs">
      <LinkAcao onClick={alternar} aria-expanded={aberto}>
        {aberto ? 'Esconder o histórico do item' : 'Ver o histórico do item'}
      </LinkAcao>
      {aberto && (
        <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-muted/40 px-2" data-testid="historico-item">
          {erro && <p className="py-1 text-destructive-text">{erro}</p>}
          {!erro && !linhas && <p className="py-1 text-muted-foreground">Carregando…</p>}
          {linhas && linhas.length === 0 && <p className="py-1 text-muted-foreground">Sem ajustes nesta competência.</p>}
          {linhas && linhas.length > 0 && (
            <ul className="divide-y divide-border">
              {linhas.map((h, i) => {
                // Mudança de ID só quando o ID ajustado gravado mudou em relação ao
                // registro anterior (mais antigo), inclusive a limpeza para o derivado.
                const anterior = linhas[i + 1]?.idAtividadeAjustada ?? null
                const atualId = h.acao === 'REVOGACAO' ? null : (h.idAtividadeAjustada ?? null)
                const mudouId = atualId !== anterior
                return (
                  <li key={h.id} className={`py-1 ${h.vigente ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {formatDateTime(h.createdAt)} · {h.acao === 'REVOGACAO' ? 'revogação' : 'ajuste'}{' '}
                    {h.naturezaAnterior} →{' '}
                    {h.acao === 'REVOGACAO' ? h.naturezaCalculada : h.naturezaAjustada || h.naturezaCalculada}
                    {mudouId ? ` · ID ${h.idAtividadeAnterior ?? '—'} → ${atualId ?? 'derivado'}` : ''}
                    {h.vigente ? ' (vigente)' : ''} · {h.autor} · {h.motivo}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function Campo({ rotulo, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 text-xs text-muted-foreground ${className}`}>
      <span>{rotulo}</span>
      {children}
    </div>
  )
}

function AjusteModal({
  companyId, competencia, edicao, obterContexto, atividades, onFechar, onGravado, onInformar,
}) {
  const lote = edicao.tipo === 'lote'
  // Linha "sem CFOP" do resumo: nunca "CFOP null" no título nem no texto.
  const rotuloCfop = lote && edicao.linha.cfop ? `CFOP ${edicao.linha.cfop}` : 'sem CFOP'
  const atual = lote ? edicao.linha.natureza : edicao.item.natureza
  const idAtual = lote ? null : edicao.item.idAtividade
  const ajusteVigente = lote ? null : edicao.item.ajuste
  const opcoes = Object.keys(NATUREZAS).filter((g) => g !== atual)
  // natureza '' = manter. ID: HERDAR (mantém o ajustado), DERIVADO (limpa) ou o número.
  const [natureza, setNatureza] = useState('')
  const [idAtividade, setIdAtividade] = useState('HERDAR')
  const [confirmaAnexoII, setConfirmaAnexoII] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  const naturezaFinal = natureza || atual
  // Exportação (item exportado, ou linha de CFOP 7xxx): só os IDs de exportação, como na apuração.
  // IDs aceitos vêm do backend: no lote, por linha (idsAtividadeAceitos: a linha diz se
  // tem exportação direta); no item, pela exportação direta (CFOP 7xxx/id_dest=3).
  const aceitosDe = (g) =>
    lote
      ? edicao.linha.idsAtividadeAceitos?.[g] || atividades.porNatureza[g] || []
      : edicao.item.exportacaoDireta
        ? atividades.exportacao
        : atividades.porNatureza[g] || []
  const idsAceitos = aceitosDe(naturezaFinal)
  const idNum = /^\d+$/.test(idAtividade) ? Number(idAtividade) : null
  // ID que vale depois da troca com "Manter": o ajustado só se é o efetivo hoje e combina
  // com a natureza nova; senão o derivado da natureza nova (regra do backend, review #835).
  const exportaItem = lote ? Boolean(edicao.linha.exportacaoDireta) : Boolean(edicao.item.exportacaoDireta)
  const derivadoDe = (g) =>
    exportaItem || g === 'G5' ? atividades.derivadoExportacao : atividades.derivados[g] ?? null
  const idGuardado = lote ? null : edicao.item.ajuste?.idAtividade ?? null
  const herdavel = idGuardado != null && !edicao.item?.idAtividadeIncoerente
  const idDepoisManter =
    lote ? null : herdavel && idsAceitos.includes(idGuardado) ? idGuardado : derivadoDe(naturezaFinal)
  const idDepois =
    idNum !== null ? idNum : idAtividade === 'DERIVADO' ? derivadoDe(naturezaFinal) : idDepoisManter
  const idMuda = !lote && idDepois != null && idAtual != null && idDepois !== idAtual
  const vaiParaAnexoII = idNum !== null && atividades.anexoII.includes(idNum)

  const trocarNatureza = (valor) => {
    setNatureza(valor)
    // ID escolhido que não combina com a natureza nova volta ao derivado.
    if (idNum !== null && !aceitosDe(valor || atual).includes(idNum)) {
      setIdAtividade('DERIVADO')
      setConfirmaAnexoII(false)
    }
  }

  const gravar = async (acao) => {
    setErro(null)
    if (acao === 'ajustar' && !natureza && idAtividade === 'HERDAR') {
      setErro('Escolha a nova natureza ou o ID da atividade.')
      return
    }
    if (!motivo.trim()) {
      setErro('Informe o motivo: ele vai para o histórico e o audit.')
      return
    }
    if (acao === 'ajustar' && vaiParaAnexoII && !confirmaAnexoII) {
      setErro('Confirme que o item muda para o Anexo II.')
      return
    }
    setSalvando(true)
    // POST que volta depois de trocar de empresa/competência: sem toast e sem recarregar.
    const gravado = (texto, res) => {
      if (obterContexto && edicao.contexto && obterContexto() !== edicao.contexto) return
      onGravado(texto, res)
    }
    try {
      if (acao === 'revogar-orfao') {
        const res = await revogarAjusteNatureza(companyId, edicao.item.item.invoiceItemId, {
          competencia: edicao.item.ajusteOrfaoCompetencia,
          motivo: motivo.trim(),
        })
        gravado(
          `Ajuste anterior de ${competenciaComHifen(edicao.item.ajusteOrfaoCompetencia)} revogado.`,
          res
        )
        return
      } else if (acao === 'revogar') {
        const res = await revogarAjusteNatureza(companyId, edicao.item.item.invoiceItemId, {
          competencia,
          motivo: motivo.trim(),
        })
        gravado(`Ajuste revogado: o item volta à natureza calculada (${edicao.item.naturezaCalculada}).`, res)
        return
      }
      const destino = [
        natureza ? `natureza ${natureza}` : null,
        idNum !== null ? `ID ${idNum}` : idAtividade === 'DERIVADO' ? 'ID derivado da natureza' : null,
      ]
        .filter(Boolean)
        .join(' e ')
      if (lote) {
        const corpo = {
          competencia,
          cfop: edicao.linha.cfop || CFOP_VAZIO,
          naturezaDe: atual,
          anexo: edicao.linha.anexo || 'I',
          exportacao: Boolean(edicao.linha.exportacaoDireta),
          motivo: motivo.trim(),
        }
        if (vaiParaAnexoII && confirmaAnexoII) corpo.confirmaAnexoII = true
        if (natureza) corpo.naturezaPara = natureza
        if (idNum !== null) corpo.idAtividadePara = idNum
        if (idAtividade === 'DERIVADO') corpo.idAtividadeModo = 'DERIVADO'
        const res = await ajustarNaturezaLote(companyId, corpo)
        if (!res.loteId) {
          if (obterContexto && edicao.contexto && obterContexto() !== edicao.contexto) return
          onInformar(res.mensagem || 'Nada a ajustar: os itens já estavam no destino.')
          return
        }
        const revogados = res.revogados || 0
        const ajustados = (res.itens || 0) - revogados
        gravado(
          `${rotuloCfop}: ${ajustados} ajustado(s) de ${atual} para ${destino}` +
            (revogados ? ` e ${revogados} revogado(s) (voltaram à natureza calculada)` : '') +
            ` · ${formatMoney(res.valor)}.` +
            (res.itensPulados
              ? res.itensPulados === 1
                ? ' 1 item já estava no destino e foi pulado.'
                : ` ${qtdItens(res.itensPulados)} já estavam no destino e foram pulados.`
              : ''),
          res
        )
      } else {
        const corpo = { competencia, motivo: motivo.trim() }
        if (natureza) corpo.natureza = natureza
        if (idNum !== null) corpo.idAtividade = idNum
        if (idAtividade === 'DERIVADO') corpo.idAtividadeModo = 'DERIVADO'
        if (vaiParaAnexoII && confirmaAnexoII) corpo.confirmaAnexoII = true
        const res = await ajustarNaturezaItem(companyId, edicao.item.item.invoiceItemId, corpo)
        gravado(
          res?.acao === 'REVOGACAO'
            ? `Item voltou à natureza calculada (${edicao.item.naturezaCalculada}): ajuste revogado.`
            : `Item ajustado de ${atual} para ${destino}.` +
              (idMuda ? ` ID passa de ${idAtual} para ${idDepois}.` : ''),
          res
        )
      }
    } catch (err) {
      console.error('Erro ao gravar o ajuste:', err)
      setErro(err.message || 'Falha ao gravar o ajuste.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !salvando) onFechar() }}>
      <DialogContent
        aria-label={lote ? 'Ajuste em lote' : 'Ajuste do item'}
        aria-describedby={undefined}
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-sm">
            {lote ? `Ajustar em lote · ${rotuloCfop}` : 'Ajustar a natureza do item'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {lote
              ? `Vale para ${qtdItens(edicao.linha.itens)} (${formatMoney(edicao.linha.valor)}) ${lote && !edicao.linha.cfop ? 'sem CFOP' : `do ${rotuloCfop}`} hoje em ${atual}, na competência ${competenciaLabel(competencia)}.`
              : `${edicao.item.item?.descricao || 'Item'} · natureza atual ${atual}${
                  ajusteVigente ? ` (ajustada; calculada ${edicao.item.naturezaCalculada})` : ''
                }${idAtual ? ` · ID da atividade ${idAtual}` : ''}.`}{' '}
            O ajuste fica no histórico, não some quando o classificador roda de novo e só muda o DAS de empresa no piloto.
          </p>
          <Campo rotulo="Nova natureza">
            <Select value={natureza || TODOS} onValueChange={(v) => trocarNatureza(v === TODOS ? '' : v)}>
              <SelectTrigger size="sm" aria-label="Nova natureza" className="w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>escolha… (mantém {atual})</SelectItem>
                {opcoes.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g} · {NATUREZAS[g]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          <Campo rotulo="ID da atividade (PGDAS-D)">
            <Select
              value={idAtividade}
              onValueChange={(v) => {
                setIdAtividade(v)
                setConfirmaAnexoII(false)
              }}
            >
              <SelectTrigger size="sm" aria-label="ID da atividade" className="w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HERDAR">
                  {lote ? 'Manter o ID de cada item' : `Manter${idDepoisManter != null ? ` (ID ${idDepoisManter})` : ''}`}
                </SelectItem>
                <SelectItem value="DERIVADO">Derivado da natureza</SelectItem>
                {idsAceitos.map((id) => (
                  <SelectItem key={id} value={String(id)}>
                    {id} · {atividades.rotulo[id] || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          {idMuda && (
            <p className="text-xs text-info-text" data-testid="id-passa">
              ID passa de {idAtual} para {idDepois}
            </p>
          )}
          {vaiParaAnexoII && (
            <div className="rounded-md border border-warning-border bg-warning-subtle px-3 py-2 text-xs text-warning-text space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Atenção: muda o item para o Anexo II (industrializado pelo contribuinte).
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={confirmaAnexoII} onCheckedChange={(v) => setConfirmaAnexoII(v === true)} />
                Confirmo a mudança para o Anexo II
              </label>
            </div>
          )}
          <Campo rotulo="Motivo do ajuste (obrigatório)">
            <Textarea
              aria-label="Motivo do ajuste"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="text-xs md:text-xs"
            />
          </Campo>
          {!lote && (
            <HistoricoItem
              companyId={companyId}
              competencia={competencia}
              invoiceItemId={edicao.item.item.invoiceItemId}
            />
          )}
          {erro && <p className="text-xs text-destructive-text">{erro}</p>}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex flex-col items-start gap-1">
              {ajusteVigente && (
                <LinkButton
                  onClick={() => gravar('revogar')}
                  disabled={salvando}
                  className="text-xs font-semibold text-destructive-text hover:text-destructive-text"
                >
                  Revogar ajuste
                </LinkButton>
              )}
              {!lote && edicao.item.ajusteOrfaoCompetencia && (
                <LinkButton
                  onClick={() => gravar('revogar-orfao')}
                  disabled={salvando}
                  className="text-xs font-semibold text-destructive-text hover:text-destructive-text"
                >
                  Revogar ajuste anterior ({competenciaComHifen(edicao.item.ajusteOrfaoCompetencia)})
                </LinkButton>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onFechar} disabled={salvando}>
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => gravar('ajustar')}
                disabled={salvando || (!natureza && idAtividade === 'HERDAR')}
              >
                {salvando ? 'Gravando…' : 'Gravar ajuste'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function VarejistaArt17Card({ companyId, reloadKey, onToast }) {
  const anoAtual = new Date().getFullYear()
  const [registros, setRegistros] = useState([])
  const [ano, setAno] = useState(String(anoAtual))
  const [percentual, setPercentual] = useState('')
  const [fonte, setFonte] = useState('MANUAL_CELULA')
  const [evidencia, setEvidencia] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    try {
      const res = await listarVarejistaArt17(companyId)
      setRegistros(Array.isArray(res) ? res : res?.itens || [])
    } catch (err) {
      console.warn('Erro ao listar condição de varejista:', err)
      setRegistros([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, reloadKey])

  useEffect(() => {
    carregar()
  }, [carregar])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro(null)
    const anoNum = Number(ano)
    const pct = Number(String(percentual).replace(',', '.'))
    if (!Number.isInteger(anoNum) || anoNum < 2020 || anoNum > anoAtual + 1) {
      setErro(`Ano-calendário deve estar entre 2020 e ${anoAtual + 1}.`)
      return
    }
    if (percentual === '' || !Number.isFinite(pct) || pct < 0 || pct > 100) {
      setErro('Percentual deve estar entre 0 e 100.')
      return
    }
    setSalvando(true)
    try {
      await salvarVarejistaArt17(companyId, {
        anoCalendario: anoNum,
        percentual: pct.toFixed(2),
        fonte: fonte.trim() || undefined,
        evidencia: evidencia.trim() || undefined,
      })
      onToast('ok', `Condição de varejista ${anoNum} gravada (${pct.toFixed(2).replace('.', ',')}%). Entra no resumo na próxima rodada.`)
      setPercentual('')
      setEvidencia('')
      await carregar()
    } catch (err) {
      console.error('Erro ao salvar condição de varejista:', err)
      setErro(err.message || 'Falha ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const input = 'h-8 px-2 text-xs md:text-xs'

  return (
    <Card padding="none" className="gap-0 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Store className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Condição de varejista (art. 17)</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Percentual da receita de venda a varejo no ano-calendário. Sem cadastro, bebida fria fica tributada (alerta
        BEBIDA_FRIA_SEM_VAREJISTA).
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2 text-sm">
        <Campo rotulo="Ano-calendário">
          <Input type="number" value={ano} onChange={(e) => setAno(e.target.value)} className={input} />
        </Campo>
        <Campo rotulo="Percentual (%)">
          <Input
            type="text"
            inputMode="decimal"
            placeholder="80,00"
            value={percentual}
            onChange={(e) => setPercentual(e.target.value)}
            className={input}
          />
        </Campo>
        <Campo rotulo="Fonte" className="col-span-2">
          <Input type="text" value={fonte} onChange={(e) => setFonte(e.target.value)} className={input} />
        </Campo>
        <Campo rotulo="Evidência" className="col-span-2">
          <Textarea
            rows={2}
            value={evidencia}
            onChange={(e) => setEvidencia(e.target.value)}
            placeholder="Ex.: planilha de vendas 2025 enviada pelo cliente em 10/10"
            className="text-xs md:text-xs"
          />
        </Campo>
        {erro && <p className="col-span-2 text-xs text-destructive-text">{erro}</p>}
        <div className="col-span-2 flex justify-end">
          <Button type="submit" size="sm" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar condição'}
          </Button>
        </div>
      </form>
      {registros.length > 0 && (
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 text-[11px] uppercase tracking-wider text-muted-foreground">Ano</TableHead>
              <TableHead className="h-8 text-[11px] uppercase tracking-wider text-muted-foreground text-right">%</TableHead>
              <TableHead className="h-8 text-[11px] uppercase tracking-wider text-muted-foreground">Fonte</TableHead>
              <TableHead className="h-8 text-[11px] uppercase tracking-wider text-muted-foreground">Autor</TableHead>
              <TableHead className="h-8 text-[11px] uppercase tracking-wider text-muted-foreground">Em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registros.map((r) => (
              <TableRow
                key={r.id}
                className={r.supersededBy ? 'text-muted-foreground/60 line-through' : 'text-foreground'}
              >
                <TableCell className="py-1">{r.anoCalendario}</TableCell>
                <TableCell className="py-1 text-right tabular-nums">{String(r.percentual).replace('.', ',')}</TableCell>
                <TableCell className="py-1" title={r.evidencia || ''}>
                  {r.fonte}
                </TableCell>
                <TableCell className="py-1">{r.autor || '—'}</TableCell>
                <TableCell className="py-1">{formatDateTime(r.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}

function PilotoCard({ companyId, pilotoAtual, onToast, onAlterado }) {
  // Sem o piloto do resumo (carregando ou erro) o estado é desconhecido: nunca
  // assume "desligado" — Aplicar fica desabilitado (review #834).
  const conhecido = pilotoAtual !== undefined && pilotoAtual !== null
  const [ativo, setAtivo] = useState(conhecido ? Boolean(pilotoAtual.ativo) : null)
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [resultado, setResultado] = useState(null)

  // O resumo sempre traz o piloto (contrato): inicializa o toggle e a explicação.
  // Depois do PATCH o resumo é recarregado e volta a ser a fonte; o retorno do
  // PATCH só vale até lá (ou se o recarregamento falhar).
  // Compara pelo valor: um resumo recarregado traz um objeto novo com o mesmo piloto,
  // e isso não pode desfazer o que o usuário marcou (review #834).
  const pilotoChave = JSON.stringify([
    pilotoAtual?.ativo, pilotoAtual?.efetivo, pilotoAtual?.uf, pilotoAtual?.ufsHabilitadas,
  ])
  useEffect(() => {
    setAtivo(conhecido ? Boolean(pilotoAtual.ativo) : null)
    setResultado(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, pilotoChave])

  useEffect(() => {
    setMotivo('')
    setErro(null)
  }, [companyId])

  const estado = resultado || pilotoAtual || null
  const estadoConhecido = estado ? estado.ativo : undefined

  const handleAplicar = async () => {
    setErro(null)
    if (!motivo.trim()) {
      setErro('Informe o motivo: ele vai para o audit.')
      return
    }
    setSalvando(true)
    try {
      const res = await setNaturezaPiloto(companyId, { ativo, motivo: motivo.trim() })
      setResultado(res)
      setMotivo('')
      onToast('ok', `Piloto ${res.ativo ? 'ligado' : 'desligado'} para a empresa. Alteração registrada no audit.`)
      await onAlterado?.()
    } catch (err) {
      console.error('Erro ao alterar piloto:', err)
      setErro(err.message || 'Falha ao alterar o piloto.')
    } finally {
      setSalvando(false)
    }
  }

  const ufs = estado?.ufsHabilitadas || []
  const ufForaDaFlag = Boolean(estado && estado.ativo && !estado.efetivo && !ufs.includes(estado.uf))

  return (
    <Card padding="none" className="gap-0 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Empresa no piloto</h3>
        {estadoConhecido !== undefined && estadoConhecido !== null && (
          <span className="text-xs text-muted-foreground">(atual: {estadoConhecido ? 'ligado' : 'desligado'})</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Segunda chave da segregação por natureza. Só tem efeito quando a UF da empresa está na flag global
        SEGREGACAO_NATUREZA_ITEM_UFS.
      </p>
      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <Checkbox
          checked={Boolean(ativo)}
          disabled={ativo === null}
          onCheckedChange={(v) => setAtivo(v === true)}
        />
        Empresa no piloto
        {ativo === null && <span className="text-xs text-muted-foreground">(carregando)</span>}
      </label>
      <Campo rotulo="Motivo (obrigatório)">
        <Textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} className="text-xs md:text-xs" />
      </Campo>
      {erro && <p className="text-xs text-destructive-text">{erro}</p>}
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={handleAplicar} disabled={salvando || ativo === null}>
          {salvando ? 'Gravando…' : 'Aplicar'}
        </Button>
      </div>
      {estado && (
        <div
          data-testid="piloto-resultado"
          className={`text-xs rounded-md border px-3 py-2 flex gap-2 ${
            estado.efetivo
              ? 'bg-success-subtle border-success-border text-success-text'
              : 'bg-muted border-border text-foreground'
          }`}
        >
          <Info className="w-4 h-4 shrink-0" />
          <div>
            <div>
              Piloto {estado.ativo ? 'ligado' : 'desligado'} (UF {estado.uf || '—'}). Efetivo:{' '}
              <strong>{estado.efetivo ? 'sim' : 'não'}</strong>.
            </div>
            {ufForaDaFlag && (
              <div className="mt-1">
                A UF {estado.uf || 'da empresa'} não está habilitada na flag global (UFs habilitadas:{' '}
                {ufs.length ? ufs.join(', ') : 'nenhuma'}). A flag global ainda está desligada para ela, então a
                apuração não muda até a UF entrar em SEGREGACAO_NATUREZA_ITEM_UFS.
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
