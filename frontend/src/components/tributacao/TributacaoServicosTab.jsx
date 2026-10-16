import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Building2,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  Info,
} from 'lucide-react'
import {
  getTributacaoServicos,
  salvarParametrizacaoServico,
  getTrackingOrigens,
  getExportacaoEmpresa,
  salvarCadastroExportador,
  substituirCadastroExportador,
  revogarCadastroExportador,
  criarTomadorExportacao,
  revogarTomadorExportacao,
  marcarAlertaVinculoCiente,
  getRevisoesExportacao,
  decidirRevisaoExportacao,
  getConferencia,
  concluirConferencia,
  reabrirConferencia,
} from '../../services/tributacaoService'
import { Button, Card, Input, Spinner, Tabs, TabsList, TabsTrigger } from '@bhubai/bhub-design-system'
import { EmpresaResumoCard } from './EmpresaResumoCard'
import { ConferenciaCard } from './ConferenciaCard'
import { KpiMetricsCards } from './KpiMetricsCards'
import { TrackingOrigensCards } from './TrackingOrigensCards'
import { TabelaCodigosServico } from './TabelaCodigosServico'
import { TabelaHistoricoAlteracoes } from './TabelaHistoricoAlteracoes'
import { SeletorEmpresaCombobox } from './SeletorEmpresaCombobox'
import ComercioAnexoITab from './ComercioAnexoITab'
import {
  ExportadorCadastroCard,
  AlertaVinculoCard,
  RevisoesExportacaoEmpresa,
} from '../exportacao'

/**
 * Competência anterior à data local (spec TRK-16): em 24/09/2026 → '2026-08';
 * em janeiro → dezembro do ano anterior. É a competência em apuração.
 */
