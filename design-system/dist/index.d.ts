import { ClassValue } from 'clsx';
import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React$1 from 'react';
import { Accordion as Accordion$1, Separator as Separator$1, Tooltip as Tooltip$1, AlertDialog as AlertDialog$1, Avatar as Avatar$1, Checkbox as Checkbox$1, Collapsible as Collapsible$1, Dialog as Dialog$1, DropdownMenu as DropdownMenu$1, HoverCard as HoverCard$1, Label as Label$1, NavigationMenu as NavigationMenu$1, Popover as Popover$1, Progress as Progress$1, RadioGroup as RadioGroup$1, ScrollArea as ScrollArea$1, Select as Select$1, Switch as Switch$1, Tabs as Tabs$1, Toggle as Toggle$1, ToggleGroup as ToggleGroup$1 } from 'radix-ui';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';
import { LucideIcon } from 'lucide-react';
import { DayPicker, DayButton, DateRange } from 'react-day-picker';
import useEmblaCarousel, { UseEmblaCarouselType } from 'embla-carousel-react';
import * as RechartsPrimitive from 'recharts';
import { Command as Command$1 } from 'cmdk';
import { ColumnDef } from '@tanstack/react-table';
export { ColumnDef } from '@tanstack/react-table';
import { Locale } from 'date-fns';
import { Drawer as Drawer$1 } from 'vaul';
import { OTPInput } from 'input-otp';
import * as ResizablePrimitive from 'react-resizable-panels';
import { ToasterProps } from 'sonner';

declare function cn(...inputs: ClassValue[]): string;

declare function useIsMobile(): boolean;

