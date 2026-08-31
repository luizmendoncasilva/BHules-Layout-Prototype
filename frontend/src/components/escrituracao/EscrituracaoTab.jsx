import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, HelpCircle, BookOpen, Pencil, DollarSign, TrendingUp, ArrowRight, Scale } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Tooltip, TooltipTrigger, TooltipContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@bhubai/bhub-design-system'
import { api } from '../../api/client'
import { useCompanies } from '../../hooks/useCompanies'
import CorrectionModal from './CorrectionModal'

const confiancaColors = {
  ALTO: 'bg-success-subtle text-success-text border-success-border',
  MEDIO: 'bg-warning-subtle text-warning-text border-warning-border',
  BAIXO: 'bg-destructive-subtle text-destructive-text border-destructive-border',
}

const confiancaDotColors = {
  ALTO: 'bg-success',
  MEDIO: 'bg-warning',
  BAIXO: 'bg-destructive',
}

const severidadeColors = {
  CRITICO: 'bg-destructive-subtle text-destructive-text border-destructive-border',
  ALERTA: 'bg-warning-subtle text-warning-text border-warning-border',
  INFORMATIVO: 'bg-info-subtle text-info-text border-info-border',
  OPORTUNIDADE: 'bg-success-subtle text-success-text border-success-border',
}

// Categorical "fonte" tags — not severity, just provenance labels. Mapped to
// distinct tokens (semantic + the 4 restricted decorative pairs) for visual variety.
const fonteColors = {
  SPED_HISTORICO: 'bg-info-subtle text-info-text border-info-border',
  SPED_GENERALIZADO: 'bg-mizu-flow-subtle text-mizu-flow-bold border-mizu-flow-bold/30',
  TABELA_REFERENCIA: 'bg-muted text-muted-foreground border-border',
  LEGISLACAO_VETORIAL: 'bg-success-subtle text-success-text border-success-border',
  LLM: 'bg-magic-subtle text-magic-bold border-magic-bold/30',
  ANALISTA_AUDITADO: 'bg-warning-subtle text-warning-text border-warning-border',
  CADASTRO_PRODUTO: 'bg-coral-subtle text-coral-bold border-coral-bold/30',
  CFOP_EMITENTE: 'bg-dojo-steel-subtle text-dojo-steel-bold border-dojo-steel-bold/30',
  TIPO_ITEM: 'bg-muted text-muted-foreground border-border',
}

