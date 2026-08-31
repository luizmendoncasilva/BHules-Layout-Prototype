import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const meta = {
  title: 'BSystem/Table',
  component: Table,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

const invoices = [
  { id: '#1042', client: 'Acme Corp', amount: 'R$ 4.800,00', status: 'Paid', date: 'Jan 15, 2025' },
  { id: '#1041', client: 'BHub Tech', amount: 'R$ 12.300,00', status: 'Pending', date: 'Jan 10, 2025' },
  { id: '#1040', client: 'Nova Energia', amount: 'R$ 2.100,00', status: 'Overdue', date: 'Dec 28, 2024' },
  { id: '#1039', client: 'FinTech SA', amount: 'R$ 8.750,00', status: 'Paid', date: 'Dec 20, 2024' },
  { id: '#1038', client: 'Logística BR', amount: 'R$ 3.200,00', status: 'Paid', date: 'Dec 15, 2024' },
]

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  Paid: 'outline',
  Pending: 'secondary',
  Overdue: 'destructive',
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <div className="w-[640px]">
      <Table>
        <TableCaption>Recent invoices · Jan 2025</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.id}</TableCell>
              <TableCell>{invoice.client}</TableCell>
              <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[invoice.status]}>
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">{invoice.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} className="font-medium">Total</TableCell>
            <TableCell className="text-right font-semibold">R$ 31.150,00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  ),
}

// ─── Simple ───────────────────────────────────────────────────────────────────

export const Simple: Story = {
  render: () => (
    <div className="w-[480px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            { name: 'Arthur Moreira', role: 'Admin', email: 'arthur@bhub.com.br' },
            { name: 'João Silva', role: 'Editor', email: 'joao@bhub.com.br' },
            { name: 'Maria Santos', role: 'Viewer', email: 'maria@bhub.com.br' },
          ].map((user) => (
            <TableRow key={user.email}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
}
