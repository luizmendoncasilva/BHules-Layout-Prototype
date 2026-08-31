import * as React from "react";
/**
 * ItemBadge
 *
 * 32×32 icon container with secondary background and border.
 * Place an icon (16–18px) as a child.
 */
declare function ItemBadge({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
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
declare function Item({ className, icon, title, description, action, onClick, ...props }: ItemProps): import("react/jsx-runtime").JSX.Element;
export { Item, ItemBadge };
export type { ItemProps };
