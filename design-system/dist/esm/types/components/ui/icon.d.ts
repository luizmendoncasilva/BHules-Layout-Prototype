import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { type VariantProps } from "class-variance-authority";
declare const iconVariants: (props?: ({
    size?: "sm" | "md" | "xl" | null | undefined;
    color?: "black" | "neutral" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
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
declare function Icon({ icon: IconComponent, size, color, className, ...props }: Readonly<IconProps>): import("react/jsx-runtime").JSX.Element;
export { Icon, iconVariants };
export type { IconProps };
