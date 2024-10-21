import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import {
  AccessorKeyColumnDef,
  createColumnHelper,
} from "@tanstack/react-table";
import { FilterForm } from "@/components/shared/FilterForm";

interface SimpleItem extends Record<string, unknown> {
  id: number;
  name: string;
  date: Date;
  category: string;
}

describe("FilterForm", () => {
  const columnHelper = createColumnHelper<SimpleItem>();

  const columns: Array<
    | AccessorKeyColumnDef<SimpleItem, string>
    | AccessorKeyColumnDef<SimpleItem, number>
    | AccessorKeyColumnDef<SimpleItem, Date>
  > = [
    columnHelper.accessor("id", {
      header: "ID",
      meta: { type: "number" },
    }) as AccessorKeyColumnDef<SimpleItem, number>,
    columnHelper.accessor("name", {
      header: "Name",
      meta: { type: "string" },
    }) as AccessorKeyColumnDef<SimpleItem, string>,
    columnHelper.accessor("category", {
      header: "Category",
      meta: { type: "category", values: ["A", "B", "C"] }, // Example of a category column
    }) as AccessorKeyColumnDef<SimpleItem, string>,
    columnHelper.accessor("date", {
      header: "Date",
      meta: { type: "date" }, // Example of a DateTime column
    }) as AccessorKeyColumnDef<SimpleItem, Date>,
  ];
  const filters = [
    { id: 1, parameter: "id", operator: "eq", value: "4" },
    { id: 2, parameter: "name", operator: "neq", value: "value2" },
  ];
  const setFilters = jest.fn();
  const handleFilterChange = jest.fn();
  const handleFilterMenuClose = jest.fn();

  it("renders the filter form with correct initial values", () => {
    render(
      <FilterForm<SimpleItem>
        columns={columns}
        filters={filters}
        setFilters={setFilters}
        handleFilterChange={handleFilterChange}
        handleFilterMenuClose={handleFilterMenuClose}
        selectedFilterId={undefined}
      />,
    );

    const columnSelect = screen.getByTestId("filter-form-select-parameter");
    const operatorSelect = screen.getByTestId("filter-form-select-operator");
    const valueInput = screen.getByLabelText("Value") as HTMLInputElement;

    expect(columnSelect).not.toHaveTextContent("ID");
    expect(operatorSelect).toHaveTextContent("equals to");
    expect(valueInput.value).not.toBe("value1");
  });

  it("renders the filter form with correct initial values when a filter is selected", () => {
    render(
      <FilterForm<SimpleItem>
        columns={columns}
        filters={filters}
        setFilters={setFilters}
        handleFilterChange={handleFilterChange}
        handleFilterMenuClose={handleFilterMenuClose}
        selectedFilterId={1}
      />,
    );

    const columnSelect = screen.getByTestId("filter-form-select-parameter");
    const operatorSelect = screen.getByTestId("filter-form-select-operator");
    const valueInput = screen.getByLabelText("Value") as HTMLInputElement;

    expect(columnSelect).toHaveTextContent("ID");
    expect(operatorSelect).toHaveTextContent("equals to");
    expect(valueInput.value).toBe("4");
  });

  it("updates the selected filter when fields are changed", () => {
    render(
      <FilterForm<SimpleItem>
        columns={columns}
        filters={filters}
        setFilters={setFilters}
        handleFilterChange={handleFilterChange}
        handleFilterMenuClose={handleFilterMenuClose}
        selectedFilterId={2}
      />,
    );

    const columnSelect = screen.getByTestId("filter-form-select-parameter");
    const operatorSelect = screen.getByTestId("filter-form-select-operator");
    const valueInput = screen.getByLabelText("Value") as HTMLInputElement;

    expect(columnSelect).toHaveTextContent("Name");
    expect(operatorSelect).toHaveTextContent("not equals to");
    expect(valueInput.value).toBe("value2");

    // Simulate a click event on the column Select element
    const columnButton = within(columnSelect).getByRole("combobox");
    fireEvent.mouseDown(columnButton);

    // Select the desired option from the dropdown list
    const columnOption = screen.getByText("ID");
    fireEvent.click(columnOption);

    // Simulate a click event on the operator Select element
    const operatorButton = within(operatorSelect).getByRole("combobox");
    fireEvent.mouseDown(operatorButton);

    // Select the desired option from the dropdown list
    const operatorOption = screen.getByText("is greater than");
    fireEvent.click(operatorOption);

    // Simulate a change event on the value input element
    fireEvent.change(valueInput, { target: { value: "5" } });

    expect(columnSelect).toHaveTextContent("ID");
    expect(operatorSelect).toHaveTextContent("is greater than");
    expect(valueInput.value).toBe("5");
  });

  it("calls setFilters when applyChanges is clicked with a new filter", () => {
    render(
      <FilterForm
        columns={columns}
        filters={filters}
        setFilters={setFilters}
        handleFilterChange={handleFilterChange}
        handleFilterMenuClose={handleFilterMenuClose}
        selectedFilterId={undefined}
      />,
    );

    const applyChangesButton = screen.getByLabelText("Finish editing filter");

    fireEvent.click(applyChangesButton);

    expect(setFilters).toHaveBeenCalledWith([
      ...filters,
      { id: expect.any(Number), parameter: "", operator: "eq", value: "" },
    ]);
    expect(handleFilterChange).not.toHaveBeenCalled();
    expect(handleFilterMenuClose).toHaveBeenCalled();
  });

  it("calls handleFilterChange when applyChanges is clicked with an existing filter", () => {
    render(
      <FilterForm
        columns={columns}
        filters={filters}
        setFilters={setFilters}
        handleFilterChange={handleFilterChange}
        handleFilterMenuClose={handleFilterMenuClose}
        selectedFilterId={1}
      />,
    );

    const applyChangesButton = screen.getByLabelText("Finish editing filter");

    // Simulate a click event on the column Select element
    const columnSelect = screen.getByTestId("filter-form-select-parameter");
    const columnButton = within(columnSelect).getByRole("combobox");
    fireEvent.mouseDown(columnButton);

    // Select the desired option from the dropdown list
    const columnOption = screen.getByText("Category");
    fireEvent.click(columnOption);

    fireEvent.click(applyChangesButton);

    expect(setFilters).toHaveBeenCalled();
    expect(handleFilterChange).toHaveBeenCalledWith(0, {
      id: 1,
      parameter: "category",
      operator: "eq",
      value: "",
    });
    expect(handleFilterMenuClose).toHaveBeenCalled();
  });

  it("renders the correct input for DateTime column type", () => {
    render(
      <FilterForm
        columns={columns}
        filters={filters}
        setFilters={setFilters}
        handleFilterChange={handleFilterChange}
        handleFilterMenuClose={handleFilterMenuClose}
        selectedFilterId={undefined}
      />,
    );

    const columnSelect = screen.getByTestId("filter-form-select-parameter");
    const columnButton = within(columnSelect).getByRole("combobox");
    fireEvent.mouseDown(columnButton);
    const columnOption = screen.getByText("Date");
    fireEvent.click(columnOption);

    const operatorSelect = screen.getByTestId("filter-form-select-operator");
    expect(operatorSelect).toHaveTextContent("in the last");

    const dateTimeInput = screen.getByLabelText("Value");

    expect(dateTimeInput).toHaveRole("combobox");

    // Simulate a click event on the operator Select element
    const operatorButton = within(operatorSelect).getByRole("combobox");
    fireEvent.mouseDown(operatorButton);

    // Select the desired option from the dropdown list
    const operatorOption = screen.getByText("is greater than");
    fireEvent.click(operatorOption);

    expect(screen.getByTestId("CalendarIcon")).toBeInTheDocument();
  });

  it("handles 'in' and 'not in' operators for category columns", () => {
    render(
      <FilterForm
        columns={columns}
        filters={filters}
        setFilters={setFilters}
        handleFilterChange={handleFilterChange}
        handleFilterMenuClose={handleFilterMenuClose}
        selectedFilterId={undefined}
      />,
    );

    const columnSelect = screen.getByTestId("filter-form-select-parameter");
    const columnButton = within(columnSelect).getByRole("combobox");
    fireEvent.mouseDown(columnButton);
    const columnOption = screen.getByText("Category");
    fireEvent.click(columnOption);

    const operatorSelect = screen.getByTestId("filter-form-select-operator");
    const operatorButton = within(operatorSelect).getByRole("combobox");
    fireEvent.mouseDown(operatorButton);
    const operatorOption = screen.getByText("is in");
    fireEvent.click(operatorOption);

    const valueSelect = screen.getByLabelText("Value");
    expect(valueSelect).toHaveRole("combobox");
    fireEvent.mouseDown(valueSelect);

    const valueOption1 = screen.getByText("A");
    fireEvent.click(valueOption1);
    const valueOption2 = screen.getByText("B");
    fireEvent.click(valueOption2);

    expect(valueSelect).toHaveTextContent("A, B");
  });
});