// CFOP descriptions (most common entrada CFOPs)
const cfopDescricoes = {
  '1101': 'Compra p/ industrialização',
  '1102': 'Compra p/ comercialização',
  '1111': 'Compra p/ industrialização (futura)',
  '1116': 'Compra p/ industrialização (OP mercantil)',
  '1117': 'Compra p/ comercialização (OP mercantil)',
  '1120': 'Compra p/ industrialização (Zona Franca)',
  '1121': 'Compra p/ comercialização (Zona Franca)',
  '1122': 'Compra p/ industrialização (ALC)',
  '1124': 'Industrialização (encomenda)',
  '1125': 'Industrialização (outra empresa)',
  '1126': 'Compra p/ uso/consumo (Zona Franca)',
  '1128': 'Compra p/ ativo (Zona Franca)',
  '1151': 'Transferência p/ industrialização',
  '1152': 'Transferência p/ comercialização',
  '1153': 'Transferência de energia elétrica',
  '1154': 'Transferência p/ uso/consumo',
  '1159': 'Entrada decorrente do fornec. prod. ou prest. serv.',
  '1201': 'Devolução de venda (industrialização)',
  '1202': 'Devolução de venda (comercialização)',
  '1203': 'Devolução de venda (ativo)',
  '1204': 'Devolução de venda (uso/consumo)',
  '1251': 'Compra de energia elétrica',
  '1252': 'Compra de energia elétrica (comercialização)',
  '1253': 'Compra de energia elétrica (processo industrial)',
  '1254': 'Compra de energia elétrica (uso/consumo)',
  '1301': 'Prestação de serviço de comunicação',
  '1302': 'Prestação de serviço de comunicação (SN)',
  '1351': 'Prestação de serviço de transporte (SP)',
  '1352': 'Prestação de serviço de transporte (SN)',
  '1401': 'Compra p/ industrialização (ST)',
  '1403': 'Compra p/ comercialização (ST)',
  '1406': 'Compra p/ ativo (ST)',
  '1407': 'Compra p/ uso/consumo (ST)',
  '1408': 'Transferência p/ industrialização (ST)',
  '1409': 'Transferência p/ comercialização (ST)',
  '1410': 'Devolução de venda (ST)',
  '1411': 'Devolução de venda p/ comercializ. (ST)',
  '1414': 'Retorno de prod. industrializada (ST)',
  '1501': 'Entrada (SUFRAMA)',
  '1551': 'Compra p/ ativo imobilizado',
  '1556': 'Compra p/ uso/consumo',
  '1901': 'Entrada para industrialização por encomenda',
  '1902': 'Retorno de mercadoria remetida',
  '1903': 'Entrada p/ consignação mercantil',
  '1904': 'Retorno de remessa p/ venda fora',
  '1905': 'Entrada de mercadoria (depósito fechado)',
  '1906': 'Retorno de mercadoria (armazém geral)',
  '1907': 'Retorno de conserto/reparo',
  '1908': 'Entrada de bem (comodato)',
  '1909': 'Retorno de bem (comodato)',
  '1910': 'Entrada de bonificação/doação/brinde',
  '1911': 'Entrada de amostra grátis',
  '1912': 'Entrada de mercadoria (demonstração)',
  '1913': 'Retorno de mercadoria (demonstração)',
  '1914': 'Retorno de mercadoria (exposição/feira)',
  '1916': 'Retorno de mercadoria (conserto/reparo)',
  '1917': 'Entrada de mercadoria em consignação',
  '1918': 'Devolução de mercadoria em consignação',
  '1919': 'Devolução simbólica (consignação)',
  '1920': 'Entrada de vasilhame ou sacaria',
  '1921': 'Entrada de vasilhame ou sacaria',
  '1922': 'Lançamento a título de simples faturamento',
  '1923': 'Entrada de mercadoria (armazém geral)',
  '1924': 'Entrada p/ industrialização por conta e ordem',
  '1925': 'Retorno p/ industrialização por conta e ordem',
  '1926': 'Lançamento a título de reclassificação de mercadoria',
  '1933': 'Aquisição de serviço tributado ICMS',
  '1949': 'Outra entrada não especificada',
  '2101': 'Compra p/ industrialização (interestadual)',
  '2102': 'Compra p/ comercialização (interestadual)',
  '2111': 'Compra p/ industrialização (futura, inter.)',
  '2116': 'Compra p/ industrialização (OP mercantil, inter.)',
  '2117': 'Compra p/ comercialização (OP mercantil, inter.)',
  '2120': 'Compra p/ industrialização (Zona Franca, inter.)',
  '2121': 'Compra p/ comercialização (Zona Franca, inter.)',
  '2122': 'Compra p/ industrialização (ALC, inter.)',
  '2124': 'Industrialização efetuada por outra empresa',
  '2125': 'Industrialização efetuada por outra empresa',
  '2126': 'Compra p/ uso/consumo (Zona Franca, inter.)',
  '2128': 'Compra p/ ativo (Zona Franca, inter.)',
  '2151': 'Transferência p/ industrialização (interestadual)',
  '2152': 'Transferência p/ comercialização (interestadual)',
  '2153': 'Transferência de energia elétrica (inter.)',
  '2154': 'Transferência p/ uso/consumo (interestadual)',
  '2201': 'Devolução de venda industrializ. (inter.)',
  '2202': 'Devolução de venda comercializ. (inter.)',
  '2203': 'Devolução de venda ativo (inter.)',
  '2204': 'Devolução de venda uso/consumo (inter.)',
  '2401': 'Compra p/ industrialização (ST, inter.)',
  '2403': 'Compra p/ comercialização (ST, inter.)',
  '2406': 'Compra p/ ativo (ST, inter.)',
  '2407': 'Compra p/ uso/consumo (ST, inter.)',
  '2408': 'Transferência p/ industrialização (ST, inter.)',
  '2409': 'Transferência p/ comercialização (ST, inter.)',
  '2410': 'Devolução de venda (ST, inter.)',
  '2411': 'Devolução de venda p/ comercializ. (ST, inter.)',
  '2414': 'Retorno de prod. industrializada (ST, inter.)',
  '2501': 'Entrada (SUFRAMA, interestadual)',
  '2551': 'Compra p/ ativo imobilizado (interestadual)',
  '2556': 'Compra p/ uso/consumo (interestadual)',
  '2901': 'Entrada p/ industrialização (inter.)',
  '2902': 'Retorno de mercadoria remetida (inter.)',
  '2903': 'Entrada p/ consignação mercantil (inter.)',
  '2904': 'Retorno de remessa p/ venda fora (inter.)',
  '2910': 'Entrada de bonificação/doação (inter.)',
  '2911': 'Entrada de amostra grátis (inter.)',
  '2912': 'Entrada de mercadoria (demonstração, inter.)',
  '2913': 'Retorno de mercadoria (demonstração, inter.)',
  '2914': 'Retorno de mercadoria (exposição, inter.)',
  '2916': 'Retorno de mercadoria (conserto, inter.)',
  '2917': 'Entrada de mercadoria em consignação (inter.)',
  '2918': 'Devolução de mercadoria em consignação (inter.)',
  '2919': 'Devolução simbólica (consignação, inter.)',
  '2920': 'Entrada de vasilhame ou sacaria (inter.)',
  '2921': 'Entrada de vasilhame ou sacaria (inter.)',
  '2933': 'Aquisição de serviço tributado ICMS (inter.)',
  '2949': 'Outra entrada não especificada (inter.)',
  '3101': 'Compra p/ industrialização (importação)',
  '3102': 'Compra p/ comercialização (importação)',
  '3127': 'Compra p/ uso/consumo (importação)',
  '3201': 'Devolução de venda (exportação)',
  '3551': 'Compra p/ ativo imobilizado (importação)',
}