export function mesAnterior(hoje = new Date()) {
  const d = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fromMonthValue(monthStr) {
  return (monthStr || mesAnterior()).replace('-', '')
}

function formatCompetenciaDisplay(compStr) {
  if (!compStr) return ''
  const clean = String(compStr).replace(/[-/]/g, '')
  if (clean.length >= 6) {
    return `${clean.slice(4, 6)}/${clean.slice(0, 4)}`
  }
  return compStr
}

// Bloco da aba: título + descrição curtos, para a tela ler como um relatório
// em seções (resumo → pendências → origem → parametrização → histórico).
function Secao({ titulo, descricao, children }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-foreground">{titulo}</h2>
        {descricao && <p className="text-xs text-muted-foreground mt-0.5">{descricao}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export default function TributacaoServicosTab({
  companies = [],
  initialCompanyId = null,
  onCompanyChange = null,
  onOpenInvoice = null,
}) {
  // Competência padrão: sempre a anterior à data atual, independente do filtro
  // de datas compartilhado da listagem (spec TRK-16).
  const [selectedMonth, setSelectedMonth] = useState(() => mesAnterior())
  const competencia = useMemo(() => fromMonthValue(selectedMonth), [selectedMonth])

  // Lista de empresas ordenadas alfabeticamente
  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) =>
      (a.razao_social || '').localeCompare(b.razao_social || '', 'pt-BR')
    )
  }, [companies])

  // Empresa selecionada: prioriza initialCompanyId, ou a primeira do Simples Nacional, ou a primeira da lista
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => {
    if (initialCompanyId) return initialCompanyId
    const firstSimples = companies.find((c) => c.regime_tributario === 'SIMPLES')
    if (firstSimples) return firstSimples.id
    if (companies.length > 0) return companies[0].id
    return null
  })

  const handleSelectCompany = (id) => {
    setSelectedCompanyId(id)
    onCompanyChange?.(id)
  }

  // Sincroniza se initialCompanyId mudar externamente
  useEffect(() => {
    if (initialCompanyId && initialCompanyId !== selectedCompanyId) {
      setSelectedCompanyId(initialCompanyId)
    }
  }, [initialCompanyId])

  // Sub-aba ativa (FIS-1227): 'servicos' é o padrão e mantém a tela de sempre;
  // 'comercio' abre a conferência da natureza por item. reloadKey faz o
  // Atualizar recarregar a sub-aba de comércio.
  const [subAba, setSubAba] = useState('servicos')
  const [comercioReloadKey, setComercioReloadKey] = useState(0)

  // Estado dos dados fiscais da empresa
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successToast, setSuccessToast] = useState(null)

  // Estado dos dados de tracking de origens
  const [trackingData, setTrackingData] = useState(null)
  const [trackingLoading, setTrackingLoading] = useState(false)

  // Estado dos dados de exportação e revisões da empresa
  const [exportacaoData, setExportacaoData] = useState(null)
  const [revisoesEmpresa, setRevisoesEmpresa] = useState([])
  const [exportacaoLoading, setExportacaoLoading] = useState(false)

  // Carregar dados de tributação
  const fetchData = useCallback(async () => {
    if (!selectedCompanyId) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await getTributacaoServicos(selectedCompanyId, competencia)
      setData(res)
    } catch (err) {
      console.error('Erro ao buscar tributação de serviços:', err)
      setError(err.message || 'Falha ao carregar dados de tributação.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [selectedCompanyId, competencia])

  // Carregar dados de tracking de origens (represamento e integradores)
  // refresh=true (botões de recarregar) ignora o cache de 5 min da IntegradorNF.
  const fetchTracking = useCallback(async (refresh = false) => {
    if (!selectedCompanyId) {
      setTrackingData(null)
      return
    }
    setTrackingLoading(true)
    try {
      const res = await getTrackingOrigens(selectedCompanyId, competencia, { refresh })
      setTrackingData(res)
    } catch (err) {
      console.error('Erro ao consultar tracking de origens:', err)
      setTrackingData(null)
    } finally {
      setTrackingLoading(false)
    }
  }, [selectedCompanyId, competencia])

  // Carregar dados de exportação e revisões da empresa
  const fetchExportacao = useCallback(async () => {
    if (!selectedCompanyId) {
      setExportacaoData(null)
      setRevisoesEmpresa([])
      return
    }
    setExportacaoLoading(true)
    try {
      const [expRes, revRes] = await Promise.all([
        getExportacaoEmpresa(selectedCompanyId).catch((err) => {
          console.warn('Erro ao carregar dados de exportação:', err)
          return null
        }),
        getRevisoesExportacao({ company_id: selectedCompanyId, competencia }).catch((err) => {
          console.warn('Erro ao carregar revisões da empresa:', err)
          return []
        }),
      ])
      setExportacaoData(expRes)
      setRevisoesEmpresa(Array.isArray(revRes) ? revRes : [])
    } finally {
      setExportacaoLoading(false)
    }
  }, [selectedCompanyId, competencia])

  useEffect(() => {
    fetchData()
    fetchTracking()
    fetchExportacao()
  }, [fetchData, fetchTracking, fetchExportacao])

  // Salvar parametrização
  const handleSalvarParametrizacao = async (payload) => {
    if (!selectedCompanyId) return
    setError(null)
    try {
      await salvarParametrizacaoServico(selectedCompanyId, payload)
      setSuccessToast(`Parametrização do código ${payload.subitem_lc116} salva com sucesso!`)
      setTimeout(() => setSuccessToast(null), 4000)
      // Recarrega os dados para atualizar a tabela e o histórico
      await fetchData()
    } catch (err) {
      console.error('Erro ao salvar parametrização:', err)
      throw err
    }
  }

  // Handlers do Cadastro de Exportadores e Tomadores
  const handleSalvarCadastro = async (payload) => {
    if (!selectedCompanyId) return
    await salvarCadastroExportador(selectedCompanyId, payload)
    await fetchExportacao()
  }

  const handleSubstituirCadastro = async (cadastroId, payload) => {
    if (!selectedCompanyId) return
    await substituirCadastroExportador(selectedCompanyId, cadastroId, payload)
    await fetchExportacao()
  }

  const handleRevogarCadastro = async (cadastroId, dataRevogacao) => {
    if (!selectedCompanyId) return
    await revogarCadastroExportador(selectedCompanyId, cadastroId, dataRevogacao)
    await fetchExportacao()
  }

  const handleCriarTomador = async (payload) => {
    if (!selectedCompanyId) return
    await criarTomadorExportacao(selectedCompanyId, payload)
    await fetchExportacao()
  }

  const handleRevogarTomador = async (tomadorId, dataRevogacao) => {
    if (!selectedCompanyId) return
    await revogarTomadorExportacao(selectedCompanyId, tomadorId, dataRevogacao)
    await fetchExportacao()
  }

  const handleMarcarAlertaCiente = async (alertaId) => {
    if (!selectedCompanyId) return
    await marcarAlertaVinculoCiente(selectedCompanyId, alertaId)
    await fetchExportacao()
  }

  const handleDecidirRevisao = async (revisaoId, payload) => {
    const resultado = await decidirRevisaoExportacao(revisaoId, payload)
    await fetchExportacao()
    return resultado
  }

  // Empresa atualmente selecionada no array
  const currentCompany = useMemo(() => {
    return companies.find((c) => String(c.id) === String(selectedCompanyId)) || null
  }, [companies, selectedCompanyId])

  // Conferência concluída da empresa × competência (Célula 24/09, item 4.1 / FIS-1090)
  const [conferencia, setConferencia] = useState(null)
  const [conferenciaLoading, setConferenciaLoading] = useState(false)
  const [conferenciaSaving, setConferenciaSaving] = useState(false)
  // Feedback só da conferência (FIS-1253, PR-E): separado do erro/toast da apuração
  // de serviços. Leitura que falhou ≠ "não concluída": o card mostra o erro.
  const [erroConferencia, setErroConferencia] = useState(null)
  const [erroLeituraConferencia, setErroLeituraConferencia] = useState(null)
  const [toastConferencia, setToastConferencia] = useState(null)
  const cnpjSelecionado = currentCompany?.cnpj || null

  // Guarda de sequência: resposta de outra empresa/competência, ou de uma
  // requisição superada, não muda o estado nem dá toast.
  const contextoConferencia = `${cnpjSelecionado}|${competencia}`
  const contextoConferenciaRef = useRef(contextoConferencia)
  contextoConferenciaRef.current = contextoConferencia
  const seqConferencia = useRef(0)
  const timerToastConferencia = useRef(null)

  const mostrarToastConferencia = (texto) => {
    clearTimeout(timerToastConferencia.current)
    setToastConferencia(texto)
    timerToastConferencia.current = setTimeout(() => setToastConferencia(null), 4000)
  }
  useEffect(() => () => clearTimeout(timerToastConferencia.current), [])

  const fetchConferencia = useCallback(async () => {
    const seq = ++seqConferencia.current
    const ctx = `${cnpjSelecionado}|${competencia}`
    const atual = () => seq === seqConferencia.current && ctx === contextoConferenciaRef.current
    // Empresa/competência nova (ou recarga): erros anteriores não valem mais.
    setErroConferencia(null)
    setErroLeituraConferencia(null)
    setConferenciaSaving(false) // POST de outro contexto em voo não segura o card novo
    if (!cnpjSelecionado) {
      setConferencia(null)
      return
    }
    setConferencia(null)
    setConferenciaLoading(true)
    try {
      const res = await getConferencia(cnpjSelecionado, competencia)
      if (atual()) setConferencia(res)
    } catch (err) {
      if (!atual()) return
      console.error('Erro ao consultar conferência da competência:', err)
      setConferencia(null)
      setErroLeituraConferencia(err.message || 'Falha ao consultar a conferência.')
    } finally {
      if (atual()) setConferenciaLoading(false)
    }
  }, [cnpjSelecionado, competencia])

  useEffect(() => {
    fetchConferencia()
  }, [fetchConferencia])

  const gravarConferencia = async (chamada, textoOk, textoErro) => {
    if (!cnpjSelecionado) return
    const seq = ++seqConferencia.current
    const ctx = `${cnpjSelecionado}|${competencia}`
    const atual = () => seq === seqConferencia.current && ctx === contextoConferenciaRef.current
    setErroConferencia(null)
    setConferenciaSaving(true)
    try {
      const res = await chamada(cnpjSelecionado, competencia)
      if (!atual()) return // contexto mudou durante o POST: sem estado nem toast
      setConferencia(res)
      setErroLeituraConferencia(null)
      mostrarToastConferencia(textoOk)
    } catch (err) {
      if (!atual()) return
      console.error(textoErro, err)
      setErroConferencia(err.message || textoErro)
    } finally {
      // Sem condição: um POST que volta depois da troca de contexto não pode
      // deixar o card preso em "salvando".
      setConferenciaSaving(false)
    }
  }

  const handleConcluirConferencia = (observacao) =>
    gravarConferencia(
      (cnpj, comp) => concluirConferencia(cnpj, comp, observacao),
      `Conferência de ${formatCompetenciaDisplay(competencia)} concluída. A empresa está apta ao DAS.`,
      'Falha ao concluir a conferência.'
    )

  const handleReabrirConferencia = (motivo) =>
    gravarConferencia(
      (cnpj, comp) => reabrirConferencia(cnpj, comp, motivo),
      `Conferência de ${formatCompetenciaDisplay(competencia)} reaberta.`,
      'Falha ao reabrir a conferência.'
    )

  const historicoCompleto = useMemo(() => {
    const ciclos = conferencia?.historico || []
    const linhas = []
    for (const c of ciclos) {
      linhas.push({
        id: `conf-${c.id}-c`,
        quando: c.concluidaEm,
        quem: c.concluidaPor,
        subitem_lc116: 'EMPRESA',
        campo: 'conferência',
        valor_anterior: null,
        valor_novo: 'Concluída',
        vigencia_inicio: c.periodoApuracao,
        motivo: c.observacao || 'Conferência de faturamento e classificação concluída',
      })
      if (c.reabertaEm) {
        linhas.push({
          id: `conf-${c.id}-r`,
          quando: c.reabertaEm,
          quem: c.reabertaPor,
          subitem_lc116: 'EMPRESA',
          campo: 'conferência',
          valor_anterior: 'Concluída',
          valor_novo: 'Reaberta',
          vigencia_inicio: c.periodoApuracao,
          motivo: c.motivoReabertura || 'Conferência reaberta',
        })
      }
    }
    return [...linhas, ...(data?.historico || [])].sort(
      (a, b) => new Date(b.quando) - new Date(a.quando)
    )
  }, [conferencia, data])

  const recarregando = loading || trackingLoading || exportacaoLoading || conferenciaSaving
  const recarregar = () => {
    fetchConferencia()
    if (subAba === 'comercio') {
      setComercioReloadKey((k) => k + 1)
      return
    }
    fetchData()
    fetchTracking(true)
    fetchExportacao()
  }

  const temPendencias = (exportacaoData?.alertas_vinculo?.length || 0) > 0 || revisoesEmpresa.length > 0
  const avisoSucesso = toastConferencia || successToast
  const avisoErro = erroConferencia || (subAba === 'servicos' ? error : null)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho: empresa, competência e Atualizar valem para as duas sub-abas */}
      <Card padding="none" className="gap-0 overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Seletor de Empresa (Combobox Pesquisável) */}
            <SeletorEmpresaCombobox
              companies={sortedCompanies}
              selectedCompanyId={selectedCompanyId}
              onSelectCompany={handleSelectCompany}
              disabled={loading || trackingLoading}
            />

            {/* Seletor de Competência */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Competência:</span>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value || mesAnterior())}
                className="w-auto h-auto px-2.5 py-1 text-sm bg-card font-medium text-foreground"
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={recarregar}
            disabled={recarregando}
            className="gap-1.5 bg-card"
            title="Recarregar dados da competência"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recarregando ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span>Atualizar</span>
          </Button>
        </div>

        {/* Sub-abas (FIS-1227): empresa e competência são as do cabeçalho */}
        <div className="px-4 border-t border-border">
          <Tabs value={subAba} onValueChange={setSubAba}>
            <TabsList variant="line" aria-label="Sub-abas de tributação">
              <TabsTrigger value="servicos" className="px-3">Serviços</TabsTrigger>
              <TabsTrigger value="comercio" className="px-3">Comércio · Anexo I</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Avisos da tela, sempre no mesmo lugar: logo abaixo do cabeçalho */}
      {avisoSucesso && (
        <div role="status" className="bg-success-subtle border border-success-border text-success-text px-4 py-3 rounded-lg flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">{avisoSucesso}</span>
        </div>
      )}
      {avisoErro && (
        <div role="alert" className="bg-destructive-subtle border border-destructive-border text-destructive-text px-4 py-3 rounded-lg flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{avisoErro}</span>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={recarregar}
            className="font-semibold text-destructive-text hover:text-destructive-text underline"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Conferência da competência (FIS-1253, PR-E): UMA só por empresa × competência,
          fora das sub-abas — não é desmontada ao trocar de aba (observação e motivo
          digitados ficam). Concluir libera a empresa para o DAS no motor SN. */}
      <ConferenciaCard
        estado={conferencia}
        loading={conferenciaLoading}
        saving={conferenciaSaving}
        competenciaLabel={formatCompetenciaDisplay(competencia)}
        disabledReason={
          !cnpjSelecionado
            ? 'Selecione uma empresa e uma competência para concluir a conferência.'
            : erroLeituraConferencia
              ? 'Não foi possível consultar a conferência; tente de novo.'
              : null
        }
        erroLeitura={erroLeituraConferencia}
        onConcluir={handleConcluirConferencia}
        onReabrir={handleReabrirConferencia}
      />

      {subAba === 'comercio' && (
        <ComercioAnexoITab
          companyId={selectedCompanyId}
          competencia={competencia}
          reloadKey={comercioReloadKey}
        />
      )}

      {subAba === 'servicos' && (
        <>
          {loading && !data && (
            <Card padding="none" className="flex flex-col items-center justify-center py-20 gap-0">
              <Spinner size="xl" className="text-primary mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Carregando apuração da competência {formatCompetenciaDisplay(competencia)}...</p>
            </Card>
          )}

          {!loading && !data && !error && (
            <Card padding="none" className="text-center py-16 gap-0">
              <Building2 className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground">Selecione uma empresa</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                Escolha uma empresa habilitada no Simples Nacional e a competência desejada para visualizar o relatório de tributação.
              </p>
            </Card>
          )}

          {data && (
            <>
              <Secao
                titulo="Resumo da competência"
                descricao={`Empresa, Fator R e faturamento de ${formatCompetenciaDisplay(competencia)}.`}
              >
                <EmpresaResumoCard empresa={data.empresa} fatorR={data.fator_r} />
                <KpiMetricsCards
                  kpis={data.kpis}
                  periodoTexto={`competência ${formatCompetenciaDisplay(competencia)}`}
                />
              </Secao>

              {temPendencias && (
                <Secao
                  titulo="Pendências"
                  descricao="O que pede uma ação sua antes de concluir a conferência."
                >
                  <AlertaVinculoCard
                    alertas={exportacaoData?.alertas_vinculo}
                    companyId={selectedCompanyId}
                    onMarcarCiente={handleMarcarAlertaCiente}
                    loading={exportacaoLoading}
                  />
                  <RevisoesExportacaoEmpresa
                    revisoes={revisoesEmpresa}
                    empresaNome={currentCompany?.razao_social}
                    onDecidir={handleDecidirRevisao}
                    loading={exportacaoLoading}
                  />
                </Secao>
              )}

              <Secao
                titulo="Origem das notas"
                descricao="Confronto entre o que os integradores enviaram e o que está no BHules."
              >
                <TrackingOrigensCards
                  trackingData={trackingData}
                  loading={trackingLoading}
                  onRefresh={() => fetchTracking(true)}
                  companyId={selectedCompanyId}
                  competencia={competencia}
                  onOpenInvoice={onOpenInvoice}
                />
              </Secao>

              <Secao
                titulo="Parametrização"
                descricao="Tributação por código de serviço e cadastro de exportação de serviços."
              >
                <TabelaCodigosServico
                  servicos={data.servicos}
                  competencia={competencia}
                  fatorR={data.fator_r}
                  onSalvar={handleSalvarParametrizacao}
                />
                <ExportadorCadastroCard
                  empresa={exportacaoData?.empresa || currentCompany}
                  cadastroVivo={exportacaoData?.cadastro_vivo}
                  historico={exportacaoData?.historico}
                  tomadores={exportacaoData?.tomadores}
                  onSalvarCadastro={handleSalvarCadastro}
                  onSubstituirCadastro={handleSubstituirCadastro}
                  onRevogarCadastro={handleRevogarCadastro}
                  onCriarTomador={handleCriarTomador}
                  onRevogarTomador={handleRevogarTomador}
                  loading={exportacaoLoading}
                />
              </Secao>

              <Secao titulo="Histórico">
                <TabelaHistoricoAlteracoes historico={historicoCompleto} />
              </Secao>
            </>
          )}
        </>
      )}
    </div>
  )
}
