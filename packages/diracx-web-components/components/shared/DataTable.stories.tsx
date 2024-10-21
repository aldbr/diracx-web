import React from "react";
import { StoryObj, Meta } from "@storybook/react";
import { useArgs } from "@storybook/core/preview-api";
import { ThemeProvider as MUIThemeProvider } from "@mui/material/styles";
import {
  AccessorKeyColumnDef,
  createColumnHelper,
} from "@tanstack/react-table";
import { useMUITheme } from "../../hooks/theme";
import { DataTable } from "./DataTable";

const meta = {
  title: "shared/DataTable",
  component: DataTable,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    page: { control: "number" },
    setPage: { control: false },
    rowsPerPage: { control: "number" },
    setRowsPerPage: { control: false },
    selected: { control: "object" },
    setSelected: { control: false },
    searchBody: { control: false },
    setSearchBody: { control: false },
    columns: { control: "object" },
    rows: { control: "object" },
    error: { control: "text" },
    isValidating: { control: "boolean" },
    isLoading: { control: "boolean" },
    rowIdentifier: { control: "text" },
    isMobile: { control: "boolean" },
    toolbarComponents: { control: false },
    menuItems: { control: "object" },
  },
  args: {},
  decorators: [
    (Story) => {
      const theme = useMUITheme();
      return (
        <MUIThemeProvider theme={theme}>
          <Story />
        </MUIThemeProvider>
      );
    },
  ],
} satisfies Meta<typeof DataTable>;

interface SimpleItem extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
  [key: string]: unknown;
}

const columnHelper = createColumnHelper<SimpleItem>();

const columns: Array<
  | AccessorKeyColumnDef<Record<string, unknown>, number>
  | AccessorKeyColumnDef<Record<string, unknown>, string>
  | AccessorKeyColumnDef<Record<string, unknown>, Date>
> = [
  columnHelper.accessor("id", {
    header: "ID",
    meta: { type: "number" },
  }) as AccessorKeyColumnDef<Record<string, unknown>, number>,
  columnHelper.accessor("name", {
    header: "Name",
    meta: { type: "string" },
  }) as AccessorKeyColumnDef<Record<string, unknown>, string>,
  columnHelper.accessor("email", {
    header: "Email",
    meta: { type: "string" },
  }) as AccessorKeyColumnDef<Record<string, unknown>, string>,
];

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: "900px" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    title: "Data Table",
    page: 0,
    setPage: () => {},
    rowsPerPage: 25,
    setRowsPerPage: () => {},
    selected: [],
    setSelected: () => {},
    searchBody: { sort: [{ parameter: "id", direction: "asc" }] },
    setSearchBody: () => {},
    columns: columns,
    rows: [{ id: 1, name: "John Doe", email: "john@example.com" }],
    error: "",
    isValidating: false,
    isLoading: false,
    rowIdentifier: "id",
    isMobile: false,
    toolbarComponents: <></>,
    menuItems: [{ label: "Edit", onClick: () => {} }],
  },
  render: (props) => {
    const [, updateArgs] = useArgs();
    props.setPage = (newPage) => {
      if (typeof newPage === "function") newPage = newPage(props.page);
      updateArgs({ page: newPage });
    };
    props.setRowsPerPage = (newRowsPerPage) => {
      if (typeof newRowsPerPage === "function")
        newRowsPerPage = newRowsPerPage(props.rowsPerPage);
      updateArgs({ rowsPerPage: newRowsPerPage });
    };
    props.setSelected = (newSelected) => {
      if (typeof newSelected === "function")
        newSelected = newSelected(props.selected);
      updateArgs({ selected: newSelected });
    };
    return <DataTable {...props} />;
  },
};