// CST ICMS descriptions (inclui CSOSN do Simples Nacional)
const cstIcmsDescricoes = {
  '00': 'Tributada integralmente',
  '10': 'Tributada com ST',
  '20': 'Com redução de BC',
  '30': 'Isenta/não tributada + ST',
  '40': 'Isenta',
  '41': 'Não tributada',
  '50': 'Suspensão',
  '51': 'Diferimento',
  '60': 'ICMS ST retido anteriormente',
  '70': 'Redução BC + ST',
  '90': 'Outros',
  '101': 'SN tributada com crédito',
  '102': 'SN tributada sem crédito',
  '103': 'SN isenção (faixa de receita)',
  '201': 'SN tributada com crédito + ST',
  '202': 'SN tributada sem crédito + ST',
  '203': 'SN isenção (faixa) + ST',
  '300': 'SN imune',
  '400': 'SN não tributada',
  '500': 'SN ICMS cobrado anteriormente por ST',
  '900': 'SN outros',
}

// CST PIS/COFINS descriptions
const cstPisCofinsDescricoes = {
  '01': 'Operação tributável (BC=receita bruta)',
  '02': 'Operação tributável (BC=receita - exclusões)',
  '03': 'Operação tributável (BC=qtde vendida)',
  '04': 'Operação tributável (monofásica - revenda)',
  '05': 'Operação tributável (ST)',
  '06': 'Operação tributável (alíquota zero)',
  '07': 'Operação isenta',
  '08': 'Operação sem incidência',
  '09': 'Operação com suspensão',
  '49': 'Outras operações de saída',
  '50': 'Crédito (aquisição tributada)',
  '51': 'Crédito (aquisição tributável - BC exclusões)',
  '52': 'Crédito (aquisição tributável - BC qtde)',
  '53': 'Crédito (aquisição tributável de ent. não cumulat.)',
  '54': 'Crédito (aquisição ST)',
  '55': 'Crédito (aquisição tributável - alíquota zero)',
  '56': 'Crédito (aquisição isenta)',
  '60': 'Crédito (aquisição – importação)',
  '66': 'Crédito presumido (aquisição vinculada)',
  '67': 'Crédito presumido (outras operações)',
  '70': 'Operação sem crédito/débito',
  '71': 'Operação de aquisição sem crédito',
  '72': 'Operação de aquisição sem crédito',
  '73': 'Operação de aquisição sem crédito',
  '74': 'Operação de aquisição sem crédito (monofásica)',
  '75': 'Operação de aquisição sem crédito (ST)',
  '98': 'Outras operações de entrada',
  '99': 'Outras operações',
}