declare function Accordion({ ...props }: React$1.ComponentProps<typeof Accordion$1.Root>): react_jsx_runtime.JSX.Element;
declare function AccordionItem({ className, ...props }: React$1.ComponentProps<typeof Accordion$1.Item>): react_jsx_runtime.JSX.Element;
declare function AccordionTrigger({ className, children, ...props }: React$1.ComponentProps<typeof Accordion$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function AccordionContent({ className, children, ...props }: React$1.ComponentProps<typeof Accordion$1.Content>): react_jsx_runtime.JSX.Element;

declare const alertVariants: (props?: ({
    variant?: "default" | "destructive" | "success" | "warning" | "info" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function Alert({ className, variant, ...props }: React$1.ComponentProps<"div"> & VariantProps<typeof alertVariants>): react_jsx_runtime.JSX.Element;
declare function AlertTitle({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function AlertDescription({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;

declare const buttonVariants: (props?: ({
    variant?: "default" | "destructive" | "success" | "warning" | "info" | "secondary" | "outline" | "ghost" | null | undefined;
    size?: "default" | "lg" | "sm" | "xs" | "icon" | "icon-lg" | "icon-sm" | "icon-xs" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function Button({ className, variant, size, asChild, ...props }: React$1.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
}): react_jsx_runtime.JSX.Element;

declare function Input({ className, type, ...props }: React$1.ComponentProps<"input">): react_jsx_runtime.JSX.Element;

declare function Separator({ className, orientation, decorative, ...props }: React$1.ComponentProps<typeof Separator$1.Root>): react_jsx_runtime.JSX.Element;

declare function TooltipProvider({ delayDuration, ...props }: React$1.ComponentProps<typeof Tooltip$1.Provider>): react_jsx_runtime.JSX.Element;
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
declare function Tooltip({ delayDuration, ...props }: React$1.ComponentProps<typeof Tooltip$1.Root> & {
    delayDuration?: number;
}): react_jsx_runtime.JSX.Element;
declare function TooltipTrigger({ ...props }: React$1.ComponentProps<typeof Tooltip$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function TooltipContent({ className, sideOffset, children, ...props }: React$1.ComponentProps<typeof Tooltip$1.Content>): react_jsx_runtime.JSX.Element;

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
declare function SidebarProvider({ defaultOpen, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }: React$1.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}): react_jsx_runtime.JSX.Element;
declare function Sidebar({ side, variant, collapsible, className, children, ...props }: React$1.ComponentProps<"div"> & {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
}): react_jsx_runtime.JSX.Element;
declare function SidebarTrigger({ className, onClick, ...props }: React$1.ComponentProps<typeof Button>): react_jsx_runtime.JSX.Element;
declare function SidebarRail({ className, ...props }: React$1.ComponentProps<"button">): react_jsx_runtime.JSX.Element;
declare function SidebarInset({ className, ...props }: React$1.ComponentProps<"main">): react_jsx_runtime.JSX.Element;
declare function SidebarInput({ className, ...props }: React$1.ComponentProps<typeof Input>): react_jsx_runtime.JSX.Element;
declare function SidebarHeader({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function SidebarFooter({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function SidebarSeparator({ className, ...props }: React$1.ComponentProps<typeof Separator>): react_jsx_runtime.JSX.Element;
declare function SidebarContent({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function SidebarGroup({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function SidebarGroupLabel({ className, asChild, ...props }: React$1.ComponentProps<"div"> & {
    asChild?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function SidebarGroupAction({ className, asChild, ...props }: React$1.ComponentProps<"button"> & {
    asChild?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function SidebarGroupContent({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function SidebarMenu({ className, ...props }: React$1.ComponentProps<"ul">): react_jsx_runtime.JSX.Element;
declare function SidebarMenuItem({ className, ...props }: React$1.ComponentProps<"li">): react_jsx_runtime.JSX.Element;
declare const sidebarMenuButtonVariants: (props?: ({
    variant?: "default" | "outline" | null | undefined;
    size?: "default" | "lg" | "sm" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function SidebarMenuButton({ asChild, isActive, variant, size, tooltip, className, ...props }: React$1.ComponentProps<"button"> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React$1.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>): react_jsx_runtime.JSX.Element;
declare function SidebarMenuAction({ className, asChild, showOnHover, ...props }: React$1.ComponentProps<"button"> & {
    asChild?: boolean;
    showOnHover?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function SidebarMenuBadge({ className, children, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function SidebarMenuSkeleton({ className, showIcon, ...props }: React$1.ComponentProps<"div"> & {
    showIcon?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function SidebarMenuSub({ className, ...props }: React$1.ComponentProps<"ul">): react_jsx_runtime.JSX.Element;
declare function SidebarMenuSubItem({ className, ...props }: React$1.ComponentProps<"li">): react_jsx_runtime.JSX.Element;
declare function SidebarMenuSubButton({ asChild, size, isActive, className, ...props }: React$1.ComponentProps<"a"> & {
    asChild?: boolean;
    size?: "sm" | "md";
    isActive?: boolean;
}): react_jsx_runtime.JSX.Element;

type SidebarLogoProps = {
    /** Full logo shown when sidebar is expanded */
    expandedLogo?: React$1.ReactNode;
    /** Icon-only logo shown when sidebar is collapsed */
    collapsedLogo?: React$1.ReactNode;
    /** Optional partner section rendered alongside BHub logo */
    partnerLogo?: React$1.ReactNode;
};
declare function BHubLogoFull(props: React$1.SVGProps<SVGSVGElement>): react_jsx_runtime.JSX.Element;
declare function BHubLogoIcon(props: React$1.SVGProps<SVGSVGElement>): react_jsx_runtime.JSX.Element;
declare function SidebarLogo({ expandedLogo, collapsedLogo, partnerLogo, }: SidebarLogoProps): react_jsx_runtime.JSX.Element;

type Workspace = {
    id: string;
    name: string;
    logo?: React$1.ReactNode;
    identifier?: string;
};
type WorkspaceSwitcherProps = {
    workspaces: Workspace[];
    activeWorkspaceId: string;
    onWorkspaceChange: (id: string) => void;
};
declare function WorkspaceSwitcher({ workspaces, activeWorkspaceId, onWorkspaceChange, }: WorkspaceSwitcherProps): react_jsx_runtime.JSX.Element | null;

type NavUserUser = {
    name: string;
    email: string;
    avatar?: string;
    /** Perfil/escopo exibido como badge abaixo do nome. Omitido → sem badge. */
    scope?: string;
};
type NavUserAction = {
    label: string;
    icon?: React$1.ComponentType<{
        className?: string;
    }>;
    onClick?: () => void;
};
type NavUserProps = {
    user: NavUserUser;
    /**
     * Itens do menu do usuário (acima do "Sair"). Quando omitido, usa os itens
     * padrão (Configurações / Solicitar troca de permissão). `[]` → nenhum.
     */
    actions?: NavUserAction[];
    /** Ação do item "Sair". */
    onLogout?: () => void;
};
declare function NavUser({ user, actions, onLogout }: NavUserProps): react_jsx_runtime.JSX.Element;

type UpdateCardProps = {
    /** Controls visibility. When `false`, the card is not rendered (feature-flag). Defaults to `true`. */
    enabled?: boolean;
    /** Small uppercase eyebrow text. */
    label?: string;
    title: string;
    description: string;
    href: string;
    /** Call-to-action text for the link. */
    cta?: string;
    /** Icon shown in the top-right corner. */
    icon?: LucideIcon;
    /** When provided, renders a dismiss button that triggers this callback. */
    onDismiss?: () => void;
};
declare function UpdateCard({ enabled, label, title, description, href, cta, icon: Icon, onDismiss, }: UpdateCardProps): react_jsx_runtime.JSX.Element | null;

type NavItem = {
    title: string;
    /**
     * Ícone do item. Obrigatório no primeiro nível (é o que aparece no modo
     * colapsado); opcional nos sub-itens.
     */
    icon?: LucideIcon | React$1.ComponentType<{
        className?: string;
    }>;
    /** Link do item. Quando omitido (SPA sem router), use `onClick`. */
    href?: string;
    /** Chave estável do item (default: `title`). */
    id?: string;
    /**
     * Ação do item (navegação de SPA, por exemplo).
     * - Item folha: chamado ao clicar.
     * - Item com `items` (grupo): o clique no modo expandido só abre/fecha o
     *   grupo; `onClick` é chamado apenas quando a sidebar está colapsada
     *   (modo ícone), junto com a expansão da sidebar.
     */
    onClick?: () => void;
    badge?: string | number;
    isActive?: boolean;
    disabled?: boolean;
    hasNotification?: boolean;
    notificationTooltip?: string;
    /** Sub-itens. Aceita aninhamento em qualquer profundidade. */
    items?: NavItem[];
};
type NavGroup = {
    label?: string;
    items: NavItem[];
};

declare const defaultNavGroups: NavGroup[];
declare const defaultUpdateCard: UpdateCardProps;
type AppSidebarProps = React$1.ComponentProps<typeof Sidebar> & {
    navGroups?: NavGroup[];
    /**
     * Update/announcement card shown in the footer. Acts as a feature-flag:
     * when omitted (or `enabled: false`), the card is not rendered.
     */
    updateCard?: UpdateCardProps;
    disabledTooltip?: string;
    /** Workspaces do switcher. `null` (ou `[]`) esconde o WorkspaceSwitcher. */
    workspaces?: Workspace[] | null;
    /** Workspace ativo inicial (default: o primeiro). */
    defaultWorkspaceId?: string;
    onWorkspaceChange?: (id: string) => void;
    /** Usuário do rodapé. `null` esconde o NavUser. */
    user?: NavUserUser | null;
    /** Itens do menu do usuário (ver `NavUser`). */
    userActions?: NavUserAction[];
    /** Ação "Sair" do menu do usuário. */
    onLogout?: () => void;
    /** Customização do logo (expandido / colapsado / parceiro). */
    logo?: SidebarLogoProps;
    /** Conteúdo extra no header, abaixo do logo/switcher. */
    headerContent?: React$1.ReactNode;
    /** Conteúdo extra no rodapé, acima do usuário. */
    footerContent?: React$1.ReactNode;
};
declare function AppSidebar({ navGroups, updateCard, disabledTooltip, workspaces, defaultWorkspaceId, onWorkspaceChange, user, userActions, onLogout, logo, headerContent, footerContent, ...props }: AppSidebarProps): react_jsx_runtime.JSX.Element;

declare function AlertDialog({ ...props }: React$1.ComponentProps<typeof AlertDialog$1.Root>): react_jsx_runtime.JSX.Element;
declare function AlertDialogTrigger({ ...props }: React$1.ComponentProps<typeof AlertDialog$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function AlertDialogPortal({ ...props }: React$1.ComponentProps<typeof AlertDialog$1.Portal>): react_jsx_runtime.JSX.Element;
declare function AlertDialogOverlay({ className, ...props }: React$1.ComponentProps<typeof AlertDialog$1.Overlay>): react_jsx_runtime.JSX.Element;
declare function AlertDialogContent({ className, size, ...props }: React$1.ComponentProps<typeof AlertDialog$1.Content> & {
    size?: "default" | "sm";
}): react_jsx_runtime.JSX.Element;
declare function AlertDialogHeader({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function AlertDialogFooter({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function AlertDialogTitle({ className, ...props }: React$1.ComponentProps<typeof AlertDialog$1.Title>): react_jsx_runtime.JSX.Element;
declare function AlertDialogDescription({ className, ...props }: React$1.ComponentProps<typeof AlertDialog$1.Description>): react_jsx_runtime.JSX.Element;
declare function AlertDialogMedia({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function AlertDialogAction({ className, variant, size, ...props }: React$1.ComponentProps<typeof AlertDialog$1.Action> & Pick<React$1.ComponentProps<typeof Button>, "variant" | "size">): react_jsx_runtime.JSX.Element;
declare function AlertDialogCancel({ className, variant, size, ...props }: React$1.ComponentProps<typeof AlertDialog$1.Cancel> & Pick<React$1.ComponentProps<typeof Button>, "variant" | "size">): react_jsx_runtime.JSX.Element;

declare function Avatar({ className, size, ...props }: React$1.ComponentProps<typeof Avatar$1.Root> & {
    size?: "default" | "sm" | "lg";
}): react_jsx_runtime.JSX.Element;
declare function AvatarImage({ className, ...props }: React$1.ComponentProps<typeof Avatar$1.Image>): react_jsx_runtime.JSX.Element;
declare function AvatarFallback({ className, ...props }: React$1.ComponentProps<typeof Avatar$1.Fallback>): react_jsx_runtime.JSX.Element;
declare function AvatarBadge({ className, ...props }: React$1.ComponentProps<"span">): react_jsx_runtime.JSX.Element;
declare function AvatarGroup({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function AvatarGroupCount({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;

declare const badgeVariants: (props?: ({
    variant?: "default" | "destructive" | "success" | "warning" | "info" | "secondary" | "outline" | "ghost" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function Badge({ className, variant, asChild, ...props }: React$1.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
}): react_jsx_runtime.JSX.Element;

declare function Breadcrumb({ ...props }: React$1.ComponentProps<"nav">): react_jsx_runtime.JSX.Element;
declare function BreadcrumbList({ className, ...props }: React$1.ComponentProps<"ol">): react_jsx_runtime.JSX.Element;
declare function BreadcrumbItem({ className, ...props }: React$1.ComponentProps<"li">): react_jsx_runtime.JSX.Element;
declare function BreadcrumbLink({ asChild, className, ...props }: React$1.ComponentProps<"a"> & {
    asChild?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function BreadcrumbPage({ className, ...props }: React$1.ComponentProps<"span">): react_jsx_runtime.JSX.Element;
declare function BreadcrumbSeparator({ children, className, ...props }: React$1.ComponentProps<"li">): react_jsx_runtime.JSX.Element;
declare function BreadcrumbEllipsis({ className, ...props }: React$1.ComponentProps<"span">): react_jsx_runtime.JSX.Element;

/**
 * ButtonGroup
 *
 * Wraps multiple Button components into a visually connected row.
 * - First child: only left corners rounded
 * - Middle children: no rounding
 * - Last child: only right corners rounded
 * - Adjacent borders are collapsed (border-r-0 on all except last)
 */
declare function ButtonGroup({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;

declare function Calendar({ className, classNames, showOutsideDays, captionLayout, buttonVariant, formatters, components, ...props }: React$1.ComponentProps<typeof DayPicker> & {
    buttonVariant?: React$1.ComponentProps<typeof Button>["variant"];
}): react_jsx_runtime.JSX.Element;
declare function CalendarDayButton({ className, day, modifiers, ...props }: React$1.ComponentProps<typeof DayButton>): react_jsx_runtime.JSX.Element;

type CardPadding = "none" | "sm" | "md" | "lg";
interface CardProps extends React$1.ComponentProps<"div"> {
    /** Controls vertical padding of the Card and horizontal padding of its sub-components. Defaults to `md`. */
    padding?: CardPadding;
}
declare function Card({ className, padding, ...props }: Readonly<CardProps>): react_jsx_runtime.JSX.Element;
declare function CardHeader({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CardTitle({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CardDescription({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CardAction({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CardContent({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CardFooter({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;

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
declare function Carousel({ orientation, opts, setApi, plugins, className, children, ...props }: React$1.ComponentProps<"div"> & CarouselProps): react_jsx_runtime.JSX.Element;
declare function CarouselContent({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CarouselItem({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function CarouselPrevious({ className, variant, size, ...props }: React$1.ComponentProps<typeof Button>): react_jsx_runtime.JSX.Element;
declare function CarouselNext({ className, variant, size, ...props }: React$1.ComponentProps<typeof Button>): react_jsx_runtime.JSX.Element;

declare const THEMES: {
    readonly light: "";
    readonly dark: ".dark";
};
type ChartConfig = {
    [k in string]: {
        label?: React$1.ReactNode;
        icon?: React$1.ComponentType;
    } & ({
        color?: string;
        theme?: never;
    } | {
        color?: never;
        theme: Record<keyof typeof THEMES, string>;
    });
};
declare function ChartContainer({ id, className, children, config, ...props }: React$1.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React$1.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}): react_jsx_runtime.JSX.Element;
declare const ChartStyle: ({ id, config }: {
    id: string;
    config: ChartConfig;
}) => react_jsx_runtime.JSX.Element | null;
declare const ChartTooltip: typeof RechartsPrimitive.Tooltip;
declare function ChartTooltipContent({ active, payload, className, indicator, hideLabel, hideIndicator, label, labelFormatter, labelClassName, formatter, color, nameKey, labelKey, }: React$1.ComponentProps<typeof RechartsPrimitive.Tooltip> & React$1.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
}): react_jsx_runtime.JSX.Element | null;
declare const ChartLegend: typeof RechartsPrimitive.Legend;
declare function ChartLegendContent({ className, hideIcon, payload, verticalAlign, nameKey, }: React$1.ComponentProps<"div"> & Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
    hideIcon?: boolean;
    nameKey?: string;
}): react_jsx_runtime.JSX.Element | null;

declare function Checkbox({ className, ...props }: React$1.ComponentProps<typeof Checkbox$1.Root>): react_jsx_runtime.JSX.Element;

declare function Collapsible({ ...props }: React.ComponentProps<typeof Collapsible$1.Root>): react_jsx_runtime.JSX.Element;
declare function CollapsibleTrigger({ ...props }: React.ComponentProps<typeof Collapsible$1.CollapsibleTrigger>): react_jsx_runtime.JSX.Element;
declare function CollapsibleContent({ className, ...props }: React.ComponentProps<typeof Collapsible$1.CollapsibleContent>): react_jsx_runtime.JSX.Element;

declare function Dialog({ ...props }: React$1.ComponentProps<typeof Dialog$1.Root>): react_jsx_runtime.JSX.Element;
declare function DialogTrigger({ ...props }: React$1.ComponentProps<typeof Dialog$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function DialogPortal({ ...props }: React$1.ComponentProps<typeof Dialog$1.Portal>): react_jsx_runtime.JSX.Element;
declare function DialogClose({ ...props }: React$1.ComponentProps<typeof Dialog$1.Close>): react_jsx_runtime.JSX.Element;
declare function DialogOverlay({ className, ...props }: React$1.ComponentProps<typeof Dialog$1.Overlay>): react_jsx_runtime.JSX.Element;
declare function DialogContent({ className, children, showCloseButton, ...props }: React$1.ComponentProps<typeof Dialog$1.Content> & {
    showCloseButton?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function DialogHeader({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function DialogFooter({ className, showCloseButton, children, ...props }: React$1.ComponentProps<"div"> & {
    showCloseButton?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function DialogTitle({ className, ...props }: React$1.ComponentProps<typeof Dialog$1.Title>): react_jsx_runtime.JSX.Element;
declare function DialogDescription({ className, ...props }: React$1.ComponentProps<typeof Dialog$1.Description>): react_jsx_runtime.JSX.Element;

declare function Command({ className, ...props }: React$1.ComponentProps<typeof Command$1>): react_jsx_runtime.JSX.Element;
declare function CommandDialog({ title, description, children, className, showCloseButton, ...props }: React$1.ComponentProps<typeof Dialog> & {
    title?: string;
    description?: string;
    className?: string;
    showCloseButton?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function CommandInput({ className, ...props }: React$1.ComponentProps<typeof Command$1.Input>): react_jsx_runtime.JSX.Element;
declare function CommandList({ className, ...props }: React$1.ComponentProps<typeof Command$1.List>): react_jsx_runtime.JSX.Element;
declare function CommandEmpty({ ...props }: React$1.ComponentProps<typeof Command$1.Empty>): react_jsx_runtime.JSX.Element;
declare function CommandGroup({ className, ...props }: React$1.ComponentProps<typeof Command$1.Group>): react_jsx_runtime.JSX.Element;
declare function CommandSeparator({ className, ...props }: React$1.ComponentProps<typeof Command$1.Separator>): react_jsx_runtime.JSX.Element;
declare function CommandItem({ className, ...props }: React$1.ComponentProps<typeof Command$1.Item>): react_jsx_runtime.JSX.Element;
declare function CommandShortcut({ className, ...props }: React$1.ComponentProps<"span">): react_jsx_runtime.JSX.Element;

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
    captionLayout?: React$1.ComponentProps<typeof Calendar>["captionLayout"];
    /** Earliest navigable/selectable month. Defaults to today − 100 years when the header uses dropdowns. */
    startMonth?: Date;
    /** Latest navigable/selectable month. Defaults to today + 10 years when the header uses dropdowns. */
    endMonth?: Date;
    /**
     * Dates to disable, as a react-day-picker Matcher — e.g.
     * `{ after: new Date() }` to forbid future dates on a birthdate field.
     */
    disabledDates?: React$1.ComponentProps<typeof Calendar>["disabled"];
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
    captionLayout?: React$1.ComponentProps<typeof Calendar>["captionLayout"];
    /** Earliest navigable/selectable month. Defaults to today − 100 years when the header uses dropdowns. */
    startMonth?: Date;
    /** Latest navigable/selectable month. Defaults to today + 10 years when the header uses dropdowns. */
    endMonth?: Date;
    /**
     * Dates to disable, as a react-day-picker Matcher — e.g. `{ after: new Date() }`.
     */
    disabledDates?: React$1.ComponentProps<typeof Calendar>["disabled"];
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

declare function Drawer({ ...props }: React$1.ComponentProps<typeof Drawer$1.Root>): react_jsx_runtime.JSX.Element;
declare function DrawerTrigger({ ...props }: React$1.ComponentProps<typeof Drawer$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function DrawerPortal({ ...props }: React$1.ComponentProps<typeof Drawer$1.Portal>): react_jsx_runtime.JSX.Element;
declare function DrawerClose({ ...props }: React$1.ComponentProps<typeof Drawer$1.Close>): react_jsx_runtime.JSX.Element;
declare function DrawerOverlay({ className, ...props }: React$1.ComponentProps<typeof Drawer$1.Overlay>): react_jsx_runtime.JSX.Element;
declare function DrawerContent({ className, children, ...props }: React$1.ComponentProps<typeof Drawer$1.Content>): react_jsx_runtime.JSX.Element;
declare function DrawerHeader({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function DrawerFooter({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function DrawerTitle({ className, ...props }: React$1.ComponentProps<typeof Drawer$1.Title>): react_jsx_runtime.JSX.Element;
declare function DrawerDescription({ className, ...props }: React$1.ComponentProps<typeof Drawer$1.Description>): react_jsx_runtime.JSX.Element;

declare function DropdownMenu({ ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Root>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuPortal({ ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Portal>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuTrigger({ ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuContent({ className, sideOffset, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Content>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuGroup({ ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Group>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuItem({ className, inset, variant, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
}): react_jsx_runtime.JSX.Element;
declare function DropdownMenuCheckboxItem({ className, children, checked, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.CheckboxItem>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuRadioGroup({ ...props }: React$1.ComponentProps<typeof DropdownMenu$1.RadioGroup>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuRadioItem({ className, children, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.RadioItem>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuLabel({ className, inset, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Label> & {
    inset?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function DropdownMenuSeparator({ className, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Separator>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuShortcut({ className, ...props }: React$1.ComponentProps<"span">): react_jsx_runtime.JSX.Element;
declare function DropdownMenuSub({ ...props }: React$1.ComponentProps<typeof DropdownMenu$1.Sub>): react_jsx_runtime.JSX.Element;
declare function DropdownMenuSubTrigger({ className, inset, children, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.SubTrigger> & {
    inset?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function DropdownMenuSubContent({ className, ...props }: React$1.ComponentProps<typeof DropdownMenu$1.SubContent>): react_jsx_runtime.JSX.Element;

interface EmptyProps extends React$1.ComponentProps<"div"> {
    /**
     * Icon element rendered in the icon container.
     * Defaults to InboxIcon. Pass `null` to hide the icon container entirely.
     */
    icon?: React$1.ReactNode | null;
    /** Primary heading */
    title?: string;
    /** Supporting description */
    description?: string;
    /** CTA button or any action element */
    action?: React$1.ReactNode;
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

declare function HoverCard({ ...props }: React$1.ComponentProps<typeof HoverCard$1.Root>): react_jsx_runtime.JSX.Element;
declare function HoverCardTrigger({ ...props }: React$1.ComponentProps<typeof HoverCard$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function HoverCardContent({ className, align, sideOffset, ...props }: React$1.ComponentProps<typeof HoverCard$1.Content>): react_jsx_runtime.JSX.Element;

declare const iconVariants: (props?: ({
    size?: "sm" | "md" | "xl" | null | undefined;
    color?: "black" | "neutral" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface IconProps extends Omit<React$1.SVGProps<SVGSVGElement>, "color">, VariantProps<typeof iconVariants> {
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
interface IconButtonProps extends Omit<React$1.ComponentProps<typeof Button>, "size"> {
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

declare function InputOTP({ className, containerClassName, ...props }: React$1.ComponentProps<typeof OTPInput> & {
    containerClassName?: string;
}): react_jsx_runtime.JSX.Element;
declare function InputOTPGroup({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function InputOTPSlot({ index, className, ...props }: React$1.ComponentProps<"div"> & {
    index: number;
}): react_jsx_runtime.JSX.Element;
declare function InputOTPSeparator({ ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;

/**
 * ItemBadge
 *
 * 32×32 icon container with secondary background and border.
 * Place an icon (16–18px) as a child.
 */
declare function ItemBadge({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
interface ItemProps extends React$1.ComponentProps<"div"> {
    /** Icon rendered inside the ItemBadge on the left */
    icon?: React$1.ReactNode;
    /** Primary text */
    title: string;
    /** Secondary text below the title */
    description?: string;
    /**
     * Custom right-side action. Pass `null` to hide the chevron even when
     * onClick is set. Defaults to a ChevronRight when onClick is provided.
     */
    action?: React$1.ReactNode | null;
    onClick?: React$1.MouseEventHandler<HTMLDivElement>;
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

declare function Kbd({ className, ...props }: React$1.ComponentProps<"kbd">): react_jsx_runtime.JSX.Element;
declare function KbdGroup({ className, ...props }: React$1.ComponentProps<"span">): react_jsx_runtime.JSX.Element;

declare function Label({ className, ...props }: React$1.ComponentProps<typeof Label$1.Root>): react_jsx_runtime.JSX.Element;

declare const linkButtonVariants: (props?: ({
    variant?: "default" | "secondary" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface LinkButtonProps extends React$1.ComponentProps<"button">, VariantProps<typeof linkButtonVariants> {
}
/**
 * LinkButton
 *
 * A button that renders as inline text with an underline,
 * visually matching a hyperlink while remaining a <button> element.
 * Use `variant="secondary"` for a neutral tone that blends into body copy.
 */
declare function LinkButton({ className, variant, ...props }: LinkButtonProps): react_jsx_runtime.JSX.Element;

interface LoadingButtonProps extends React$1.ComponentProps<typeof Button> {
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

declare function NavigationMenu({ className, children, viewport, ...props }: React$1.ComponentProps<typeof NavigationMenu$1.Root> & {
    viewport?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function NavigationMenuList({ className, ...props }: React$1.ComponentProps<typeof NavigationMenu$1.List>): react_jsx_runtime.JSX.Element;
declare function NavigationMenuItem({ className, ...props }: React$1.ComponentProps<typeof NavigationMenu$1.Item>): react_jsx_runtime.JSX.Element;
declare const navigationMenuTriggerStyle: (props?: class_variance_authority_types.ClassProp | undefined) => string;
declare function NavigationMenuTrigger({ className, children, ...props }: React$1.ComponentProps<typeof NavigationMenu$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function NavigationMenuContent({ className, ...props }: React$1.ComponentProps<typeof NavigationMenu$1.Content>): react_jsx_runtime.JSX.Element;
declare function NavigationMenuViewport({ className, ...props }: React$1.ComponentProps<typeof NavigationMenu$1.Viewport>): react_jsx_runtime.JSX.Element;
declare function NavigationMenuLink({ className, ...props }: React$1.ComponentProps<typeof NavigationMenu$1.Link>): react_jsx_runtime.JSX.Element;
declare function NavigationMenuIndicator({ className, ...props }: React$1.ComponentProps<typeof NavigationMenu$1.Indicator>): react_jsx_runtime.JSX.Element;

declare function Pagination({ className, ...props }: React$1.ComponentProps<"nav">): react_jsx_runtime.JSX.Element;
declare function PaginationContent({ className, ...props }: React$1.ComponentProps<"ul">): react_jsx_runtime.JSX.Element;
declare function PaginationItem({ ...props }: React$1.ComponentProps<"li">): react_jsx_runtime.JSX.Element;
type PaginationLinkProps = {
    isActive?: boolean;
} & Pick<React$1.ComponentProps<typeof Button>, "size"> & React$1.ComponentProps<"a">;
declare function PaginationLink({ className, isActive, size, ...props }: PaginationLinkProps): react_jsx_runtime.JSX.Element;
declare function PaginationPrevious({ className, ...props }: React$1.ComponentProps<typeof PaginationLink>): react_jsx_runtime.JSX.Element;
declare function PaginationNext({ className, ...props }: React$1.ComponentProps<typeof PaginationLink>): react_jsx_runtime.JSX.Element;
declare function PaginationEllipsis({ className, ...props }: React$1.ComponentProps<"span">): react_jsx_runtime.JSX.Element;

declare function Popover({ ...props }: React$1.ComponentProps<typeof Popover$1.Root>): react_jsx_runtime.JSX.Element;
declare function PopoverTrigger({ ...props }: React$1.ComponentProps<typeof Popover$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function PopoverContent({ className, align, sideOffset, ...props }: React$1.ComponentProps<typeof Popover$1.Content>): react_jsx_runtime.JSX.Element;
declare function PopoverAnchor({ ...props }: React$1.ComponentProps<typeof Popover$1.Anchor>): react_jsx_runtime.JSX.Element;
declare function PopoverHeader({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function PopoverTitle({ className, ...props }: React$1.ComponentProps<"h2">): react_jsx_runtime.JSX.Element;
declare function PopoverDescription({ className, ...props }: React$1.ComponentProps<"p">): react_jsx_runtime.JSX.Element;

declare function Progress({ className, value, ...props }: React$1.ComponentProps<typeof Progress$1.Root>): react_jsx_runtime.JSX.Element;

declare function RadioGroup({ className, ...props }: React$1.ComponentProps<typeof RadioGroup$1.Root>): react_jsx_runtime.JSX.Element;
declare function RadioGroupItem({ className, ...props }: React$1.ComponentProps<typeof RadioGroup$1.Item>): react_jsx_runtime.JSX.Element;

declare function ResizablePanelGroup({ className, ...props }: ResizablePrimitive.GroupProps): react_jsx_runtime.JSX.Element;
declare function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps): react_jsx_runtime.JSX.Element;
declare function ResizableHandle({ withHandle, className, ...props }: ResizablePrimitive.SeparatorProps & {
    withHandle?: boolean;
}): react_jsx_runtime.JSX.Element;

declare function ScrollArea({ className, children, ...props }: React$1.ComponentProps<typeof ScrollArea$1.Root>): react_jsx_runtime.JSX.Element;
declare function ScrollBar({ className, orientation, ...props }: React$1.ComponentProps<typeof ScrollArea$1.ScrollAreaScrollbar>): react_jsx_runtime.JSX.Element;

declare function Select({ isDeselectable, value, defaultValue, onValueChange, open, defaultOpen, onOpenChange, children, ...props }: React$1.ComponentProps<typeof Select$1.Root> & {
    isDeselectable?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function SelectGroup({ ...props }: React$1.ComponentProps<typeof Select$1.Group>): react_jsx_runtime.JSX.Element;
declare function SelectValue({ ...props }: React$1.ComponentProps<typeof Select$1.Value>): react_jsx_runtime.JSX.Element;
declare function SelectTrigger({ className, size, children, ...props }: React$1.ComponentProps<typeof Select$1.Trigger> & {
    size?: "sm" | "default";
}): react_jsx_runtime.JSX.Element;
declare function SelectContent({ className, children, position, align, ...props }: React$1.ComponentProps<typeof Select$1.Content>): react_jsx_runtime.JSX.Element;
declare function SelectLabel({ className, ...props }: React$1.ComponentProps<typeof Select$1.Label>): react_jsx_runtime.JSX.Element;
declare function SelectItem({ className, children, ...props }: React$1.ComponentProps<typeof Select$1.Item>): react_jsx_runtime.JSX.Element;
declare function SelectSeparator({ className, ...props }: React$1.ComponentProps<typeof Select$1.Separator>): react_jsx_runtime.JSX.Element;
declare function SelectScrollUpButton({ className, ...props }: React$1.ComponentProps<typeof Select$1.ScrollUpButton>): react_jsx_runtime.JSX.Element;
declare function SelectScrollDownButton({ className, ...props }: React$1.ComponentProps<typeof Select$1.ScrollDownButton>): react_jsx_runtime.JSX.Element;

declare function Sheet({ ...props }: React$1.ComponentProps<typeof Dialog$1.Root>): react_jsx_runtime.JSX.Element;
declare function SheetTrigger({ ...props }: React$1.ComponentProps<typeof Dialog$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function SheetClose({ ...props }: React$1.ComponentProps<typeof Dialog$1.Close>): react_jsx_runtime.JSX.Element;
declare function SheetContent({ className, children, side, showCloseButton, ...props }: React$1.ComponentProps<typeof Dialog$1.Content> & {
    side?: "top" | "right" | "bottom" | "left";
    showCloseButton?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function SheetHeader({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function SheetFooter({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;
declare function SheetTitle({ className, ...props }: React$1.ComponentProps<typeof Dialog$1.Title>): react_jsx_runtime.JSX.Element;
declare function SheetDescription({ className, ...props }: React$1.ComponentProps<typeof Dialog$1.Description>): react_jsx_runtime.JSX.Element;

declare function Skeleton({ className, ...props }: React$1.ComponentProps<"div">): react_jsx_runtime.JSX.Element;

declare const Toaster: ({ theme, ...props }: ToasterProps) => react_jsx_runtime.JSX.Element;

declare const spinnerVariants: (props?: ({
    size?: "default" | "lg" | "sm" | "xs" | "xl" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function Spinner({ className, size, ...props }: React$1.ComponentProps<"svg"> & VariantProps<typeof spinnerVariants>): react_jsx_runtime.JSX.Element;

declare function Switch({ className, size, ...props }: React$1.ComponentProps<typeof Switch$1.Root> & {
    size?: "sm" | "default";
}): react_jsx_runtime.JSX.Element;

declare function Table({ className, ...props }: React$1.ComponentProps<"table">): react_jsx_runtime.JSX.Element;
declare function TableHeader({ className, ...props }: React$1.ComponentProps<"thead">): react_jsx_runtime.JSX.Element;
declare function TableBody({ className, ...props }: React$1.ComponentProps<"tbody">): react_jsx_runtime.JSX.Element;
declare function TableFooter({ className, ...props }: React$1.ComponentProps<"tfoot">): react_jsx_runtime.JSX.Element;
declare function TableRow({ className, ...props }: React$1.ComponentProps<"tr">): react_jsx_runtime.JSX.Element;
declare function TableHead({ className, ...props }: React$1.ComponentProps<"th">): react_jsx_runtime.JSX.Element;
declare function TableCell({ className, ...props }: React$1.ComponentProps<"td">): react_jsx_runtime.JSX.Element;
declare function TableCaption({ className, ...props }: React$1.ComponentProps<"caption">): react_jsx_runtime.JSX.Element;

declare function Tabs({ className, orientation, ...props }: React$1.ComponentProps<typeof Tabs$1.Root>): react_jsx_runtime.JSX.Element;
declare const tabsListVariants: (props?: ({
    variant?: "line" | "default" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function TabsList({ className, variant, ...props }: React$1.ComponentProps<typeof Tabs$1.List> & VariantProps<typeof tabsListVariants>): react_jsx_runtime.JSX.Element;
declare function TabsTrigger({ className, ...props }: React$1.ComponentProps<typeof Tabs$1.Trigger>): react_jsx_runtime.JSX.Element;
declare function TabsContent({ className, ...props }: React$1.ComponentProps<typeof Tabs$1.Content>): react_jsx_runtime.JSX.Element;

declare function Textarea({ className, ...props }: React$1.ComponentProps<"textarea">): react_jsx_runtime.JSX.Element;

declare const toggleVariants: (props?: ({
    variant?: "default" | "outline" | null | undefined;
    size?: "default" | "lg" | "sm" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare function Toggle({ className, variant, size, ...props }: React$1.ComponentProps<typeof Toggle$1.Root> & VariantProps<typeof toggleVariants>): react_jsx_runtime.JSX.Element;

declare function ToggleGroup({ className, variant, size, spacing, children, ...props }: React$1.ComponentProps<typeof ToggleGroup$1.Root> & VariantProps<typeof toggleVariants> & {
    spacing?: number;
}): react_jsx_runtime.JSX.Element;
declare function ToggleGroupItem({ className, children, variant, size, ...props }: React$1.ComponentProps<typeof ToggleGroup$1.Item> & VariantProps<typeof toggleVariants>): react_jsx_runtime.JSX.Element;

type NavMainProps = {
    navGroups: NavGroup[];
    disabledTooltip?: string;
};
declare function NavMain({ navGroups, disabledTooltip }: NavMainProps): react_jsx_runtime.JSX.Element;

type PageHeaderProps = React$1.ComponentProps<"header"> & {
    /** Render the built-in SidebarTrigger on the left. @default true */
    showTrigger?: boolean;
    /** Right-aligned actions area (e.g. CurrentDateTime, NotificationBell). */
    actions?: React$1.ReactNode;
};
declare function PageHeader({ showTrigger, actions, className, children, ...props }: PageHeaderProps): react_jsx_runtime.JSX.Element;

type CurrentDateTimeProps = {
    className?: string;
    /** Fixed date for demos/tests. When omitted, uses a live clock. */
    date?: Date;
    locale?: string;
};
declare function CurrentDateTime({ className, date: fixedDate, locale, }: CurrentDateTimeProps): react_jsx_runtime.JSX.Element;

/** Fixed datetime for Storybook demos and visual regression. */
declare const mockCurrentDateTime: Date;

/**
 * NotificationBell data contract.
 *
 * In production, map your API payload to `Notification` and pass the array
 * via the `notifications` prop on `<NotificationBell />`.
 */
type Notification = {
    /** Stable unique id from the backend */
    id: string;
    title: string;
    description?: string;
    /** Relative or formatted timestamp label (e.g. "2 min", "Ontem") */
    time: string;
    read?: boolean;
    /** Optional deep-link when the user clicks the notification */
    href?: string;
};
/**
 * Mock data for Storybook and local development.
 * Do not use in production — replace with real notifications from your API.
 */
declare const mockNotifications: Notification[];

type NotificationBellProps = {
    /** Notification list from your API — defaults to empty when omitted */
    notifications?: Notification[];
    className?: string;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    onNotificationClick?: (notification: Notification) => void;
    onMarkAllRead?: () => void;
};
declare function NotificationBellItem({ notification, onClick, }: {
    notification: Notification;
    onClick?: (notification: Notification) => void;
}): react_jsx_runtime.JSX.Element;
declare function NotificationBell({ notifications, className, open, defaultOpen, onOpenChange, onNotificationClick, onMarkAllRead, }: NotificationBellProps): react_jsx_runtime.JSX.Element;

type NotificationDotProps = {
    /** Renders the unread dot. When false, keeps layout spacing. */
    show?: boolean;
    /** Adds the pulsing ring animation for active indicators. */
    pulse?: boolean;
    className?: string;
};
declare function NotificationDot({ show, pulse, className, }: NotificationDotProps): react_jsx_runtime.JSX.Element;

type NavSecondaryItem = {
    title: string;
    icon: LucideIcon;
    href: string;
};
type NavSecondaryProps = {
    items: NavSecondaryItem[];
};
declare function NavSecondary({ items }: NavSecondaryProps): react_jsx_runtime.JSX.Element;

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger, AlertTitle, AppSidebar, Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, BHubLogoFull, BHubLogoIcon, Badge, Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, Button, ButtonGroup, Calendar, CalendarDayButton, Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, ChartContainer, ChartLegend, ChartLegendContent, ChartStyle, ChartTooltip, ChartTooltipContent, Checkbox, Collapsible, CollapsibleContent, CollapsibleTrigger, Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut, CurrentDateTime, DataTable, DatePicker, DateRangePicker, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerPortal, DrawerTitle, DrawerTrigger, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, Empty, HoverCard, HoverCardContent, HoverCardTrigger, Icon, IconButton, Input, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, Item, ItemBadge, Kbd, KbdGroup, Label, LinkButton, LoadingButton, MonthYearPicker, NavMain, NavSecondary, NavUser, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, NavigationMenuViewport, NotificationBell, NotificationBellItem, NotificationDot, PageHeader, Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, Popover, PopoverAnchor, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger, Progress, RadioGroup, RadioGroupItem, ResizableHandle, ResizablePanel, ResizablePanelGroup, ScrollArea, ScrollBar, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, Separator, Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarLogo, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, Skeleton, Spinner, Switch, Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, Toaster, Toggle, ToggleGroup, ToggleGroupItem, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, UpdateCard, WorkspaceSwitcher, badgeVariants, buttonVariants, cn, defaultNavGroups, defaultUpdateCard, iconVariants, linkButtonVariants, mockCurrentDateTime, mockNotifications, navigationMenuTriggerStyle, spinnerVariants, tabsListVariants, toggleVariants, useIsMobile, useSidebar };
export type { AppSidebarProps, CardPadding, CardProps, CarouselApi, ChartConfig, CurrentDateTimeProps, DataTableProps, DatePickerProps, DateRangePickerProps, EmptyProps, IconButtonProps, IconProps, ItemProps, LinkButtonProps, LoadingButtonProps, MonthYearPickerProps, NavGroup, NavItem, NavMainProps, NavSecondaryItem, NavSecondaryProps, NavUserAction, NavUserProps, NavUserUser, Notification, NotificationBellProps, NotificationDotProps, PageHeaderProps, SidebarLogoProps, UpdateCardProps, Workspace };
