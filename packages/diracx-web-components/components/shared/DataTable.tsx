"use client";
import React from "react";
import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import { FormatListBulleted, Visibility } from "@mui/icons-material";
import {
  Alert,
  Menu,
  MenuItem,
  Popover,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
} from "@mui/material";
import { flexRender, Table as TanstackTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FilterToolbar } from "./FilterToolbar";
import { InternalFilter } from "@/types/Filter";
import { useSearchParamsUtils } from "@/hooks/searchParamsUtils";
import { ApplicationsContext } from "@/contexts/ApplicationsProvider";
import { DashboardGroup, SearchBody } from "@/types";
import { useMUITheme } from "@/hooks/theme";

/**
 * Menu item
 */
export interface MenuItem {
  label: string;
  onClick: (id: number | null) => void;
}

/**
 * Data table toolbar props
 * @property {string} title - the title of the table
 * @property {number} numSelected - the number of selected rows
 * @property {number[]} selectedIds - the ids of the selected rows
 * @property {function} clearSelected - the function to call when the selected rows are cleared
 */
interface DataTableToolbarProps<T extends Record<string, unknown>> {
  title: string;
  table: TanstackTable<T>;
  numSelected: number;
  selectedIds: readonly number[];
  toolbarComponents: JSX.Element;
}

/**
 * Data table toolbar component
 * @param {DataTableToolbarProps} props - the props for the component
 */
