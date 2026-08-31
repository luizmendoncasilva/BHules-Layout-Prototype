import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { authConfig } from './auth/config'
import { setTokenProvider } from './api/client'
import './index.css'
import '@bhubai/bhub-design-system/dist/styles.css'

const AUTH_DISABLED = import.meta.env.VITE_AUTH0_DISABLED === 'true'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function TokenBridge() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()
  useEffect(() => {
    if (!isAuthenticated) {
      setTokenProvider(null)
      return
    }
    setTokenProvider(() =>
      getAccessTokenSilently(
        authConfig.audience
          ? { authorizationParams: { audience: authConfig.audience } }
          : undefined
      )
    )
  }, [isAuthenticated, getAccessTokenSilently])
  return null
}

function AppWithProviders({ withAuth0 = false }) {
  return (
    <QueryClientProvider client={queryClient}>
      {withAuth0 && <TokenBridge />}
      <App />
    </QueryClientProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {AUTH_DISABLED ? (
      <AppWithProviders />
    ) : (
      <Auth0Provider
        domain={authConfig.domain}
        clientId={authConfig.clientId}
        cacheLocation="localstorage"
        authorizationParams={{
          redirect_uri: window.location.origin,
          ...(authConfig.audience ? { audience: authConfig.audience } : {}),
        }}
      >
        <AppWithProviders withAuth0 />
      </Auth0Provider>
    )}
  </React.StrictMode>,
)
