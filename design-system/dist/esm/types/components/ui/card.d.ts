import * as React from "react";
type CardPadding = "none" | "sm" | "md" | "lg";
interface CardProps extends React.ComponentProps<"div"> {
    /** Controls vertical padding of the Card and horizontal padding of its sub-components. Defaults to `md`. */
    padding?: CardPadding;
}
declare function Card({ className, padding, ...props }: Readonly<CardProps>): import("react/jsx-runtime").JSX.Element;
declare function CardHeader({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
declare function CardTitle({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
declare function CardDescription({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
declare function CardAction({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
declare function CardContent({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
declare function CardFooter({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent, };
export type { CardProps, CardPadding };