const fonteLabels = {
  SPED_HISTORICO: 'SPED',
  SPED_GENERALIZADO: 'SPED Gen.',
  TABELA_REFERENCIA: 'Tabela',
  LEGISLACAO_VETORIAL: 'Legislacao',
  LLM: 'LLM',
  ANALISTA_AUDITADO: 'Analista',
  CADASTRO_PRODUTO: 'Cadastro',
  CFOP_EMITENTE: 'CFOP Emit.',
  TIPO_ITEM: 'Tipo Item',
}

function formatBRL(val) {
  if (val == null) return 'R$ 0,00'
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function FonteBadge({ fonte }) {
  if (!fonte) return null
  const color = fonteColors[fonte] || 'bg-muted text-muted-foreground border-border'
  const label = fonteLabels[fonte] || fonte
  return (
    <Badge className={`rounded px-1.5 py-0.5 text-xs font-medium border ${color}`}>
      {label}
    </Badge>
  )
}

function ConfidenceBadge({ nivel, valor }) {
  const color = confiancaColors[nivel] || 'bg-muted text-muted-foreground border-border'
  const dotColor = confiancaDotColors[nivel] || 'bg-muted-foreground'
  const pct = valor != null ? `${(valor * 100).toFixed(0)}%` : ''
  return (
    <Badge className={`gap-1.5 px-2.5 py-1 text-xs font-semibold border ${color}`}>
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      {nivel} {pct && <span className="font-mono text-xs opacity-75">{pct}</span>}
    </Badge>
  )
}

function CreditoBadge({ credito, label }) {
  if (!credito) return null
  return (
    <div className="text-xs">
      <span className="text-muted-foreground">{label}: </span>
      {credito.tem_direito ? (
        <span className="text-success-text font-medium">
          {formatBRL(credito.valor)} ({Number(credito.aliquota)}%)
        </span>
      ) : credito.motivo_vedacao ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-muted-foreground cursor-default">sem credito</span>
          </TooltipTrigger>
          <TooltipContent>{credito.motivo_vedacao}</TooltipContent>
        </Tooltip>
      ) : (
        <span className="text-muted-foreground">sem credito</span>
      )}
    </div>
  )
}

function DivergenciaItem({ d }) {
  return (
    <div className={`text-xs px-2.5 py-1.5 rounded-lg border ${severidadeColors[d.severidade] || 'bg-muted border-border'}`}>
      <div className="flex items-center gap-2">
        <span className="font-semibold uppercase text-xs opacity-60">{d.severidade}</span>
        <span className="font-medium">{d.campo}</span>
        <span className="font-mono">{d.valor_emitente}</span>
        <span className="text-muted-foreground">-&gt;</span>
        <span className="font-mono font-medium">{d.valor_sugerido}</span>
      </div>
      {d.descricao && <p className="text-xs mt-0.5 opacity-80">{d.descricao}</p>}
    </div>
  )
}

