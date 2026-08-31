import { FileUp, FileText, FileDown, Truck, Receipt } from 'lucide-react'

// Abas de "Notas Integradas" — cada uma é hoje uma tela própria navegável
// pela sidebar (ver Sidebar.jsx), mas o filtro cod_mod/ind_emit por aba
// continua vivendo aqui para ser consumido por NotasIntegradas.jsx.
// Direção sob a ótica do CLIENTE via ind_emit: '0' = emissão própria (SAÍDA),
// '1' = terceiro (ENTRADA). NÃO usamos ind_oper aqui — ele vem do tpNF do
// emitente e não distingue entrada/saída do cliente em NFe 55. CTe/NFCe entram
// como ENTRADA (terceiro emitiu).
export const INTEGRADAS_TABS = [
  { id: 'nfse_saida',   label: 'NFSe Saída',   icon: FileUp,   codMod: 'NFSE', indEmit: '0' },
  { id: 'nfe_saida',    label: 'NFe Saída',    icon: FileText, codMod: '55',   indEmit: '0' },
  { id: 'nfse_entrada', label: 'NFSe Entrada', icon: FileDown, codMod: 'NFSE', indEmit: '1' },
  { id: 'cte',          label: 'CTe',          icon: Truck,    codMod: '57',   indEmit: '1' },
  { id: 'nfce',         label: 'NFCe',         icon: Receipt,  codMod: '65',   indEmit: '1' },
]
