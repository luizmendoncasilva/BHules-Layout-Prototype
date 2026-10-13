// SPEC_DEVIATION: design.md §6.4 previa estes componentes em components/tributacao/.
// Reason: são quatro cartões + modal + rótulos só de exportação; a pasta própria
// evita inflar a de tributação, e a aba Parâmetros continua importando daqui.
export { ExportadorCadastroCard } from './ExportadorCadastroCard'
export { AlertaVinculoCard } from './AlertaVinculoCard'
export { RevisoesExportacaoEmpresa } from './RevisoesExportacaoEmpresa'
export { RevisoesExportacaoVisaoGeral } from './RevisoesExportacaoVisaoGeral'
