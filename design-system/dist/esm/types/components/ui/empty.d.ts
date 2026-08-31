import * as React from "react";
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
declare function Empty({ className, icon, title, description, action, ...props }: EmptyProps): import("react/jsx-runtime").JSX.Element;
export { Empty };
export type { EmptyProps };
