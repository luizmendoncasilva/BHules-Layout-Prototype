import { FileUp, FileDown, Receipt, Package, Truck, ShoppingCart, ArrowUpToLine, ArrowDownToLine } from 'lucide-react'

// Árvore de "Notas Integradas" — mesma segregação de "Notas Fiscais"
// (notasFiscaisTabs.js), a pedido da Eliz: Serviços NFS-e > Prestados/Tomados;
// Materiais NF-e e CT-e > Emitidas(os)/Recebidas(os) > Entrada/Saída; NFC-e.
// Os dois eixos são os mesmos da tela de análise:
//   - ind_emit: '0' = o próprio cliente emitiu, '1' = terceiro emitiu.
//   - ind_oper: natureza da operação (CFOP) — '0' = Entrada, '1' = Saída.
// Um nó com `groups` aninha mais um nível; um nó com `tabs` é folha. Os ids
// levam o prefixo `int_` para não colidir com os de Notas Fiscais.
export const INTEGRADAS_GROUPS = [
  {
    id: 'int-servicos-nfse',
    label: 'Serviços NFS-e',
    icon: Receipt,
    tabs: [
      { id: 'int_servicos_prestados', label: 'Prestados', icon: FileUp, codMod: 'NFSE', indEmit: '0' },
      { id: 'int_servicos_tomados', label: 'Tomados', icon: FileDown, codMod: 'NFSE', indEmit: '1' },
    ],
  },
  {
    id: 'int-materiais-nfe',
    label: 'Materiais NF-e',
    icon: Package,
    groups: [
      {
        id: 'int-materiais-emitidas',
        label: 'Emitidas',
        icon: ArrowUpToLine,
        tabs: [
          { id: 'int_materiais_emitidas_entradas', label: 'Entrada', icon: FileDown, codMod: '55', indEmit: '0', indOper: '0' },
          { id: 'int_materiais_emitidas_saidas', label: 'Saída', icon: FileUp, codMod: '55', indEmit: '0', indOper: '1' },
        ],
      },
      {
        id: 'int-materiais-recebidas',
        label: 'Recebidas',
        icon: ArrowDownToLine,
        tabs: [
          { id: 'int_materiais_recebidas_entradas', label: 'Entrada', icon: FileDown, codMod: '55', indEmit: '1', indOper: '0' },
          { id: 'int_materiais_recebidas_saidas', label: 'Saída', icon: FileUp, codMod: '55', indEmit: '1', indOper: '1' },
        ],
      },
    ],
  },
  {
    id: 'int-cte',
    label: 'CT-e',
    icon: Truck,
    groups: [
      {
        id: 'int-cte-emitidos',
        label: 'Emitidos',
        icon: ArrowUpToLine,
        tabs: [
          { id: 'int_cte_emitidos_entradas', label: 'Entrada', icon: FileDown, codMod: '57', indEmit: '0', indOper: '0' },
          { id: 'int_cte_emitidos_saidas', label: 'Saída', icon: FileUp, codMod: '57', indEmit: '0', indOper: '1' },
        ],
      },
      {
        id: 'int-cte-recebidos',
        label: 'Recebidos',
        icon: ArrowDownToLine,
        tabs: [
          { id: 'int_cte_recebidos_entradas', label: 'Entrada', icon: FileDown, codMod: '57', indEmit: '1', indOper: '0' },
          { id: 'int_cte_recebidos_saidas', label: 'Saída', icon: FileUp, codMod: '57', indEmit: '1', indOper: '1' },
        ],
      },
    ],
  },
  {
    // Na análise a NFC-e só tem "Emitidas"; aqui fica também "Recebidas",
    // porque o integrador entrega NFC-e de terceiro (cupom de compra).
    id: 'int-nfce',
    label: 'NFC-e',
    icon: ShoppingCart,
    tabs: [
      { id: 'int_nfce_emitidas', label: 'Emitidas', icon: FileUp, codMod: '65', indEmit: '0' },
      { id: 'int_nfce_recebidas', label: 'Recebidas', icon: FileDown, codMod: '65', indEmit: '1' },
    ],
  },
]

function flattenTabs(nodes) {
  return nodes.flatMap((n) => (n.tabs ? n.tabs : flattenTabs(n.groups || [])))
}

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

// Lista plana das folhas (NotasIntegradas.jsx só olha o id da sub-tela ativa).
export const INTEGRADAS_TABS = flattenTabs(INTEGRADAS_GROUPS)
export const INTEGRADAS_TAB_PADRAO = 'int_servicos_prestados'
// Caminho completo para o breadcrumb e o título (ex.: "Materiais NF-e > Recebidas > Entrada").
export const pathForIntegradas = (id) => findPath(INTEGRADAS_GROUPS, id)
