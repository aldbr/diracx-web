import { RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // Extend ColumnMeta to include custom properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface ColumnMeta<TData extends RowData, TValue> {
    type?: "string" | "number" | "date" | "category";
    values?: string[]; // Optional values for category-type fields
  }
}
