import type { FixedPortalPanelOptions } from "@/lib/use-fixed-portal-panel";
interface MonthYearPickerProps extends FixedPortalPanelOptions {
    value?: Date;
    defaultValue?: Date;
    onValueChange?: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    /** Earliest selectable month (inclusive). Day-of-month is ignored. */
    min?: Date;
    /** Latest selectable month (inclusive). Day-of-month is ignored. */
    max?: Date;
    /** BCP 47 locale tag for month names. Default: "pt-BR". */
    locale?: string;
}
declare function MonthYearPicker({ value: controlledValue, defaultValue, onValueChange, placeholder, disabled, className, min, max, locale, portalContainer, zIndex, }: Readonly<MonthYearPickerProps>): import("react/jsx-runtime").JSX.Element;
export { MonthYearPicker };
export type { MonthYearPickerProps };
