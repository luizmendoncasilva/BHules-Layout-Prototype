import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
declare function TooltipProvider({ delayDuration, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>): import("react/jsx-runtime").JSX.Element;
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
declare function Tooltip({ delayDuration, ...props }: React.ComponentProps<typeof TooltipPrimitive.Root> & {
    delayDuration?: number;
}): import("react/jsx-runtime").JSX.Element;
declare function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>): import("react/jsx-runtime").JSX.Element;
declare function TooltipContent({ className, sideOffset, children, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>): import("react/jsx-runtime").JSX.Element;
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
