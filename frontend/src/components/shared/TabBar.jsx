import { Tabs, TabsList, TabsTrigger } from '@bhubai/bhub-design-system'

/**
 * TabBar — abas no topo com ícone opcional.
 * Segue visual do DS: pill com borda azul no item ativo.
 */
export default function TabBar({ tabs, active, onChange }) {
  return (
    <div className="shrink-0 bg-card border-b border-border px-6 py-3">
      <Tabs value={active} onValueChange={onChange}>
        <TabsList variant="default">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                {Icon && <Icon className="w-4 h-4" />}
                <span>{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>
    </div>
  )
}