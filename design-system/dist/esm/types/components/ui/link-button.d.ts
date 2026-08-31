import * as React from "react";
import { type VariantProps } from "class-variance-authority";
declare const linkButtonVariants: (props?: ({
    variant?: "default" | "secondary" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
interface LinkButtonProps extends React.ComponentProps<"button">, VariantProps<typeof linkButtonVariants> {
}
/**
 * LinkButton
 *
 * A button that renders as inline text with an underline,
 * visually matching a hyperlink while remaining a <button> element.
 * Use `variant="secondary"` for a neutral tone that blends into body copy.
 */
declare function LinkButton({ className, variant, ...props }: LinkButtonProps): import("react/jsx-runtime").JSX.Element;
export { LinkButton, linkButtonVariants };
export type { LinkButtonProps };
