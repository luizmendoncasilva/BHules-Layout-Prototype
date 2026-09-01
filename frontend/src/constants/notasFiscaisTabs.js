import { FileUp, FileDown, Receipt, Package } from 'lucide-react'

// Árvore de segregação de "Notas Fiscais" — mesmo padrão aplicado em
// "Notas Integradas" (ver integradasTabs.js), agora para a tela de análise.
// Cada grupo (Serviços NFS-e / Materiais NF-e) tem duas sub-telas por direção,
// sob a ótica do CLIENTE via ind_emit: '0' = emissão própria (SAÍDA),
// '1' = terceiro (ENTRADA).
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
      { id: 'materiais_saidas', label: 'Saídas', icon: FileUp, codMod: '55', indEmit: '0' },
      { id: 'materiais_entradas', label: 'Entradas', icon: FileDown, codMod: '55', indEmit: '1' },
    ],
  },
]

// CT-e e NFC-e vivem como itens irmãos de "Notas Fiscais" na sidebar (não
// aninhados dentro dela) — mesma segregação por direção que os grupos acima.
export const CTE_TABS = [
  { id: 'cte_saidas', label: 'Saídas', icon: FileUp, codMod: '57', indEmit: '0' },
  { id: 'cte_entradas', label: 'Entradas', icon: FileDown, codMod: '57', indEmit: '1' },
]

export const NFC_TABS = [
  { id: 'nfc_saidas', label: 'Saídas', icon: FileUp, codMod: '65', indEmit: '0' },
]

// Lookup plano id -> meta da sub-tela — usado pelo ListView e pelo breadcrumb.
export const NOTAS_FISCAIS_TABS = NOTAS_FISCAIS_GROUPS.flatMap((g) => g.tabs)
