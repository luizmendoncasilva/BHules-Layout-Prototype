import * as React from "react";
import { Button } from "@/components/ui/button";
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
declare function IconButton({ size, className, ...props }: IconButtonProps): import("react/jsx-runtime").JSX.Element;
export { IconButton };
export type { IconButtonProps };
