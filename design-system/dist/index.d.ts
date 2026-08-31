import { ClassValue } from 'clsx';
import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React from 'react';
import { Accordion as Accordion$1, AlertDialog as AlertDialog$1, Avatar as Avatar$1, Checkbox as Checkbox$1, Dialog as Dialog$1, HoverCard as HoverCard$1, Label as Label$1, NavigationMenu as NavigationMenu$1, Popover as Popover$1, Progress as Progress$1, RadioGroup as RadioGroup$1, ScrollArea as ScrollArea$1, Select as Select$1, Separator as Separator$1, Tooltip as Tooltip$1, Switch as Switch$1, Tabs as Tabs$1, Toggle as Toggle$1, ToggleGroup as ToggleGroup$1 } from 'radix-ui';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';
import { DayPicker, DayButton, DateRange } from 'react-day-picker';
import useEmblaCarousel, { UseEmblaCarouselType } from 'embla-carousel-react';
import * as RechartsPrimitive from 'recharts';
import { Command as Command$1 } from 'cmdk';
import { ColumnDef } from '@tanstack/react-table';
export { ColumnDef } from '@tanstack/react-table';
import { Locale } from 'date-fns';
import { Drawer as Drawer$1 } from 'vaul';
import { LucideIcon } from 'lucide-react';
import { OTPInput } from 'input-otp';
import * as ResizablePrimitive from 'react-resizable-panels';
import { ToasterProps } from 'sonner';

declare function cn(...inputs: ClassValue[]): string;

declare function useIsMobile(): boolean;

declare function Accordion({ ...props }: React.ComponentProps<typeof Accordion$1.Root>): react_jsx_runtime.JSX.Element;
declare function AccordionItem({ className, ...props }: React.ComponentProps<typeof Accordion$1.Item>): react_jsx_runtime.JSX.Element;
declare function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof Accordion$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof Accordion$1.Content>): react_jsx_runtime.JSX.Element;

