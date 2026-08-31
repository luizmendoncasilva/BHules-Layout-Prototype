import * as React from "react";
import { type VariantProps } from "class-variance-authority";
declare const spinnerVariants: (props?: ({
    size?: "default" | "lg" | "sm" | "xs" | "xl" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
declare function Spinner({ className, size, ...props }: React.ComponentProps<"svg"> & VariantProps<typeof spinnerVariants>): import("react/jsx-runtime").JSX.Element;
export { Spinner, spinnerVariants };
