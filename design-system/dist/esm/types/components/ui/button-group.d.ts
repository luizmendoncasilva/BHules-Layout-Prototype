import * as React from "react";
/**
 * ButtonGroup
 *
 * Wraps multiple Button components into a visually connected row.
 * - First child: only left corners rounded
 * - Middle children: no rounding
 * - Last child: only right corners rounded
 * - Adjacent borders are collapsed (border-r-0 on all except last)
 */
declare function ButtonGroup({ className, ...props }: React.ComponentProps<"div">): import("react/jsx-runtime").JSX.Element;
export { ButtonGroup };
