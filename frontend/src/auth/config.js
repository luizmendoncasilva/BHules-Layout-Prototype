export const authConfig = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || '',
  // Connections do tenant compartilhado (cockpit-prod) habilitadas para o
  // client do BHules. `bhub-azure-ad` é a connection Microsoft Entra ID que o
  // Cockpit mostra como "Continuar com BHub/Agrocontar" (estratégia waad).
  msConnection: import.meta.env.VITE_AUTH0_MS_CONNECTION || 'bhub-azure-ad',
  googleConnection: import.meta.env.VITE_AUTH0_GOOGLE_CONNECTION || 'google-oauth2',
}