function DataTableToolbar<T extends Record<string, unknown>>(
  props: DataTableToolbarProps<T>,
) {
  const { title, table, numSelected, selectedIds, toolbarComponents } = props;
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleVisibilityClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  /**
   * Handle the copy of the selected IDs
   */
  const handleCopyIDs = () => {
    navigator.clipboard.writeText(JSON.stringify(selectedIds)).then(
      () => {
        setSnackbarOpen(true); // Open the snackbar on successful copy
      },
      (err) => {
        console.error("Could not copy text: ", err);
      },
    );
  };

  /**
   * Handle the filter menu
   */
  return (
    <Toolbar
      sx={{
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.secondary.main,
              theme.palette.action.activatedOpacity,
            ),
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography
          sx={{ flex: "1 1 100%" }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected} selected
        </Typography>
      ) : (
        <Typography
          sx={{ flex: "1 1 100%" }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          {title}
        </Typography>
      )}
      {numSelected > 0 ? (
        <Stack direction="row">
          <Tooltip title="Get IDs">
            <IconButton onClick={handleCopyIDs}>
              <FormatListBulleted />
            </IconButton>
          </Tooltip>
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={() => setSnackbarOpen(false)}
            message="IDs copied to clipboard"
          />
          {toolbarComponents}
        </Stack>
      ) : (
        <Box>
          <Toolbar>
            <IconButton onClick={handleVisibilityClick}>
              <Visibility />
            </IconButton>

            <Popover
              id={id}
              open={open}
              anchorEl={anchorEl}
              onClose={handlePopoverClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
            >
              <Box sx={{ p: 2 }}>
                <Stack direction="column" spacing={2}>
                  {table.getAllLeafColumns().map((column) => (
                    <Stack
                      key={column.id}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                    >
                      <Switch
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                      />
                      <Typography>{String(column.columnDef.header)}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Popover>
          </Toolbar>
        </Box>
      )}
    </Toolbar>
  );
}

/**
 * Data table props
 * @property {string} title - the title of the table
 * @property {number} page - the current page
 * @property {function} setPage - the function to call when the page changes
 * @property {number} rowsPerPage - the number of rows per page
 * @property {function} setRowsPerPage - the function to call when the rows per page change
 * @property {number[]} selected - the selected rows
 * @property {function} setSelected - the function to call when the selected rows change
 * @property {function} setSearchBody - the function to call when the search body changes
 * @property {AccessorKeyColumnDef[]} columns - the columns of the table
 * @property {T[]} rows - the rows of the table
 * @property {string | null} error - the error message
 * @property {string} rowIdentifier - the identifier for the rows
 * @property {boolean} isMobile - whether the table is displayed on a mobile device
 * @property {JSX.Element} toolbarComponents - the components to display in the toolbar
 * @property {MenuItem[]} menuItems - the menu items
 */
interface DataTableProps<T extends Record<string, unknown>> {
  /** The title of the table */
  title: string;
  /** The table */
  table: TanstackTable<T>;
  /** The total number of rows */
  totalRows: number;
  /** The selected rows */
  selected: readonly number[];
  /** The function to call when the selected rows change */
  setSelected: React.Dispatch<React.SetStateAction<readonly number[]>>;
  /** The search body to send along with the request */
  searchBody: SearchBody;
  /** The function to call when the search body changes */
  setSearchBody: React.Dispatch<React.SetStateAction<SearchBody>>;
  /** The error message */
  error: string | null;
  /** Whether the table is validating */
  isValidating: boolean;
  /** Whether the table is loading */
  isLoading: boolean;
  /** The identifier for the rows */
  rowIdentifier: keyof T;
  /** Whether the table is displayed on a mobile device */
  isMobile: boolean;
  /** The components to display in the toolbar */
  toolbarComponents: JSX.Element;
  /** The context menu items */
  menuItems: MenuItem[];
}

/**
 * Data table component
 *
 * @returns a DataTable component
 */
export function DataTable<T extends Record<string, unknown>>(
  props: DataTableProps<T>,
) {
  const {
    title,
    table,
    totalRows,
    selected,
    setSelected,
    searchBody,
    setSearchBody,
    error,
    isLoading,
    isValidating,
    rowIdentifier,
    isMobile,
    toolbarComponents,
    menuItems,
  } = props;
  const theme = useMUITheme();
  // State for the context menu
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number | null;
    mouseY: number | null;
    id: number | null;
  }>({ mouseX: null, mouseY: null, id: null });

  // State for the search parameters
  const { getParam, setParam } = useSearchParamsUtils();
  const appId = getParam("appId");

  // State for filters
  const [filters, setFilters] = React.useState<InternalFilter[]>([]);
  const [appliedFilters, setAppliedFilters] =
    React.useState<InternalFilter[]>(filters);

  const updateFiltersAndUrl = React.useCallback(
    (newFilters: InternalFilter[]) => {
      // Update the filters in the URL using the setParam function
      setParam(
        "filter",
        newFilters.map(
          (filter) =>
            `${filter.id}_${filter.parameter}_${filter.operator}_${filter.value}`,
        ),
      );
    },
    [setParam],
  );

  // State for the user dashboard
  const [userDashboard, setUserDashboard] =
    React.useContext(ApplicationsContext);
  const updateGroupFilters = React.useCallback(
    (newFilters: InternalFilter[]) => {
      const appId = getParam("appId");

      const group = userDashboard.find((group) =>
        group.items.some((item) => item.id === appId),
      );
      if (group) {
        const newGroup = {
          ...group,
          items: group.items.map((item) => {
            if (item.id === appId) {
              return { ...item, data: newFilters };
            }
            return item;
          }),
        };
        setUserDashboard((groups: DashboardGroup[]) =>
          groups.map((s) => (s.title === group.title ? newGroup : s)),
        );
      }
    },
    [getParam, userDashboard, setUserDashboard],
  );

  // Handle the application of filters
  const handleApplyFilters = () => {
    // Transform list of internal filters into filters
    const jsonFilters = filters.map((filter) => ({
      parameter: filter.parameter,
      operator: filter.operator,
      value: filter.value,
      values: filter.values,
    }));
    setSearchBody({ search: jsonFilters });
    table.setPageIndex(0);
    setAppliedFilters(filters);

    updateFiltersAndUrl(filters);
    updateGroupFilters(filters);
  };

  const handleRemoveAllFilters = React.useCallback(() => {
    setSearchBody({ search: [] });
    table.setPageIndex(0);
    setAppliedFilters([]);

    updateFiltersAndUrl([]);
    updateGroupFilters([]);
  }, [setFilters]);

  const DashboardItem = React.useMemo(
    () =>
      userDashboard
        .find((group) => group.items.some((item) => item.id === appId))
        ?.items.find((item) => item.id === appId),
    [appId, userDashboard],
  );

  React.useEffect(() => {
    if (DashboardItem?.data) {
      setFilters(DashboardItem.data);
      setAppliedFilters(DashboardItem.data);
      const jsonFilters = DashboardItem.data.map((filter: InternalFilter) => ({
        parameter: filter.parameter,
        operator: filter.operator,
        value: filter.value,
        values: filter.values,
      }));
      setSearchBody({ search: jsonFilters });
    } else {
      setFilters([]);
      setSearchBody({ search: [] });
    }
  }, [DashboardItem?.data, setFilters, setSearchBody]);

  // Manage sorting
  const handleRequestSort = (
    _event: React.MouseEvent<unknown>,
    property: string,
  ) => {
    const isAsc =
      searchBody.sort &&
      searchBody.sort[0]?.parameter === property &&
      searchBody.sort[0]?.direction === "asc";
    setSearchBody((prevState: SearchBody) => ({
      ...prevState,
      sort: [{ parameter: property, direction: isAsc ? "desc" : "asc" }],
    }));
  };

  // Manage selection
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = table
        .getRowModel()
        .rows.map((row) => row.getValue(String(rowIdentifier)) as number);
      setSelected(newSelected);
    } else {
      setSelected([]);
    }
  };

  const handleClick = (_event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: readonly number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  // Manage pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    table.setPageIndex(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    table.setPageSize(Number(event.target.value));
    table.setPageIndex(0);
  };

  const isSelected = (name: number) => selected.indexOf(name) !== -1;

  // Manage context menu
  const handleContextMenu = (event: React.MouseEvent, id: number) => {
    event.preventDefault(); // Prevent default context menu
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      id,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ mouseX: null, mouseY: null, id: null });
  };

  // Virtualizer
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 39,
    overscan: 5,
  });

  // Wait for the data to load
  if (isValidating || isLoading) {
    return (
      <>
        <FilterToolbar
          columns={table.getAllColumns()}
          filters={filters}
          setFilters={setFilters}
          appliedFilters={appliedFilters}
          handleApplyFilters={handleApplyFilters}
          handleClearFilters={handleRemoveAllFilters}
        />
        <Box sx={{ width: "100%", p: 1 }} data-testid="skeleton">
          <Skeleton
            variant="rectangular"
            animation="pulse"
            height={500}
            width="100%"
          />
        </Box>
      </>
    );
  }

  // Handle errors
  if (error) {
    return (
      <>
        <FilterToolbar
          columns={table.getAllColumns()}
          filters={filters}
          setFilters={setFilters}
          appliedFilters={appliedFilters}
          handleApplyFilters={handleApplyFilters}
          handleClearFilters={handleRemoveAllFilters}
        />
        <Box sx={{ width: "100%", marginTop: 2 }}>
          <Alert severity="error">
            An error occurred while fetching data. Reload the page.
          </Alert>
        </Box>
      </>
    );
  }

  const rows = table.getRowModel().rows;

  // Handle no data
  if (!rows || rows.length === 0) {
    return (
      <>
        <FilterToolbar
          columns={table.getAllColumns()}
          filters={filters}
          setFilters={setFilters}
          appliedFilters={appliedFilters}
          handleApplyFilters={handleApplyFilters}
          handleClearFilters={handleRemoveAllFilters}
        />
        <Box sx={{ width: "100%", marginTop: 2 }}>
          <Alert severity="info">
            No data or no results match your filters.
          </Alert>
        </Box>
      </>
    );
  }

  const checkboxWidth = 50;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        overflow: "hidden",
      }}
    >
      <FilterToolbar
        columns={table.getAllColumns()}
        filters={filters}
        setFilters={setFilters}
        appliedFilters={appliedFilters}
        handleApplyFilters={handleApplyFilters}
        handleClearFilters={handleRemoveAllFilters}
      />

      <Paper
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <DataTableToolbar
          title={title}
          table={table}
          numSelected={selected.length}
          selectedIds={selected}
          toolbarComponents={toolbarComponents}
        />
        <TableContainer
          sx={{ flexGrow: 1, overflow: "auto" }}
          ref={tableContainerRef}
        >
          <Table
            size="small"
            style={{ flexGrow: 1, width: "100%", minHeight: "100px" }}
          >
            <TableHead sx={{ position: "sticky", zIndex: 3, top: 0 }}>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  <TableCell
                    padding="checkbox"
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 2,
                      width: checkboxWidth,
                      backgroundColor: theme.palette.background.default,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Checkbox
                      indeterminate={
                        table.getIsSomeRowsSelected() &&
                        !table.getIsAllRowsSelected()
                      }
                      checked={table.getIsAllRowsSelected()}
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
                  {headerGroup.headers.map((header) => (
                    <TableCell
                      key={header.id}
                      style={{
                        position: header.column.getIsPinned()
                          ? "sticky"
                          : "relative",
                        left:
                          header.column.getIsPinned() === "left"
                            ? checkboxWidth
                            : undefined,
                        right:
                          header.column.getIsPinned() === "right"
                            ? 0
                            : undefined,
                        zIndex: header.column.getIsPinned() ? 2 : 1,
                        width: header.column.getSize(),
                        backgroundColor: theme.palette.background.default,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <TableSortLabel
                          active={
                            searchBody.sort &&
                            searchBody.sort[0]?.parameter === header.id
                          }
                          direction={
                            searchBody.sort &&
                            searchBody.sort[0]?.direction === "asc"
                              ? "asc"
                              : "desc"
                          }
                          onClick={(event) =>
                            handleRequestSort(event, header.id)
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </TableSortLabel>
                      )}
                      {header.column.getCanResize() && (
                        <Box
                          sx={{
                            position: "absolute",
                            right: "0%",
                            top: 0,
                            height: "100%",
                            width: "10px",
                            cursor: "col-resize",
                            userSelect: "none",
                            touchAction: "none",
                            zIndex: 3,
                          }}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                        />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>
            <TableBody>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = table.getRowModel().rows[virtualRow.index];
                return (
                  <TableRow
                    key={row.id}
                    onClick={(event) =>
                      handleClick(
                        event,
                        row.getValue(String(rowIdentifier)) as number,
                      )
                    }
                    style={{
                      cursor: "context-menu",
                    }}
                    onContextMenu={(event) =>
                      handleContextMenu(
                        event,
                        row.getValue(String(rowIdentifier)) as number,
                      )
                    }
                  >
                    <TableCell
                      padding="checkbox"
                      style={{
                        position: "sticky",
                        left: 0,
                        zIndex: 1,
                        width: checkboxWidth,
                        backgroundColor: theme.palette.background.default,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Checkbox
                        checked={isSelected(
                          row.getValue(String(rowIdentifier)) as number,
                        )}
                        onClick={(event) =>
                          handleClick(
                            event,
                            row.getValue(String(rowIdentifier)) as number,
                          )
                        }
                      />
                    </TableCell>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          position: cell.column.getIsPinned()
                            ? "sticky"
                            : "static",
                          left:
                            cell.column.getIsPinned() === "left"
                              ? checkboxWidth
                              : undefined,
                          right:
                            cell.column.getIsPinned() === "right"
                              ? 0
                              : undefined,
                          zIndex: cell.column.getIsPinned() ? 1 : 0,
                          width: cell.column.getSize(),
                          backgroundColor: cell.column.getIsPinned()
                            ? theme.palette.background.default
                            : undefined,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          rowsPerPageOptions={[25, 50, 100, 500, 1000]}
          count={totalRows}
          showFirstButton
          showLastButton
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={isMobile ? "" : "Rows per page"}
          sx={{ flexShrink: 0 }}
        />
      </Paper>
      <Menu
        open={contextMenu.mouseY !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu.mouseY !== null && contextMenu.mouseX !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {menuItems.map((menuItem, index: number) => (
          <MenuItem
            key={index}
            onClick={() => {
              handleCloseContextMenu();
              menuItem.onClick(contextMenu.id);
            }}
          >
            {menuItem.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
