import React from "react";
import { StoryObj, Meta } from "@storybook/react";
import { ThemeProvider as MUIThemeProvider } from "@mui/material/styles";
import { Paper } from "@mui/material";
import {
  AccessorKeyColumnDef,
  createColumnHelper,
} from "@tanstack/react-table";
import { useMUITheme } from "../../hooks/theme";
import { FilterForm } from "./FilterForm";

const meta = {
  title: "shared/FilterForm",
  component: FilterForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    columns: { control: "object" },
    filters: { control: "object" },
    setFilters: { control: "object" },
    handleFilterChange: { control: "object" },
    handleFilterMenuClose: { control: "object" },
    selectedFilterId: { control: "number" },
  },
  decorators: [
    (Story) => {
      const theme = useMUITheme();
      return (
        <MUIThemeProvider theme={theme}>
          <Paper sx={{ p: 2 }}>
            <Story />
          </Paper>
        </MUIThemeProvider>
      );
    },
  ],
} satisfies Meta<typeof FilterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

interface SimpleItem extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
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

export const Default: Story = {
  args: {
    columns: columns,
    filters: [{ id: 0, parameter: "id", operator: "eq", value: "1" }],
    setFilters: () => {},
    handleFilterChange: () => {},
    handleFilterMenuClose: () => {},
    selectedFilterId: 0,
  },
};
