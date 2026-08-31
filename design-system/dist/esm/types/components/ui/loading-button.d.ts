import * as React from "react";
import { Button } from "@/components/ui/button";
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
declare function LoadingButton({ loading, loadingText, children, disabled, className, ...props }: LoadingButtonProps): import("react/jsx-runtime").JSX.Element;
export { LoadingButton };
export type { LoadingButtonProps };
