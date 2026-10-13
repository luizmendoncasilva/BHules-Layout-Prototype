// Confirmar manda motor_acertou só nos tributos ainda não corrigidos.
// Lista vazia (tudo corrigido) ainda escritura (NFSC-03).
export function chavesParaConfirmar(chavesAplicaveis, feedbackPorTributo) {
  return chavesAplicaveis.filter((k) => feedbackPorTributo[k]?.tipo !== 'corrigido')
}
