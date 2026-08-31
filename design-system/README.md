# BHub Design System

Biblioteca de componentes de interface construída sobre [shadcn/ui](https://ui.shadcn.com), [Radix UI](https://www.radix-ui.com) e [Tailwind CSS](https://tailwindcss.com), desenvolvida com Next.js e documentada via Storybook.

## Documentação

A documentação interativa dos componentes está disponível no Storybook:

https://69a0a2192834f6b96fb95c94-neniddjupg.chromatic.com/

## Stack

| Ferramenta   | Versão | Papel                          |
| ------------ | ------ | ------------------------------ |
| Next.js      | 16     | Framework base                 |
| React        | 19     | UI                             |
| Tailwind CSS | 4      | Estilização                    |
| shadcn/ui    | —      | Base dos componentes           |
| Radix UI     | —      | Primitivos acessíveis          |
| Storybook    | 10     | Documentação e desenvolvimento |
| Vitest       | 4      | Testes                         |

## Componentes disponíveis

| Categoria       | Componentes                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| **Ação**        | Button, Icon Button, Link Button, Loading Button, Button Group                                                 |
| **Entrada**     | Input, Textarea, Select, Checkbox, Radio Group, Switch, Toggle, Toggle Group, Input OTP, Date Picker, Calendar |
| **Navegação**   | Breadcrumb, Navigation Menu, Pagination, Tabs, Sidebar                                                         |
| **Feedback**    | Alert, Sonner (toast), Progress, Skeleton, Spinner                                                             |
| **Overlay**     | Dialog, Alert Dialog, Sheet, Drawer, Hover Card, Tooltip, Command                                              |
| **Layout**      | Card, Separator, Resizable, Scroll Area                                                                        |
| **Dados**       | Table, Data Table, Chart, Carousel                                                                             |
| **Utilitários** | Avatar, Badge, Label, Item, Kbd, Empty                                                                         |

## Instalação nos projetos

### 1. Instalar o pacote

```bash
npm install @bhubai/bhub-design-system
```

### 2. Importar os estilos

No arquivo de entrada da aplicação (ex: `layout.tsx`, `_app.tsx` ou `main.tsx`), importe o CSS do design system:

```tsx
import '@bhubai/bhub-design-system/styles.css'
```

### 3. Usar os componentes

```tsx
import { Button, Card, DataTable, Badge } from '@bhubai/bhub-design-system'

export function MinhaPagina() {
  return (
    <Card>
      <Badge>Novo</Badge>
      <Button>Confirmar</Button>
    </Card>
  )
}
```

### Componentes e utilitários disponíveis

Todos os componentes listados na seção abaixo estão disponíveis via import direto:

```tsx
// Componentes
import { Button, Dialog, Tabs, ... } from '@bhubai/bhub-design-system'

// Utilitários
import { cn } from '@bhubai/bhub-design-system'

// Hooks
import { useIsMobile } from '@bhubai/bhub-design-system'
```

---

## Desenvolvimento local

**Pré-requisitos:** Node.js 20+

> Recomendamos usar o [asdf](https://asdf-vm.com/) para gerenciar a versão do Node.js. Com o arquivo `.tool-versions` na raiz do projeto, basta rodar:
> ```bash
> asdf install
> ```

```bash
# Instalar dependências
npm install

# Iniciar o Storybook (desenvolvimento de componentes)
npm run storybook

# Iniciar o Next.js (app de referência)
npm run dev
```

## Testes

```bash
# Rodar testes
npx vitest

# Rodar com cobertura
npx vitest --coverage
```

## Adicionando componentes via shadcn

Este projeto usa o CLI do shadcn para incorporar novos componentes:

```bash
npx shadcn@latest add <nome-do-componente>
```

Os componentes são adicionados em `components/ui/`

## Publicação

### Versão de teste (manual)

Para validar mudanças em uma aplicação consumidora antes do merge, utilize a pipeline **"Pipeline (Publish Test Version)"** disponível na aba **Actions** do repositório.

Ao executar, será publicada automaticamente uma versão no formato:

```
1.0.0-snapshot.20260310143022
```

Para instalar no projeto consumidor:

```bash
npm install @bhubai/bhub-design-system@snapshot
# ou com a versão exata gerada
npm install @bhubai/bhub-design-system@1.0.0-snapshot.20260310143022
```

> Versões de teste são publicadas com a dist-tag `snapshot` e não afetam a tag `latest`. Aplicações usando `^x.y.z` ou `~x.y.z` **não serão afetadas** por essas versões.

### Versão oficial (merge na main)

A versão é gerada **automaticamente pela pipeline** no merge para a `main`, seguindo o [Semantic Versioning](https://semver.org/) com base nos tipos de commit ([Conventional Commits](https://www.conventionalcommits.org/)):

| Tipo de commit | Impacto na versão |
|---|---|
| `fix:` | `1.0.0` → `1.0.1` (patch) |
| `feat:` | `1.0.0` → `1.1.0` (minor) |
| `feat!:` ou `BREAKING CHANGE` no rodapé | `1.0.0` → `2.0.0` (major) |

## Contribuindo

Os commits seguem o padrão [Conventional Commits](https://www.conventionalcommits.org/) e são validados automaticamente via git hook. Após `npm install`, lint e testes também rodam localmente antes de cada push.

## Estrutura do projeto

```
bhub-design-system/
├── app/              # App Next.js (referência e globals.css)
├── components/
│   └── ui/           # Componentes do Design System
├── hooks/            # Hooks utilitários
├── lib/              # Utilitários (cn, etc.)
├── stories/          # Stories do Storybook por componente
└── .storybook/       # Configuração do Storybook
```
