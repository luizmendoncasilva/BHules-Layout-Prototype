import { GripVertical } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, Checkbox,
} from '@bhubai/bhub-design-system'

export default function ColumnConfig({ columns, onToggle, isOpen, onClose }) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="p-0 gap-0 flex flex-col">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Configurar colunas</SheetTitle>
        </SheetHeader>

        {/* Column List */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {columns.map((col) => (
            <div key={col.id} className="flex items-center gap-4 px-3 py-2.5 hover:bg-muted rounded-lg group transition-colors">
              <GripVertical className="w-5 h-5 text-muted-foreground group-hover:text-foreground cursor-grab active:cursor-grabbing" />

              <Checkbox
                checked={col.visible}
                onCheckedChange={() => onToggle(col.id)}
              />

              <span
                className="text-sm text-foreground cursor-pointer select-none font-medium"
                onClick={() => onToggle(col.id)}
              >
                {col.label}
              </span>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