function ResumoFinanceiro({ resumo }) {
  if (!resumo) return null

  const cards = [
    { label: 'Total Creditos', value: resumo.total_creditos, icon: TrendingUp, highlight: true },
    { label: 'Credito ICMS', value: resumo.total_credito_icms },
    { label: 'Credito PIS', value: resumo.total_credito_pis },
    { label: 'Credito COFINS', value: resumo.total_credito_cofins },
    { label: 'Credito IPI', value: resumo.total_credito_ipi },
    { label: 'DIFAL devido', value: resumo.total_difal },
    { label: 'ST retido', value: resumo.total_st_retido },
  ]

  return (
    <div className="bg-muted border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">Resumo Financeiro</h4>
        <span className="text-xs text-muted-foreground ml-auto">NF: {formatBRL(resumo.valor_total_nf)}</span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cards.map(({ label, value, icon: Icon, highlight }) => (
          <div
            key={label}
            className={`rounded-lg px-3 py-2 text-center ${
              highlight ? 'bg-primary/10 border border-primary/20' : 'bg-card border border-border'
            }`}
          >
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
            <div className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-primary' : 'text-foreground'}`}>
              {formatBRL(value || 0)}
            </div>
          </div>
        ))}
      </div>
      {(resumo.itens_com_divergencia > 0 || resumo.itens_para_revisao > 0) && (
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          {resumo.itens_com_divergencia > 0 && (
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-warning-text" />
              {resumo.itens_com_divergencia} itens com divergencia
            </span>
          )}
          {resumo.itens_para_revisao > 0 && (
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-warning-text" />
              {resumo.itens_para_revisao} itens para revisao
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function DeParaRow({ campo, emitente, entrada, divergente, descEmitente, descEntrada }) {
  return (
    <TableRow className={divergente ? 'bg-warning-subtle/50' : ''}>
      <TableCell className="px-3 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{campo}</TableCell>
      <TableCell className="px-3 py-1.5 text-xs text-muted-foreground">
        <span className="font-mono">{emitente || '--'}</span>
        {descEmitente && <span className="ml-1 text-xs text-muted-foreground">({descEmitente})</span>}
      </TableCell>
      <TableCell className="px-3 py-1.5 text-center text-muted-foreground"><ArrowRight className="w-3 h-3 inline" /></TableCell>
      <TableCell className={`px-3 py-1.5 text-xs font-medium ${divergente ? 'text-warning-text' : 'text-foreground'}`}>
        <span className="font-mono">{entrada || '--'}</span>
        {descEntrada && <span className="ml-1 text-xs font-normal text-muted-foreground">({descEntrada})</span>}
      </TableCell>
    </TableRow>
  )
}

// Shared grid template for header + rows.
// Larguras fixas calculadas por coluna (não são espaçamentos de token simples —
// cada valor foi ajustado ao conteúdo da coluna: chevron, #, descrição flexível,
// NCM, finalidade, CFOP, CST, PIS/COF, confiança, ícone de status, valor).
// Convertidas para rem (base 16px) para acompanhar a escala tipográfica do DS.
const GRID_COLS = 'grid-cols-[1.25rem_1.75rem_1fr_4.75rem_5.25rem_3.125rem_2.625rem_3.625rem_5.625rem_2.5rem_5rem]'

function SugestaoRow({ s, index, onFeedback, feedbackStatus }) {
  const [expanded, setExpanded] = useState(false)

  // Check divergences per field
  const divFields = new Set((s.divergencias || []).map(d => d.campo))

  return (
    <div className={`border-b border-border last:border-0 ${
      feedbackStatus === 'confirmed' ? 'bg-success-subtle/30' : feedbackStatus === 'corrected' ? 'bg-warning-subtle/30' : ''
    }`}>
      <div
        className={`grid ${GRID_COLS} items-center px-3 py-2.5 gap-1 cursor-pointer hover:bg-accent/50`}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        <span className="text-xs text-muted-foreground">#{s.num_item}</span>
        <span className="text-sm font-medium truncate pr-1" title={s.descricao}>{s.descricao || `Item ${s.num_item}`}</span>
        <span className="text-xs font-mono text-muted-foreground truncate">{s.ncm}</span>
        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary text-center truncate">{s.finalidade}</span>
        <span className="text-xs font-mono text-center">{s.cfop_entrada || '--'}</span>
        <span className="text-xs font-mono text-center">{s.cst_icms_entrada || '--'}</span>
        <span className="text-xs font-mono text-muted-foreground text-center">{s.cst_pis_entrada || '--'}/{s.cst_cofins_entrada || '--'}</span>
        <div className="flex justify-center"><ConfidenceBadge nivel={s.nivel_confianca} valor={s.confianca_geral} /></div>
        <div className="flex justify-center">
          {s.divergencias?.length > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-warning-text">
              <AlertTriangle className="w-3 h-3" /> {s.divergencias.length}
            </span>
          )}
          {feedbackStatus && (
            <Badge className={`px-1 py-0.5 text-xs font-semibold gap-0.5 ${
              feedbackStatus === 'confirmed'
                ? 'bg-success-subtle text-success-text'
                : 'bg-warning-subtle text-warning-text'
            }`}>
              {feedbackStatus === 'confirmed' ? <CheckCircle2 className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
            </Badge>
          )}
        </div>
        <span className="text-xs font-medium text-right">{formatBRL(s.valor_item)}</span>
      </div>

      {expanded && (
          <div className="px-6 pb-4 border-t border-border space-y-3 bg-muted/30">
            {/* De → Para comparison table */}
            <div className="pt-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                Comparativo Emitente → Entrada
                <FonteBadge fonte={s.finalidade_fonte} />
              </h4>
              <Table className="text-sm w-full max-w-2xl">
                <TableHeader>
                  <TableRow className="border-b border-border">
                    <TableHead className="px-3 py-1.5 text-left text-xs text-muted-foreground uppercase w-32">Campo</TableHead>
                    <TableHead className="px-3 py-1.5 text-left text-xs text-muted-foreground uppercase w-28">Emitente (saida)</TableHead>
                    <TableHead className="px-3 py-1.5 w-6"></TableHead>
                    <TableHead className="px-3 py-1.5 text-left text-xs text-muted-foreground uppercase w-28">Entrada (sugerido)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <DeParaRow campo="Finalidade" emitente="--" entrada={s.finalidade} divergente={false} />
                  <DeParaRow campo="CFOP" emitente={s.cfop_emitente || '--'} entrada={s.cfop_entrada} divergente={divFields.has('cfop')} descEmitente={cfopDescricoes[s.cfop_emitente]} descEntrada={cfopDescricoes[s.cfop_entrada]} />
                  <DeParaRow campo="CST ICMS" emitente={s.cst_icms_emitente} entrada={s.cst_icms_entrada} divergente={divFields.has('cst_icms')} descEmitente={cstIcmsDescricoes[s.cst_icms_emitente]} descEntrada={cstIcmsDescricoes[s.cst_icms_entrada]} />
                  <DeParaRow campo="CST PIS" emitente={s.cst_pis_emitente} entrada={s.cst_pis_entrada} divergente={divFields.has('cst_pis')} descEmitente={cstPisCofinsDescricoes[s.cst_pis_emitente]} descEntrada={cstPisCofinsDescricoes[s.cst_pis_entrada]} />
                  <DeParaRow campo="CST COFINS" emitente={s.cst_cofins_emitente} entrada={s.cst_cofins_entrada} divergente={divFields.has('cst_cofins')} descEmitente={cstPisCofinsDescricoes[s.cst_cofins_emitente]} descEntrada={cstPisCofinsDescricoes[s.cst_cofins_entrada]} />
                  <DeParaRow campo="Aliq. ICMS" emitente={s.aliq_icms_emitente != null ? `${s.aliq_icms_emitente}%` : null} entrada={s.credito_icms?.aliquota ? `${Number(s.credito_icms.aliquota)}%` : null} divergente={divFields.has('aliq_icms')} />
                </TableBody>
              </Table>
            </div>

            {/* Credits */}
            <div className="bg-card rounded-lg p-3 border border-border">
              <div className="text-xs font-medium text-muted-foreground mb-2">Creditos Tributarios</div>
              <div className="grid grid-cols-4 gap-4">
                <CreditoBadge credito={s.credito_icms} label="ICMS" />
                <CreditoBadge credito={s.credito_pis} label="PIS" />
                <CreditoBadge credito={s.credito_cofins} label="COFINS" />
                <CreditoBadge credito={s.credito_ipi} label="IPI" />
              </div>
            </div>

            {/* DIFAL */}
            {s.difal_devido && (
              <div className="text-xs bg-warning-subtle border border-warning-border px-3 py-2 rounded-lg">
                <span className="font-medium text-warning-text">DIFAL devido:</span>{' '}
                {formatBRL(s.difal_valor)} (interna {Number(s.difal_aliq_interna || 0)}% - inter {Number(s.difal_aliq_interestadual || 0)}%)
              </div>
            )}

            {/* ST */}
            {s.tratamento_st && s.tratamento_st !== 'SEM_ST' && (
              <div className="text-xs bg-magic-subtle border border-magic-bold/30 px-3 py-2 rounded-lg">
                <span className="font-medium text-magic-bold">ST:</span> {s.tratamento_st}
                {s.st_valor_retido > 0 && <span> -- {formatBRL(s.st_valor_retido)} retido</span>}
              </div>
            )}

            {/* Base Legal */}
            {s.fundamentacoes?.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Scale className="w-3 h-3" /> Base Legal ({s.fundamentacoes.length})
                </div>
                <div className="bg-card rounded-lg border border-border divide-y divide-border overflow-visible">
                  {s.fundamentacoes.map((f, i) => (
                    <div key={i} className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-xs font-semibold text-foreground break-words">{f.norma}</span>
                        {f.dispositivo && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono whitespace-nowrap">
                            {f.dispositivo}
                          </span>
                        )}
                        {f.fonte && <FonteBadge fonte={f.fonte} />}
                      </div>
                      {f.texto_resumido && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed break-words">{f.texto_resumido}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divergences */}
            {s.divergencias?.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Divergencias ({s.divergencias.length})
                </div>
                {s.divergencias.map((d, i) => <DivergenciaItem key={i} d={d} />)}
              </div>
            )}

            {/* Feedback buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              {feedbackStatus ? (
                <Badge className={`gap-1.5 px-3 py-1.5 text-xs font-semibold border ${
                  feedbackStatus === 'confirmed'
                    ? 'bg-success-subtle text-success-text border-success-border'
                    : 'bg-warning-subtle text-warning-text border-warning-border'
                }`}>
                  {feedbackStatus === 'confirmed' ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Confirmado</>
                  ) : (
                    <><Pencil className="w-3.5 h-3.5" /> Corrigido</>
                  )}
                </Badge>
              ) : (
                <>
                  <Button
                    onClick={(e) => { e.stopPropagation(); onFeedback?.(s.invoice_item_id, true) }}
                    size="sm"
                    className="gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-success-subtle text-success-text border border-success-border hover:bg-success-subtle hover:opacity-80"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); onFeedback?.(s.invoice_item_id, false) }}
                    size="sm"
                    className="gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-warning-subtle text-warning-text border border-warning-border hover:bg-warning-subtle hover:opacity-80"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Corrigir
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
    </div>
  )
}

export default function EscrituracaoTab({ data, invoice }) {
  const queryClient = useQueryClient()
  const [feedbackSent, setFeedbackSent] = useState({})
  const [correctionItem, setCorrectionItem] = useState(null)
  const { data: companies = [] } = useCompanies()

  const company = useMemo(() => {
    if (!invoice?.company_id) return null
    return companies.find(c => c.id === invoice.company_id) || null
  }, [companies, invoice?.company_id])

  if (!data) {
    return <div className="p-6 text-muted-foreground text-sm">Nenhum resultado de escrituracao disponivel.</div>
  }

  const { perfil, validacao_formal, sugestoes, resumo, confianca_geral, nivel_confianca, total_divergencias, requer_revisao_humana, etapas_executadas, erros } = data

  const sendFeedback = async (itemId, acertou, correcoes = null) => {
    try {
      const payload = [{ invoice_item_id: itemId, motor_acertou: acertou }]
      if (correcoes) payload[0].correcoes = correcoes
      await api.submitEscrituracaoFeedback(data.invoice_id, payload)
      setFeedbackSent(prev => ({ ...prev, [itemId]: acertou ? 'confirmed' : 'corrected' }))
      // Invalidate cached escrituração data so corrections are reflected
      queryClient.invalidateQueries({ queryKey: ['escrituracao', invoice?.id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['statusCounts'] })
    } catch (e) {
      console.error('Feedback error:', e)
    }
  }

  const handleFeedback = (itemId, acertou) => {
    if (acertou) {
      sendFeedback(itemId, true)
    } else {
      const item = sugestoes?.find(s => s.invoice_item_id === itemId)
      if (item) setCorrectionItem(item)
    }
  }

  const handleCorrection = async (itemId, correcoes) => {
    await sendFeedback(itemId, false, correcoes)
    setCorrectionItem(null)
  }

  return (
    // max-h calculado por viewport: o container pai (drawer/detail view) não
    // garante hoje um layout flex com altura definida até aqui, então manter
    // um cálculo de viewport é a opção segura (evita depender de min-h/flex-1
    // do ancestral, que não é controlado por este componente).
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
      {/* Header with confidence badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base">Sugestao de Escrituracao</h3>
          <ConfidenceBadge nivel={nivel_confianca} valor={confianca_geral} />
          {requer_revisao_humana && (
            <Badge className="text-xs px-2 py-0.5 gap-1 bg-warning-subtle text-warning-text border border-warning-border">
              <HelpCircle className="w-3 h-3" /> Revisao necessaria
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-3">
          <span>{etapas_executadas?.length || 0} etapas</span>
          <span>{total_divergencias} divergencias</span>
          <span>{sugestoes?.length || 0} itens</span>
        </div>
      </div>

      {/* Errors */}
      {erros?.length > 0 && (
        <div className="bg-destructive-subtle border border-destructive-border rounded-lg p-3">
          <div className="text-sm font-medium text-destructive-text mb-1">Erros na analise</div>
          {erros.map((e, i) => <div key={i} className="text-xs text-destructive-text">{e}</div>)}
        </div>
      )}

      {/* Blocked invoice — cancelled or irregular */}
      {validacao_formal?.bloqueante && (
        <div className="bg-destructive-subtle border border-destructive-border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-destructive-text font-medium text-sm">
            <AlertTriangle className="w-4 h-4" />
            NF-e bloqueada — nao deve ser escriturada
          </div>
          <div className="text-xs text-destructive-text space-y-1">
            {validacao_formal.problemas?.map((p, i) => <div key={i}>{p}</div>)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Notas com situacao irregular (canceladas, denegadas, inutilizadas) nao geram obrigacoes fiscais e nao devem ser escrituradas no SPED Fiscal.
          </div>
        </div>
      )}

      {/* Formal validation — non-blocking warnings */}
      {validacao_formal && !validacao_formal.valido && !validacao_formal.bloqueante && (
        <div className="bg-warning-subtle border border-warning-border rounded-lg p-3">
          <div className="text-sm font-medium text-warning-text mb-1">Problemas formais</div>
          {validacao_formal.problemas?.map((p, i) => <div key={i} className="text-xs text-warning-text">{p}</div>)}
        </div>
      )}

      {/* Financial summary card */}
      <ResumoFinanceiro resumo={resumo} />

      {/* Destinatário profile */}
      {(company || invoice) && (
        <div className="flex gap-3 text-xs text-muted-foreground bg-muted rounded-lg px-4 py-2 items-center flex-wrap">
          <span className="font-medium text-foreground">{company?.razao_social || company?.name || invoice?.dest_cnpj || '--'}</span>
          <span className="text-border">|</span>
          <span>CNPJ: {company?.cnpj || invoice?.dest_cnpj || '--'}</span>
          <span className="text-border">|</span>
          <span>{company?.regime_tributario || '--'}</span>
          <span className="text-border">|</span>
          <span>UF: {company?.uf || invoice?.dest_uf || '--'}</span>
        </div>
      )}

      {/* Items list */}
      {/* min-w fixo: garante que a tabela densa (colunas de larguras fixas
          acima) não colapse abaixo da largura necessária para todas as
          colunas; overflow-x-auto cuida do scroll em telas menores. */}
      <div className="overflow-x-auto min-w-[900px]">
        {/* Header row — same grid as SugestaoRow */}
        <div className={`grid ${GRID_COLS} items-center px-3 py-1.5 gap-1 border-b border-border`}>
          <span></span>
          <span className="text-xs text-muted-foreground uppercase">#</span>
          <span className="text-xs text-muted-foreground uppercase">Descricao</span>
          <span className="text-xs text-muted-foreground uppercase">NCM</span>
          <span className="text-xs text-muted-foreground uppercase text-center">Finalidade</span>
          <span className="text-xs text-muted-foreground uppercase text-center">CFOP</span>
          <span className="text-xs text-muted-foreground uppercase text-center">CST</span>
          <span className="text-xs text-muted-foreground uppercase text-center">PIS/COF</span>
          <span className="text-xs text-muted-foreground uppercase text-center">Confianca</span>
          <span></span>
          <span className="text-xs text-muted-foreground uppercase text-right">Valor</span>
        </div>
        {/* Item rows */}
        {sugestoes?.map((s, i) => (
          <SugestaoRow
            key={s.invoice_item_id || i}
            s={s}
            index={i}
            onFeedback={handleFeedback}
            feedbackStatus={feedbackSent[s.invoice_item_id]}
          />
        ))}
      </div>

      {/* Correction Modal */}
      {correctionItem && (
        <CorrectionModal
          item={correctionItem}
          onClose={() => setCorrectionItem(null)}
          onSubmit={handleCorrection}
          regimeTributario={perfil?.regime_tributario || company?.regime_tributario}
        />
      )}

      {/* Total footer */}
      {resumo && (
        <div className="flex justify-between items-center bg-primary/5 rounded-lg px-4 py-3 border border-primary/10">
          <div className="text-sm">
            <span className="text-muted-foreground">{sugestoes?.length || 0} itens</span>
            {resumo.itens_para_revisao > 0 && (
              <span className="text-warning-text ml-2">-- {resumo.itens_para_revisao} para revisao</span>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-foreground">Total creditos: {formatBRL(resumo.total_creditos)}</div>
            <div className="text-xs text-muted-foreground">NF: {formatBRL(resumo.valor_total_nf)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
