import { useAuth0 } from '@auth0/auth0-react'

const AUTH_DISABLED = import.meta.env.VITE_AUTH0_DISABLED === 'true'

const mockAuth = {
  isLoading: false,
  isAuthenticated: true,
  user: {
    name: 'Dev Local',
    email: 'dev@bhub.ai',
    picture: '',
    // Dev bypass grants all roles so local dev sees every screen.
    'https://bhub.ai/roles': ['fiscal-adms'],
  },
  logout: () => {},
  loginWithRedirect: () => {},
  getAccessTokenSilently: async () => '',
}

export function useAuth() {
  if (AUTH_DISABLED) return mockAuth
  return useAuth0()
}
