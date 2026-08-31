import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const meta = {
  title: 'BSystem/Chart',
  component: ChartContainer,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ChartContainer>

export default meta
type Story = StoryObj<typeof meta>

// ─── Bar Chart ────────────────────────────────────────────────────────────────

const barData = [
  { month: 'Jan', revenue: 18600, expenses: 8000 },
  { month: 'Feb', revenue: 24300, expenses: 9200 },
  { month: 'Mar', revenue: 21800, expenses: 8700 },
  { month: 'Apr', revenue: 28900, expenses: 11000 },
  { month: 'May', revenue: 32100, expenses: 12500 },
  { month: 'Jun', revenue: 27500, expenses: 10300 },
]

const barConfig: ChartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
  expenses: { label: 'Expenses', color: 'var(--chart-2)' },
}

export const BarChartStory: Story = {
  name: 'Bar Chart',
  render: () => (
    <ChartContainer config={barConfig} className="h-64 w-[480px]">
      <BarChart data={barData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
}

// ─── Line Chart ───────────────────────────────────────────────────────────────

const lineConfig: ChartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
}

export const LineChartStory: Story = {
  name: 'Line Chart',
  render: () => (
    <ChartContainer config={lineConfig} className="h-64 w-[480px]">
      <LineChart data={barData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="revenue"
          type="monotone"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  ),
}

// ─── Area Chart ───────────────────────────────────────────────────────────────

const areaConfig: ChartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
  expenses: { label: 'Expenses', color: 'var(--chart-2)' },
}

export const AreaChartStory: Story = {
  name: 'Area Chart',
  render: () => (
    <ChartContainer config={areaConfig} className="h-64 w-[480px]">
      <AreaChart data={barData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <defs>
          <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          dataKey="revenue"
          type="monotone"
          fill="url(#fillRevenue)"
          stroke="var(--color-revenue)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  ),
}

// ─── Pie Chart ────────────────────────────────────────────────────────────────

const pieData = [
  { category: 'Services', value: 45, fill: 'var(--chart-1)' },
  { category: 'Products', value: 30, fill: 'var(--chart-2)' },
  { category: 'Subscriptions', value: 15, fill: 'var(--chart-3)' },
  { category: 'Other', value: 10, fill: 'var(--chart-4)' },
]

const pieConfig: ChartConfig = {
  value: { label: 'Value' },
  Services: { label: 'Services', color: 'var(--chart-1)' },
  Products: { label: 'Products', color: 'var(--chart-2)' },
  Subscriptions: { label: 'Subscriptions', color: 'var(--chart-3)' },
  Other: { label: 'Other', color: 'var(--chart-4)' },
}

export const PieChartStory: Story = {
  name: 'Pie Chart',
  render: () => (
    <ChartContainer config={pieConfig} className="h-64 w-80">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
        <Pie data={pieData} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={80} />
        <ChartLegend content={<ChartLegendContent nameKey="category" />} />
      </PieChart>
    </ChartContainer>
  ),
}
