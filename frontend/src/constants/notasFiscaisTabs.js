import { FileUp, FileDown, Receipt, Package } from 'lucide-react'

// Árvore de segregação de "Notas Fiscais" — mesmo padrão aplicado em
// "Notas Integradas" (ver integradasTabs.js), agora para a tela de análise.
// Dois eixos independentes por documento (pedido original da Eliz):
//   - ind_emit: quem é o EMITENTE do documento — '0' = o próprio cliente
//     (Emitidas/Emitidos), '1' = terceiro (Recebidas/Recebidos).
//   - ind_oper: natureza da operação (CFOP) — '0' = Entrada, '1' = Saída.
// Materiais NF-e e CT-e cruzam os dois eixos (4 sub-telas cada, achatadas
// num único nível — sem 3º nível de accordion). Serviços NFS-e só varia por
// ind_emit (Prestados/Tomados). NFC-e não tem segregação nenhuma além de
// "Emitidas" — não se aplica entrada/saída nem recebimento.
export const NOTAS_FISCAIS_GROUPS = [
  {
    id: 'servicos-nfse',
    label: 'Serviços NFS-e',
    icon: Receipt,
    tabs: [
      { id: 'servicos_prestados', label: 'Prestados', icon: FileUp, codMod: 'NFSE', indEmit: '0' },
      { id: 'servicos_tomados', label: 'Tomados', icon: FileDown, codMod: 'NFSE', indEmit: '1' },
    ],
  },
  {
    id: 'materiais-nfe',
    label: 'Materiais NF-e',
    icon: Package,
    tabs: [
      { id: 'materiais_emitidas_entradas', label: 'Emitidas — Entradas', icon: FileDown, codMod: '55', indEmit: '0', indOper: '0' },
      { id: 'materiais_emitidas_saidas', label: 'Emitidas — Saídas', icon: FileUp, codMod: '55', indEmit: '0', indOper: '1' },
      { id: 'materiais_recebidas_entradas', label: 'Recebidas — Entradas', icon: FileDown, codMod: '55', indEmit: '1', indOper: '0' },
      { id: 'materiais_recebidas_saidas', label: 'Recebidas — Saídas', icon: FileUp, codMod: '55', indEmit: '1', indOper: '1' },
    ],
  },
]

// CT-e e NFC-e vivem como itens irmãos de "Notas Fiscais" na sidebar (não
// aninhados dentro dela) — mesma segregação por direção que os grupos acima.
export const CTE_TABS = [
  { id: 'cte_emitidos_entradas', label: 'Emitidos — Entradas', icon: FileDown, codMod: '57', indEmit: '0', indOper: '0' },
  { id: 'cte_emitidos_saidas', label: 'Emitidos — Saídas', icon: FileUp, codMod: '57', indEmit: '0', indOper: '1' },
  { id: 'cte_recebidos_entradas', label: 'Recebidos — Entradas', icon: FileDown, codMod: '57', indEmit: '1', indOper: '0' },
  { id: 'cte_recebidos_saidas', label: 'Recebidos — Saídas', icon: FileUp, codMod: '57', indEmit: '1', indOper: '1' },
]

// NFC-e: só emitidas pelos clientes — sem sub-segregação por direção nem
// por recebimento (o cliente nunca é destinatário de uma NFC-e).
export const NFC_TABS = [
  { id: 'nfc_emitidas', label: 'Emitidas', icon: FileUp, codMod: '65', indEmit: '0' },
]

// Lookup plano id -> meta da sub-tela — usado pelo ListView e pelo breadcrumb.
export const NOTAS_FISCAIS_TABS = NOTAS_FISCAIS_GROUPS.flatMap((g) => g.tabs)
