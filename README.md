# BHules — Layout Prototype

Protótipo do frontend do BHules (Motor de Regras NF-e/NFS-e) usando o design system `@bhubai/bhub-design-system`.

## Estrutura

```
frontend/         # app React (Vite) — é o que a Vercel deve buildar
design-system/    # @bhubai/bhub-design-system, referenciado por frontend/package.json via "file:../design-system"
```

## Deploy na Vercel

Como o app fica dentro de `frontend/` (não na raiz do repo), configure no projeto da Vercel:

**Settings → General → Root Directory** → `frontend`

Build Command e Output Directory podem ficar nos padrões do Vite (`npm run build` / `dist`).
