import type { JSX } from "solid-js";

export type Column<T> = {
  id: string;
  label: string;
  cell: (row: T) => JSX.Element;
  sortBy?: (row: T) => string | number | null;
  width?: string;
  fold?: boolean;
  numeric?: boolean;
  rowHeader?: boolean;
};

export type DataTableLabels = {
  /** Accessible name for a sort button; `{column}` is replaced with the column label. */
  sortBy: string;
  /** Header of the trailing actions column, rendered visually hidden. */
  actions: string;
  /** Label of the next-page link. */
  nextPage: string;
};
