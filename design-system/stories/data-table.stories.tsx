'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ArrowUpDownIcon } from 'lucide-react'

import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

const meta = {
  title: 'BSystem/DataTable',
  component: DataTable,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof DataTable>

export default meta
type Story = StoryObj<typeof meta>

// ─── Sample data ──────────────────────────────────────────────────────────────

interface Payment {
  id: string
  amount: number
  status: 'pending' | 'processing' | 'success' | 'failed'
  email: string
}

const payments: Payment[] = Array.from({ length: 32 }, (_, i) => ({
  id: `pay_${String(i + 1).padStart(3, '0')}`,
  amount: Math.round((Math.random() * 900 + 100) * 100) / 100,
  status: (['pending', 'processing', 'success', 'failed'] as const)[i % 4],
  email: `user${i + 1}@example.com`,
}))

const statusColors: Record<Payment['status'], string> = {
  pending: 'text-yellow-600',
  processing: 'text-blue-600',
  success: 'text-green-600',
  failed: 'text-destructive',
}

// ─── Default ──────────────────────────────────────────────────────────────────

const simpleColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span className={`capitalize font-medium ${statusColors[row.getValue('status') as Payment['status']]}`}>
        {row.getValue('status')}
      </span>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'amount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'))
      return (
        <div className="text-right font-medium">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}
        </div>
      )
    },
  },
]

export const Default: Story = {
  render: () => (
    <div className="w-[700px]">
      <DataTable columns={simpleColumns} data={payments} />
    </div>
  ),
}

// ─── With Sorting ─────────────────────────────────────────────────────────────

const sortableColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Status
        <ArrowUpDownIcon className="ml-1 size-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className={`capitalize font-medium ${statusColors[row.getValue('status') as Payment['status']]}`}>
        {row.getValue('status')}
      </span>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Email
        <ArrowUpDownIcon className="ml-1 size-3.5" />
      </Button>
    ),
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Amount
          <ArrowUpDownIcon className="ml-1 size-3.5" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'))
      return (
        <div className="text-right font-medium">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}
        </div>
      )
    },
  },
]

export const WithSorting: Story = {
  render: () => (
    <div className="w-[700px]">
      <DataTable columns={sortableColumns} data={payments} />
    </div>
  ),
}

// ─── With Row Selection ───────────────────────────────────────────────────────

const selectableColumns: ColumnDef<Payment>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  ...simpleColumns,
]

export const WithRowSelection: Story = {
  render: () => (
    <div className="w-[740px]">
      <DataTable columns={selectableColumns} data={payments} />
    </div>
  ),
}

// ─── No Pagination ────────────────────────────────────────────────────────────

export const NoPagination: Story = {
  render: () => (
    <div className="w-[700px]">
      <DataTable columns={simpleColumns} data={payments.slice(0, 5)} pagination={false} />
    </div>
  ),
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export const EmptyState: Story = {
  render: () => (
    <div className="w-[700px]">
      <DataTable columns={simpleColumns} data={[]} />
    </div>
  ),
}

// ─── Custom Page Sizes ────────────────────────────────────────────────────────

export const CustomPageSizes: Story = {
  render: () => (
    <div className="w-[700px]">
      <DataTable columns={simpleColumns} data={payments} pageSizeOptions={[5, 10, 25]} />
    </div>
  ),
}
