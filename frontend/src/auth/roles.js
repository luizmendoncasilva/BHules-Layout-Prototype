import { useAuth } from './useAuth'

// Namespaced claim where the Auth0 post-login Action injects the user's roles.
// Must match `auth0_roles_claim` in backend/app/config.py.
export const ROLES_CLAIM = 'https://bhub.ai/roles'

// Role gating the admin-only screens (Captura de Notas, Habilitar Clientes,
// Regras de Operação CFOP).
export const ROLE_FISCAL_ADM = 'fiscal-adms'

/** Roles carried by the authenticated user, or [] when absent. */
export function getRoles(user) {
  const roles = user?.[ROLES_CLAIM]
  return Array.isArray(roles) ? roles : []
}

/** Hook: true when the current user has `role`. */
export function useHasRole(role) {
  const { user } = useAuth()
  return getRoles(user).includes(role)
}
