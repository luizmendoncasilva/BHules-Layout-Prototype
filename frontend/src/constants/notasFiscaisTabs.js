import { FileUp, FileDown, Receipt, Package, ArrowUpToLine, ArrowDownToLine } from 'lucide-react'

// Árvore de segregação de "Notas Fiscais" — mesmo padrão aplicado em
// "Notas Integradas" (ver integradasTabs.js), agora para a tela de análise.
// Dois eixos independentes por documento (pedido original da Eliz):
//   - ind_emit: quem é o EMITENTE do documento — '0' = o próprio cliente
//     (Emitidas/Emitidos), '1' = terceiro (Recebidas/Recebidos).
//   - ind_oper: natureza da operação (CFOP) — '0' = Entrada, '1' = Saída.
// Materiais NF-e e CT-e cruzam os dois eixos, e por serem dois eixos de
// verdade (não um só disfarçado de dois) viram 3 níveis de accordion:
// grupo > Emitida(o)/Recebida(o) > Entrada/Saída (ver `groups` abaixo — um
// nó com `groups` aninha mais um nível; um nó com `tabs` é folha). Serviços
// NFS-e só varia por ind_emit (2 níveis). NFC-e não tem segregação nenhuma
// além de "Emitidas" — não se aplica entrada/saída nem recebimento.
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
    groups: [
      {
        id: 'materiais-emitidas',
        label: 'Emitidas',
        icon: ArrowUpToLine,
        tabs: [
          { id: 'materiais_emitidas_entradas', label: 'Entrada', icon: FileDown, codMod: '55', indEmit: '0', indOper: '0' },
          { id: 'materiais_emitidas_saidas', label: 'Saída', icon: FileUp, codMod: '55', indEmit: '0', indOper: '1' },
        ],
      },
      {
        id: 'materiais-recebidas',
        label: 'Recebidas',
        icon: ArrowDownToLine,
        tabs: [
          { id: 'materiais_recebidas_entradas', label: 'Entrada', icon: FileDown, codMod: '55', indEmit: '1', indOper: '0' },
          { id: 'materiais_recebidas_saidas', label: 'Saída', icon: FileUp, codMod: '55', indEmit: '1', indOper: '1' },
        ],
      },
    ],
  },
]

// CT-e vive como item irmão de "Notas Fiscais" na sidebar (não aninhado
// dentro dela), mas com a mesma árvore de 3 níveis que Materiais NF-e:
// CT-e > Emitidos/Recebidos > Entrada/Saída.
export const CTE_GROUPS = [
  {
    id: 'cte-emitidos',
    label: 'Emitidos',
    icon: ArrowUpToLine,
    tabs: [
      { id: 'cte_emitidos_entradas', label: 'Entrada', icon: FileDown, codMod: '57', indEmit: '0', indOper: '0' },
      { id: 'cte_emitidos_saidas', label: 'Saída', icon: FileUp, codMod: '57', indEmit: '0', indOper: '1' },
    ],
  },
  {
    id: 'cte-recebidos',
    label: 'Recebidos',
    icon: ArrowDownToLine,
    tabs: [
      { id: 'cte_recebidos_entradas', label: 'Entrada', icon: FileDown, codMod: '57', indEmit: '1', indOper: '0' },
      { id: 'cte_recebidos_saidas', label: 'Saída', icon: FileUp, codMod: '57', indEmit: '1', indOper: '1' },
    ],
  },
]

// NFC-e: só emitidas pelos clientes — sem sub-segregação por direção nem
// por recebimento (o cliente nunca é destinatário de uma NFC-e).
export const NFC_TABS = [
  { id: 'nfc_emitidas', label: 'Emitidas', icon: FileUp, codMod: '65', indEmit: '0' },
]

// Achata uma árvore de grupos (nós com `tabs` OU `groups`, nunca os dois)
// numa lista plana de folhas — usado pelo ListView (nem olha a árvore, só
// o id da sub-tela ativa) e pelo breadcrumb (mostra o label da folha).
function flattenTabs(nodes) {
  return nodes.flatMap((n) => (n.tabs ? n.tabs : flattenTabs(n.groups || [])))
}

export const NOTAS_FISCAIS_TABS = flattenTabs(NOTAS_FISCAIS_GROUPS)
export const CTE_TABS = flattenTabs(CTE_GROUPS)

// Caminho completo (labels dos grupos + folha) até uma sub-tela — usado
// pelo breadcrumb do header pra mostrar a árvore inteira (ex: "Materiais
// NF-e > Recebidas > Entrada"), não só o último nível como NOTAS_FISCAIS_TABS.
function findPath(nodes, id, prefix = []) {
  for (const node of nodes) {
    if (node.tabs) {
      const tab = node.tabs.find((t) => t.id === id)
      if (tab) return [...prefix, node.label, tab.label]
    } else if (node.groups) {
      const found = findPath(node.groups, id, [...prefix, node.label])
      if (found) return found
    }
  }
  return null
}

export const pathForNotasFiscais = (id) => findPath(NOTAS_FISCAIS_GROUPS, id)
export const pathForCte = (id) => findPath(CTE_GROUPS, id)
