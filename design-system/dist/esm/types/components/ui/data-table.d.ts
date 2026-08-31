import { type ColumnDef } from "@tanstack/react-table";
interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    /** Show pagination controls (default: true) */
    pagination?: boolean;
    /** Page size options for the pagination selector */
    pageSizeOptions?: number[];
    /** Additional className on the table wrapper */
    className?: string;
}
declare function DataTable<TData, TValue>({ columns, data, pagination, pageSizeOptions, className, }: DataTableProps<TData, TValue>): import("react/jsx-runtime").JSX.Element;
export { DataTable };
export type { DataTableProps, ColumnDef };