declare const alertVariants: (props?: ({
    variant?: "default" | "destructive" | "success" | "warning" | "info" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>): react_jsx_runtime.JSX.Element;
declare function AlertTitle({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function AlertDescription({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;

declare const buttonVariants: (props?: ({
    variant?: "default" | "destructive" | "success" | "warning" | "info" | "secondary" | "outline" | "ghost" | null | undefined;
    size?: "default" | "lg" | "sm" | "xs" | "icon" | "icon-lg" | "icon-sm" | "icon-xs" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function Button({ className, variant, size, asChild, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
}): react_jsx_runtime.JSX.Element;

declare function AlertDialog({ ...props }: React.ComponentProps<typeof AlertDialog$1.Root>): react_jsx_runtime.JSX.Element;
declare function AlertDialogTrigger({ ...props }: React.ComponentProps<typeof AlertDialog$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function AlertDialogPortal({ ...props }: React.ComponentProps<typeof AlertDialog$1.Portal>): react_jsx_runtime.JSX.Element;
declare function AlertDialogOverlay({ className, ...props }: React.ComponentProps<typeof AlertDialog$1.Overlay>): react_jsx_runtime.JSX.Element;
declare function AlertDialogContent({ className, size, ...props }: React.ComponentProps<typeof AlertDialog$1.Content> & {
    size?: "default" | "sm";
}): react_jsx_runtime.JSX.Element;
declare function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialog$1.Title>): react_jsx_runtime.JSX.Element;
declare function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof AlertDialog$1.Description>): react_jsx_runtime.JSX.Element;
declare function AlertDialogMedia({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function AlertDialogAction({ className, variant, size, ...props }: React.ComponentProps<typeof AlertDialog$1.Action> & Pick<React.ComponentProps<typeof Button>, "variant" | "size">): react_jsx_runtime.JSX.Element;
declare function AlertDialogCancel({ className, variant, size, ...props }: React.ComponentProps<typeof AlertDialog$1.Cancel> & Pick<React.ComponentProps<typeof Button>, "variant" | "size">): react_jsx_runtime.JSX.Element;

declare function Avatar({ className, size, ...props }: React.ComponentProps<typeof Avatar$1.Root> & {
    size?: "default" | "sm" | "lg";
}): react_jsx_runtime.JSX.Element;
declare function AvatarImage({ className, ...props }: React.ComponentProps<typeof Avatar$1.Image>): react_jsx_runtime.JSX.Element;
declare function AvatarFallback({ className, ...props }: React.ComponentProps<typeof Avatar$1.Fallback>): react_jsx_runtime.JSX.Element;
declare function AvatarBadge({ className, ...props }: React.ComponentProps<"span">): react_jsx_runtime.JSX.Element;
declare function AvatarGroup({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function AvatarGroupCount({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;

declare const badgeVariants: (props?: ({
    variant?: "default" | "destructive" | "success" | "warning" | "info" | "secondary" | "outline" | "ghost" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function Badge({ className, variant, asChild, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
}): react_jsx_runtime.JSX.Element;

declare function Breadcrumb({ ...props }: React.ComponentProps<"nav">): react_jsx_runtime.JSX.Element;
declare function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">): react_jsx_runtime.JSX.Element;
declare function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">): react_jsx_runtime.JSX.Element;
declare function BreadcrumbLink({ asChild, className, ...props }: React.ComponentProps<"a"> & {
    asChild?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">): react_jsx_runtime.JSX.Element;
declare function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<"li">): react_jsx_runtime.JSX.Element;
declare function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<"span">): react_jsx_runtime.JSX.Element;

/**
 * ButtonGroup
 *
 * Wraps multiple Button components into a visually connected row.
 * - First child: only left corners rounded
 * - Middle children: no rounding
 * - Last child: only right corners rounded
 * - Adjacent borders are collapsed (border-r-0 on all except last)
 */
declare function ButtonGroup({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;

declare function Calendar({ className, classNames, showOutsideDays, captionLayout, buttonVariant, formatters, components, ...props }: React.ComponentProps<typeof DayPicker> & {
    buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}): react_jsx_runtime.JSX.Element;
declare function CalendarDayButton({ className, day, modifiers, ...props }: React.ComponentProps<typeof DayButton>): react_jsx_runtime.JSX.Element;

type CardPadding = "none" | "sm" | "md" | "lg";
interface CardProps extends React.ComponentProps<"div"> {
    /** Controls vertical padding of the Card and horizontal padding of its sub-components. Defaults to `md`. */
    padding?: CardPadding;
}
declare function Card({ className, padding, ...props }: Readonly<CardProps>): react_jsx_runtime.JSX.Element;
declare function CardHeader({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CardTitle({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CardDescription({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CardAction({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CardContent({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CardFooter({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];
type CarouselProps = {
    opts?: CarouselOptions;
    plugins?: CarouselPlugin;
    orientation?: "horizontal" | "vertical";
    setApi?: (api: CarouselApi) => void;
};
declare function Carousel({ orientation, opts, setApi, plugins, className, children, ...props }: React.ComponentProps<"div"> & CarouselProps): react_jsx_runtime.JSX.Element;
declare function CarouselContent({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CarouselItem({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CarouselPrevious({ className, variant, size, ...props }: React.ComponentProps<typeof Button>): react_jsx_runtime.JSX.Element;
declare function CarouselNext({ className, variant, size, ...props }: React.ComponentProps<typeof Button>): react_jsx_runtime.JSX.Element;

declare const THEMES: {
    readonly light: "";
    readonly dark: ".dark";
};
type ChartConfig = {
    [k in string]: {
        label?: React.ReactNode;
        icon?: React.ComponentType;
    } & ({
        color?: string;
        theme?: never;
    } | {
        color?: never;
        theme: Record<keyof typeof THEMES, string>;
    });
};
declare function ChartContainer({ id, className, children, config, ...props }: React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}): react_jsx_runtime.JSX.Element;
declare const ChartStyle: ({ id, config }: {
    id: string;
    config: ChartConfig;
}) => react_jsx_runtime.JSX.Element | null;
declare const ChartTooltip: typeof RechartsPrimitive.Tooltip;
declare function ChartTooltipContent({ active, payload, className, indicator, hideLabel, hideIndicator, label, labelFormatter, labelClassName, formatter, color, nameKey, labelKey, }: React.ComponentProps<typeof RechartsPrimitive.Tooltip> & React.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
}): react_jsx_runtime.JSX.Element | null;
declare const ChartLegend: typeof RechartsPrimitive.Legend;
declare function ChartLegendContent({ className, hideIcon, payload, verticalAlign, nameKey, }: React.ComponentProps<"div"> & Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
    hideIcon?: boolean;
    nameKey?: string;
}): react_jsx_runtime.JSX.Element | null;

declare function Checkbox({ className, ...props }: React.ComponentProps<typeof Checkbox$1.Root>): react_jsx_runtime.JSX.Element;

declare function Dialog({ ...props }: React.ComponentProps<typeof Dialog$1.Root>): react_jsx_runtime.JSX.Element;
declare function DialogTrigger({ ...props }: React.ComponentProps<typeof Dialog$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function DialogPortal({ ...props }: React.ComponentProps<typeof Dialog$1.Portal>): react_jsx_runtime.JSX.Element;
declare function DialogClose({ ...props }: React.ComponentProps<typeof Dialog$1.Close>): react_jsx_runtime.JSX.Element;
declare function DialogOverlay({ className, ...props }: React.ComponentProps<typeof Dialog$1.Overlay>): react_jsx_runtime.JSX.Element;
declare function DialogContent({ className, children, showCloseButton, ...props }: React.ComponentProps<typeof Dialog$1.Content> & {
    showCloseButton?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function DialogHeader({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function DialogFooter({ className, showCloseButton, children, ...props }: React.ComponentProps<"div"> & {
    showCloseButton?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function DialogTitle({ className, ...props }: React.ComponentProps<typeof Dialog$1.Title>): react_jsx_runtime.JSX.Element;
declare function DialogDescription({ className, ...props }: React.ComponentProps<typeof Dialog$1.Description>): react_jsx_runtime.JSX.Element;

declare function Command({ className, ...props }: React.ComponentProps<typeof Command$1>): react_jsx_runtime.JSX.Element;
declare function CommandDialog({ title, description, children, className, showCloseButton, ...props }: React.ComponentProps<typeof Dialog> & {
    title?: string;
    description?: string;
    className?: string;
    showCloseButton?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function CommandInput({ className, ...props }: React.ComponentProps<typeof Command$1.Input>): react_jsx_runtime.JSX.Element;
declare function CommandList({ className, ...props }: React.ComponentProps<typeof Command$1.List>): react_jsx_runtime.JSX.Element;
declare function CommandEmpty({ ...props }: React.ComponentProps<typeof Command$1.Empty>): react_jsx_runtime.JSX.Element;
declare function CommandGroup({ className, ...props }: React.ComponentProps<typeof Command$1.Group>): react_jsx_runtime.JSX.Element;
declare function CommandSeparator({ className, ...props }: React.ComponentProps<typeof Command$1.Separator>): react_jsx_runtime.JSX.Element;
declare function CommandItem({ className, ...props }: React.ComponentProps<typeof Command$1.Item>): react_jsx_runtime.JSX.Element;
declare function CommandShortcut({ className, ...props }: React.ComponentProps<"span">): react_jsx_runtime.JSX.Element;

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    /** Show pagination controls (default: true) */
    pagination?: boolean;
    /** Page size options for the pagination selector */
    pageSizeOptions?: number[];
    /** Additional className on the table wrapper */
    className?: string;
}
declare function DataTable<TData, TValue>({ columns, data, pagination, pageSizeOptions, className, }: DataTableProps<TData, TValue>): react_jsx_runtime.JSX.Element;

type PortalContainer = HTMLElement | (() => HTMLElement | null | undefined);
type FixedPortalPanelOptions = {
    portalContainer?: PortalContainer;
    zIndex?: number;
};

type DatePickerPortalProps = FixedPortalPanelOptions;
interface DatePickerProps extends DatePickerPortalProps {
    value?: Date | null;
    /**
     * Called with the selected date, or `null` when the date is cleared
     * (deselected). We emit `null` rather than `undefined` so react-hook-form
     * `Controller`s don't fall back to their `defaultValue` on clear.
     */
    onValueChange?: (date: Date | null) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    /** Format string for date-fns (default: "PPP") */
    dateFormat?: string;
    /**
     * Calendar header layout. Defaults to `"dropdown"`, which exposes month and
     * year dropdowns in the header so users can jump to distant months/years in
     * a few clicks (great for memorable dates like birthdate). Use `"label"` for
     * a static month/year caption with arrow-only navigation.
     */
    captionLayout?: React.ComponentProps<typeof Calendar>["captionLayout"];
    /** Earliest navigable/selectable month. Defaults to today − 100 years when the header uses dropdowns. */
    startMonth?: Date;
    /** Latest navigable/selectable month. Defaults to today + 10 years when the header uses dropdowns. */
    endMonth?: Date;
    /**
     * Dates to disable, as a react-day-picker Matcher — e.g.
     * `{ after: new Date() }` to forbid future dates on a birthdate field.
     */
    disabledDates?: React.ComponentProps<typeof Calendar>["disabled"];
    /**
     * date-fns locale for the trigger label and the month dropdown. Defaults to
     * `ptBR` (Brazilian Portuguese). Pass another date-fns locale to override.
     */
    locale?: Locale;
}
declare function DatePicker({ value, onValueChange, placeholder, disabled, className, dateFormat, captionLayout, startMonth, endMonth, disabledDates, locale, portalContainer, zIndex, }: Readonly<DatePickerProps>): react_jsx_runtime.JSX.Element;
interface DateRangePickerProps extends DatePickerPortalProps {
    value?: DateRange | null;
    /**
     * Called with the selected range, or `null` when the range is cleared. We
     * emit `null` rather than `undefined` so react-hook-form `Controller`s don't
     * fall back to their `defaultValue` on clear.
     */
    onValueChange?: (range: DateRange | null) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    dateFormat?: string;
    /**
     * Calendar header layout. Defaults to `"dropdown"` (month/year dropdowns).
     * Use `"label"` for a static caption with arrow-only navigation.
     */
    captionLayout?: React.ComponentProps<typeof Calendar>["captionLayout"];
    /** Earliest navigable/selectable month. Defaults to today − 100 years when the header uses dropdowns. */
    startMonth?: Date;
    /** Latest navigable/selectable month. Defaults to today + 10 years when the header uses dropdowns. */
    endMonth?: Date;
    /**
     * Dates to disable, as a react-day-picker Matcher — e.g. `{ after: new Date() }`.
     */
    disabledDates?: React.ComponentProps<typeof Calendar>["disabled"];
    /**
     * date-fns locale for the trigger label and the month dropdown. Defaults to
     * `ptBR` (Brazilian Portuguese). Pass another date-fns locale to override.
     */
    locale?: Locale;
}
declare function DateRangePicker({ value, onValueChange, placeholder, disabled, className, dateFormat, captionLayout, startMonth, endMonth, disabledDates, locale, portalContainer, zIndex, }: Readonly<DateRangePickerProps>): react_jsx_runtime.JSX.Element;

interface MonthYearPickerProps extends FixedPortalPanelOptions {
    value?: Date;
    defaultValue?: Date;
    onValueChange?: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    /** Earliest selectable month (inclusive). Day-of-month is ignored. */
    min?: Date;
    /** Latest selectable month (inclusive). Day-of-month is ignored. */
    max?: Date;
    /** BCP 47 locale tag for month names. Default: "pt-BR". */
    locale?: string;
}
declare function MonthYearPicker({ value: controlledValue, defaultValue, onValueChange, placeholder, disabled, className, min, max, locale, portalContainer, zIndex, }: Readonly<MonthYearPickerProps>): react_jsx_runtime.JSX.Element;

declare function Drawer({ ...props }: React.ComponentProps<typeof Drawer$1.Root>): react_jsx_runtime.JSX.Element;
declare function DrawerTrigger({ ...props }: React.ComponentProps<typeof Drawer$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function DrawerPortal({ ...props }: React.ComponentProps<typeof Drawer$1.Portal>): react_jsx_runtime.JSX.Element;
declare function DrawerClose({ ...props }: React.ComponentProps<typeof Drawer$1.Close>): react_jsx_runtime.JSX.Element;
declare function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof Drawer$1.Overlay>): react_jsx_runtime.JSX.Element;
declare function DrawerContent({ className, children, ...props }: React.ComponentProps<typeof Drawer$1.Content>): react_jsx_runtime.JSX.Element;
declare function DrawerHeader({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function DrawerFooter({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function DrawerTitle({ className, ...props }: React.ComponentProps<typeof Drawer$1.Title>): react_jsx_runtime.JSX.Element;
declare function DrawerDescription({ className, ...props }: React.ComponentProps<typeof Drawer$1.Description>): react_jsx_runtime.JSX.Element;

interface EmptyProps extends React.ComponentProps<"div"> {
    /**
     * Icon element rendered in the icon container.
     * Defaults to InboxIcon. Pass `null` to hide the icon container entirely.
     */
    icon?: React.ReactNode | null;
    /** Primary heading */
    title?: string;
    /** Supporting description */
    description?: string;
    /** CTA button or any action element */
    action?: React.ReactNode;
}
/**
 * Empty
 *
 * Empty state component for zero-data screens.
 * — Icon container: 48×48, bg-muted, rounded-xl, muted-foreground
 * — Title: text-sm/medium
 * — Description: text-sm, muted-foreground
 * — Optional action slot (typically a Button)
 */
declare function Empty({ className, icon, title, description, action, ...props }: EmptyProps): react_jsx_runtime.JSX.Element;

declare function HoverCard({ ...props }: React.ComponentProps<typeof HoverCard$1.Root>): react_jsx_runtime.JSX.Element;
declare function HoverCardTrigger({ ...props }: React.ComponentProps<typeof HoverCard$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function HoverCardContent({ className, align, sideOffset, ...props }: React.ComponentProps<typeof HoverCard$1.Content>): react_jsx_runtime.JSX.Element;

declare const iconVariants: (props?: ({
    size?: "sm" | "md" | "xl" | null | undefined;
    color?: "black" | "neutral" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "color">, VariantProps<typeof iconVariants> {
    /** Lucide icon component to render. Restricts icon usage to the design system set. */
    icon: LucideIcon;
}
/**
 * Icon
 *
 * Restricts icon usage to a controlled set of sizes (sm | md | xl) and colors
 * (black | neutral). Pass any Lucide icon via the `icon` prop. Always prefer
 * this component over rendering a Lucide icon directly to keep visual rhythm
 * consistent across the system.
 */
declare function Icon({ icon: IconComponent, size, color, className, ...props }: Readonly<IconProps>): react_jsx_runtime.JSX.Element;

type IconButtonSize = "xs" | "sm" | "default" | "lg";
interface IconButtonProps extends Omit<React.ComponentProps<typeof Button>, "size"> {
    /** Accessible label — required for icon-only buttons */
    "aria-label": string;
    size?: IconButtonSize;
}
/**
 * IconButton
 *
 * A square button that contains only an icon.
 * Enforces `aria-label` for accessibility.
 * Maps `size` to the icon-specific size variants of Button.
 */
declare function IconButton({ size, className, ...props }: IconButtonProps): react_jsx_runtime.JSX.Element;

declare function Input({ className, type, ...props }: React.ComponentProps<"input">): react_jsx_runtime.JSX.Element;

declare function InputOTP({ className, containerClassName, ...props }: React.ComponentProps<typeof OTPInput> & {
    containerClassName?: string;
}): react_jsx_runtime.JSX.Element;
declare function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function InputOTPSlot({ index, className, ...props }: React.ComponentProps<"div"> & {
    index: number;
}): react_jsx_runtime.JSX.Element;
declare function InputOTPSeparator({ ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;

/**
 * ItemBadge
 *
 * 32×32 icon container with secondary background and border.
 * Place an icon (16–18px) as a child.
 */
declare function ItemBadge({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
interface ItemProps extends React.ComponentProps<"div"> {
    /** Icon rendered inside the ItemBadge on the left */
    icon?: React.ReactNode;
    /** Primary text */
    title: string;
    /** Secondary text below the title */
    description?: string;
    /**
     * Custom right-side action. Pass `null` to hide the chevron even when
     * onClick is set. Defaults to a ChevronRight when onClick is provided.
     */
    action?: React.ReactNode | null;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
}
/**
 * Item
 *
 * A bordered list item with an optional icon badge, title, description,
 * and a right-side action. Based on the BSystem Figma spec:
 * — border + p-4 + gap-4 + rounded-lg
 * — icon badge: 32×32, bg-secondary, border, rounded-sm
 * — title: text-sm/medium, foreground
 * — description: text-xs/regular, muted-foreground
 * — action: chevron-right by default when clickable
 */
declare function Item({ className, icon, title, description, action, onClick, ...props }: ItemProps): react_jsx_runtime.JSX.Element;

declare function Kbd({ className, ...props }: React.ComponentProps<"kbd">): react_jsx_runtime.JSX.Element;
declare function KbdGroup({ className, ...props }: React.ComponentProps<"span">): react_jsx_runtime.JSX.Element;

declare function Label({ className, ...props }: React.ComponentProps<typeof Label$1.Root>): react_jsx_runtime.JSX.Element;

declare const linkButtonVariants: (props?: ({
    variant?: "default" | "secondary" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface LinkButtonProps extends React.ComponentProps<"button">, VariantProps<typeof linkButtonVariants> {
}
/**
 * LinkButton
 *
 * A button that renders as inline text with an underline,
 * visually matching a hyperlink while remaining a <button> element.
 * Use `variant="secondary"` for a neutral tone that blends into body copy.
 */
declare function LinkButton({ className, variant, ...props }: LinkButtonProps): react_jsx_runtime.JSX.Element;

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
    /** When true, shows a spinner and disables the button */
    loading?: boolean;
    /** Text shown while loading (defaults to children) */
    loadingText?: string;
}
/**
 * LoadingButton
 *
 * A Button with an integrated loading state.
 * When `loading` is true, the button is disabled and a spinner replaces the leading icon.
 */
declare function LoadingButton({ loading, loadingText, children, disabled, className, ...props }: LoadingButtonProps): react_jsx_runtime.JSX.Element;

declare function NavigationMenu({ className, children, viewport, ...props }: React.ComponentProps<typeof NavigationMenu$1.Root> & {
    viewport?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function NavigationMenuList({ className, ...props }: React.ComponentProps<typeof NavigationMenu$1.List>): react_jsx_runtime.JSX.Element;
declare function NavigationMenuItem({ className, ...props }: React.ComponentProps<typeof NavigationMenu$1.Item>): react_jsx_runtime.JSX.Element;
declare const navigationMenuTriggerStyle: (props?: class_variance_authority_types.ClassProp | undefined) => string;
declare function NavigationMenuTrigger({ className, children, ...props }: React.ComponentProps<typeof NavigationMenu$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function NavigationMenuContent({ className, ...props }: React.ComponentProps<typeof NavigationMenu$1.Content>): react_jsx_runtime.JSX.Element;
declare function NavigationMenuViewport({ className, ...props }: React.ComponentProps<typeof NavigationMenu$1.Viewport>): react_jsx_runtime.JSX.Element;
declare function NavigationMenuLink({ className, ...props }: React.ComponentProps<typeof NavigationMenu$1.Link>): react_jsx_runtime.JSX.Element;
declare function NavigationMenuIndicator({ className, ...props }: React.ComponentProps<typeof NavigationMenu$1.Indicator>): react_jsx_runtime.JSX.Element;

declare function Pagination({ className, ...props }: React.ComponentProps<"nav">): react_jsx_runtime.JSX.Element;
declare function PaginationContent({ className, ...props }: React.ComponentProps<"ul">): react_jsx_runtime.JSX.Element;
declare function PaginationItem({ ...props }: React.ComponentProps<"li">): react_jsx_runtime.JSX.Element;
type PaginationLinkProps = {
    isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> & React.ComponentProps<"a">;
declare function PaginationLink({ className, isActive, size, ...props }: PaginationLinkProps): react_jsx_runtime.JSX.Element;
declare function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>): react_jsx_runtime.JSX.Element;
declare function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>): react_jsx_runtime.JSX.Element;
declare function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">): react_jsx_runtime.JSX.Element;

declare function Popover({ ...props }: React.ComponentProps<typeof Popover$1.Root>): react_jsx_runtime.JSX.Element;
declare function PopoverTrigger({ ...props }: React.ComponentProps<typeof Popover$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function PopoverContent({ className, align, sideOffset, ...props }: React.ComponentProps<typeof Popover$1.Content>): react_jsx_runtime.JSX.Element;
declare function PopoverAnchor({ ...props }: React.ComponentProps<typeof Popover$1.Anchor>): react_jsx_runtime.JSX.Element;
declare function PopoverHeader({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function PopoverTitle({ className, ...props }: React.ComponentProps<"h2">): react_jsx_runtime.JSX.Element;
declare function PopoverDescription({ className, ...props }: React.ComponentProps<"p">): react_jsx_runtime.JSX.Element;

declare function Progress({ className, value, ...props }: React.ComponentProps<typeof Progress$1.Root>): react_jsx_runtime.JSX.Element;

declare function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroup$1.Root>): react_jsx_runtime.JSX.Element;
declare function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroup$1.Item>): react_jsx_runtime.JSX.Element;

declare function ResizablePanelGroup({ className, ...props }: ResizablePrimitive.GroupProps): react_jsx_runtime.JSX.Element;
declare function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps): react_jsx_runtime.JSX.Element;
declare function ResizableHandle({ withHandle, className, ...props }: ResizablePrimitive.SeparatorProps & {
    withHandle?: boolean;
}): react_jsx_runtime.JSX.Element;

declare function ScrollArea({ className, children, ...props }: React.ComponentProps<typeof ScrollArea$1.Root>): react_jsx_runtime.JSX.Element;
declare function ScrollBar({ className, orientation, ...props }: React.ComponentProps<typeof ScrollArea$1.ScrollAreaScrollbar>): react_jsx_runtime.JSX.Element;

declare function Select({ isDeselectable, value, defaultValue, onValueChange, open, defaultOpen, onOpenChange, children, ...props }: React.ComponentProps<typeof Select$1.Root> & {
    isDeselectable?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function SelectGroup({ ...props }: React.ComponentProps<typeof Select$1.Group>): react_jsx_runtime.JSX.Element;
declare function SelectValue({ ...props }: React.ComponentProps<typeof Select$1.Value>): react_jsx_runtime.JSX.Element;
declare function SelectTrigger({ className, size, children, ...props }: React.ComponentProps<typeof Select$1.Trigger> & {
    size?: "sm" | "default";
}): react_jsx_runtime.JSX.Element;
declare function SelectContent({ className, children, position, align, ...props }: React.ComponentProps<typeof Select$1.Content>): react_jsx_runtime.JSX.Element;
declare function SelectLabel({ className, ...props }: React.ComponentProps<typeof Select$1.Label>): react_jsx_runtime.JSX.Element;
declare function SelectItem({ className, children, ...props }: React.ComponentProps<typeof Select$1.Item>): react_jsx_runtime.JSX.Element;
declare function SelectSeparator({ className, ...props }: React.ComponentProps<typeof Select$1.Separator>): react_jsx_runtime.JSX.Element;
declare function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof Select$1.ScrollUpButton>): react_jsx_runtime.JSX.Element;
declare function SelectScrollDownButton({ className, ...props }: React.ComponentProps<typeof Select$1.ScrollDownButton>): react_jsx_runtime.JSX.Element;

declare function Separator({ className, orientation, decorative, ...props }: React.ComponentProps<typeof Separator$1.Root>): react_jsx_runtime.JSX.Element;

declare function Sheet({ ...props }: React.ComponentProps<typeof Dialog$1.Root>): react_jsx_runtime.JSX.Element;
declare function SheetTrigger({ ...props }: React.ComponentProps<typeof Dialog$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function SheetClose({ ...props }: React.ComponentProps<typeof Dialog$1.Close>): react_jsx_runtime.JSX.Element;
declare function SheetContent({ className, children, side, showCloseButton, ...props }: React.ComponentProps<typeof Dialog$1.Content> & {
    side?: "top" | "right" | "bottom" | "left";
    showCloseButton?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function SheetHeader({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function SheetFooter({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function SheetTitle({ className, ...props }: React.ComponentProps<typeof Dialog$1.Title>): react_jsx_runtime.JSX.Element;
declare function SheetDescription({ className, ...props }: React.ComponentProps<typeof Dialog$1.Description>): react_jsx_runtime.JSX.Element;

declare function TooltipProvider({ delayDuration, ...props }: React.ComponentProps<typeof Tooltip$1.Provider>): react_jsx_runtime.JSX.Element;
/**
 * Tooltip
 *
 * Wraps Radix's Tooltip.Root and supports both uncontrolled (default, hover/focus)
 * and controlled usage:
 * - Uncontrolled: `<Tooltip>...</Tooltip>` — opens on hover/focus of the trigger.
 * - Controlled: `<Tooltip open={...} onOpenChange={...}>...</Tooltip>` — caller owns
 *   the open state and decides when to show/hide (e.g. on click, on a state change).
 *   See: https://www.radix-ui.com/primitives/docs/components/tooltip
 */
declare function Tooltip({ delayDuration, ...props }: React.ComponentProps<typeof Tooltip$1.Root> & {
    delayDuration?: number;
}): react_jsx_runtime.JSX.Element;
declare function TooltipTrigger({ ...props }: React.ComponentProps<typeof Tooltip$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function TooltipContent({ className, sideOffset, children, ...props }: React.ComponentProps<typeof Tooltip$1.Content>): react_jsx_runtime.JSX.Element;

type SidebarContextProps = {
    state: "expanded" | "collapsed";
    open: boolean;
    setOpen: (open: boolean) => void;
    openMobile: boolean;
    setOpenMobile: (open: boolean) => void;
    isMobile: boolean;
    toggleSidebar: () => void;
};
declare function useSidebar(): SidebarContextProps;
declare function SidebarProvider({ defaultOpen, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }: React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}): react_jsx_runtime.JSX.Element;
declare function Sidebar({ side, variant, collapsible, className, children, ...props }: React.ComponentProps<"div"> & {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
}): react_jsx_runtime.JSX.Element;
declare function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>): react_jsx_runtime.JSX.Element;
declare function SidebarRail({ className, ...props }: React.ComponentProps<"button">): react_jsx_runtime.JSX.Element;
declare function SidebarInset({ className, ...props }: React.ComponentProps<"main">): react_jsx_runtime.JSX.Element;
declare function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>): react_jsx_runtime.JSX.Element;
declare function SidebarHeader({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function SidebarFooter({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>): react_jsx_runtime.JSX.Element;
declare function SidebarContent({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function SidebarGroup({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function SidebarGroupLabel({ className, asChild, ...props }: React.ComponentProps<"div"> & {
    asChild?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function SidebarGroupAction({ className, asChild, ...props }: React.ComponentProps<"button"> & {
    asChild?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">): react_jsx_runtime.JSX.Element;
declare function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">): react_jsx_runtime.JSX.Element;
declare const sidebarMenuButtonVariants: (props?: ({
    variant?: "default" | "outline" | null | undefined;
    size?: "default" | "lg" | "sm" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function SidebarMenuButton({ asChild, isActive, variant, size, tooltip, className, ...props }: React.ComponentProps<"button"> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>): react_jsx_runtime.JSX.Element;
declare function SidebarMenuAction({ className, asChild, showOnHover, ...props }: React.ComponentProps<"button"> & {
    asChild?: boolean;
    showOnHover?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function SidebarMenuSkeleton({ className, showIcon, ...props }: React.ComponentProps<"div"> & {
    showIcon?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">): react_jsx_runtime.JSX.Element;
declare function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">): react_jsx_runtime.JSX.Element;
declare function SidebarMenuSubButton({ asChild, size, isActive, className, ...props }: React.ComponentProps<"a"> & {
    asChild?: boolean;
    size?: "sm" | "md";
    isActive?: boolean;
}): react_jsx_runtime.JSX.Element;

declare function Skeleton({ className, ...props }: React.ComponentProps<"div">): react_jsx_runtime.JSX.Element;

declare const Toaster: ({ theme, ...props }: ToasterProps) => react_jsx_runtime.JSX.Element;

declare const spinnerVariants: (props?: ({
    size?: "default" | "lg" | "sm" | "xs" | "xl" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function Spinner({ className, size, ...props }: React.ComponentProps<"svg"> & VariantProps<typeof spinnerVariants>): react_jsx_runtime.JSX.Element;

declare function Switch({ className, size, ...props }: React.ComponentProps<typeof Switch$1.Root> & {
    size?: "sm" | "default";
}): react_jsx_runtime.JSX.Element;

declare function Table({ className, ...props }: React.ComponentProps<"table">): react_jsx_runtime.JSX.Element;
declare function TableHeader({ className, ...props }: React.ComponentProps<"thead">): react_jsx_runtime.JSX.Element;
declare function TableBody({ className, ...props }: React.ComponentProps<"tbody">): react_jsx_runtime.JSX.Element;
declare function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">): react_jsx_runtime.JSX.Element;
declare function TableRow({ className, ...props }: React.ComponentProps<"tr">): react_jsx_runtime.JSX.Element;
declare function TableHead({ className, ...props }: React.ComponentProps<"th">): react_jsx_runtime.JSX.Element;
declare function TableCell({ className, ...props }: React.ComponentProps<"td">): react_jsx_runtime.JSX.Element;
declare function TableCaption({ className, ...props }: React.ComponentProps<"caption">): react_jsx_runtime.JSX.Element;

declare function Tabs({ className, orientation, ...props }: React.ComponentProps<typeof Tabs$1.Root>): react_jsx_runtime.JSX.Element;
declare const tabsListVariants: (props?: ({
    variant?: "line" | "default" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function TabsList({ className, variant, ...props }: React.ComponentProps<typeof Tabs$1.List> & VariantProps<typeof tabsListVariants>): react_jsx_runtime.JSX.Element;
declare function TabsTrigger({ className, ...props }: React.ComponentProps<typeof Tabs$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function TabsContent({ className, ...props }: React.ComponentProps<typeof Tabs$1.Content>): react_jsx_runtime.JSX.Element;

declare function Textarea({ className, ...props }: React.ComponentProps<"textarea">): react_jsx_runtime.JSX.Element;

declare const toggleVariants: (props?: ({
    variant?: "default" | "outline" | null | undefined;
    size?: "default" | "lg" | "sm" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function Toggle({ className, variant, size, ...props }: React.ComponentProps<typeof Toggle$1.Root> & VariantProps<typeof toggleVariants>): react_jsx_runtime.JSX.Element;

declare function ToggleGroup({ className, variant, size, spacing, children, ...props }: React.ComponentProps<typeof ToggleGroup$1.Root> & VariantProps<typeof toggleVariants> & {
    spacing?: number;
}): react_jsx_runtime.JSX.Element;
declare function ToggleGroupItem({ className, children, variant, size, ...props }: React.ComponentProps<typeof ToggleGroup$1.Item> & VariantProps<typeof toggleVariants>): react_jsx_runtime.JSX.Element;

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger, AlertTitle, Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, Badge, Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, Button, ButtonGroup, Calendar, CalendarDayButton, Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, ChartContainer, ChartLegend, ChartLegendContent, ChartStyle, ChartTooltip, ChartTooltipContent, Checkbox, Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut, DataTable, DatePicker, DateRangePicker, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerPortal, DrawerTitle, DrawerTrigger, Empty, HoverCard, HoverCardContent, HoverCardTrigger, Icon, IconButton, Input, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, Item, ItemBadge, Kbd, KbdGroup, Label, LinkButton, LoadingButton, MonthYearPicker, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, NavigationMenuViewport, Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, Popover, PopoverAnchor, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger, Progress, RadioGroup, RadioGroupItem, ResizableHandle, ResizablePanel, ResizablePanelGroup, ScrollArea, ScrollBar, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, Separator, Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, Skeleton, Spinner, Switch, Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, Toaster, Toggle, ToggleGroup, ToggleGroupItem, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, badgeVariants, buttonVariants, cn, iconVariants, linkButtonVariants, navigationMenuTriggerStyle, spinnerVariants, tabsListVariants, toggleVariants, useIsMobile, useSidebar };
export type { CardPadding, CardProps, CarouselApi, ChartConfig, DataTableProps, DatePickerProps, DateRangePickerProps, EmptyProps, IconButtonProps, IconProps, ItemProps, LinkButtonProps, LoadingButtonProps, MonthYearPickerProps };
