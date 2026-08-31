import { FileText, FileCode2, Sheet } from 'lucide-react'

// Tipos de arquivo SPED — hoje são telas próprias navegáveis pela sidebar
// (ver Sidebar.jsx), mas a lista/ícones/labels continuam vivendo aqui para
// serem consumidos por SpedManager.jsx.
export const SPED_TABS = [
  { id: 'fiscal',           label: 'SPED Fiscal (ICMS/IPI)',         icon: FileText },
  { id: 'contrib',          label: 'EFD Contribuições (PIS/COFINS)', icon: FileText },
  { id: 'reinf',            label: 'EFD-Reinf',                      icon: FileCode2 },
  { id: 'simples_nacional', label: 'Contexto Simples Nacional',      icon: Sheet },
]
