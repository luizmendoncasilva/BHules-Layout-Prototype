import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const meta = {
  title: 'BSystem/Accordion',
  component: Accordion,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

const faqItems = [
  {
    value: 'item-1',
    question: 'Is it accessible?',
    answer:
      'Yes. It adheres to the WAI-ARIA design pattern and uses Radix UI primitives.',
  },
  {
    value: 'item-2',
    question: 'Is it styled?',
    answer:
      "Yes. It comes with default styles that match the BSystem design tokens. You can override with className.",
  },
  {
    value: 'item-3',
    question: 'Is it animated?',
    answer:
      'Yes. It uses CSS animations to open and close the accordion panels smoothly.',
  },
]

// ─── Single ───────────────────────────────────────────────────────────────────

export const Single: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-96">
      {faqItems.map(({ value, question, answer }) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>{question}</AccordionTrigger>
          <AccordionContent>{answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
}

// ─── Multiple ─────────────────────────────────────────────────────────────────

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" className="w-96">
      {faqItems.map(({ value, question, answer }) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>{question}</AccordionTrigger>
          <AccordionContent>{answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
}

// ─── Default Open ─────────────────────────────────────────────────────────────

export const DefaultOpen: Story = {
  render: () => (
    <Accordion type="single" defaultValue="item-1" collapsible className="w-96">
      {faqItems.map(({ value, question, answer }) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>{question}</AccordionTrigger>
          <AccordionContent>{answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
}

// ─── Nested Content ───────────────────────────────────────────────────────────

export const NestedContent: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-96">
      <AccordionItem value="billing">
        <AccordionTrigger>Billing & Plans</AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-2">
            <p>Current plan: <strong>Professional</strong></p>
            <p className="text-muted-foreground">
              Your plan renews on January 1, 2026. You have used 68% of your
              monthly quota.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="security">
        <AccordionTrigger>Security</AccordionTrigger>
        <AccordionContent>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Two-factor authentication: enabled</li>
            <li>Last login: 2 hours ago from São Paulo, BR</li>
            <li>Active sessions: 3 devices</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="notifications">
        <AccordionTrigger>Notifications</AccordionTrigger>
        <AccordionContent>
          <p className="text-muted-foreground">
            Configure how and when you receive notifications about invoices,
            payments, and account activity.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}
