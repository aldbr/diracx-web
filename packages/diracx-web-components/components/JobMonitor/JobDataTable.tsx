import React from "react";
import Box from "@mui/material/Box";
import {
  blue,
  orange,
  grey,
  green,
  red,
  lightBlue,
  purple,
  teal,
  blueGrey,
  lime,
  amber,
} from "@mui/material/colors";
import {
  Alert,
  AlertColor,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Backdrop,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import { useOidcAccessToken } from "@axa-fr/react-oidc";
import { Delete, Clear, Replay } from "@mui/icons-material";
import {
  createColumnHelper,
  ColumnPinningState,
  RowSelectionState,
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table";
import { useOIDCContext } from "../../hooks/oidcConfiguration";
import { DataTable, MenuItem } from "../shared/DataTable";
import { JobHistoryDialog } from "./JobHistoryDialog";
import {
  deleteJobs,
  getJobHistory,
  killJobs,
  refreshJobs,
  rescheduleJobs,
  useJobs,
} from "./JobDataService";
import { JobHistory } from "@/types/JobHistory";
import { Job, SearchBody } from "@/types";

const statusColors: { [key: string]: string } = {
  Submitting: purple[500],
  Received: blueGrey[500],
  Checking: teal[500],
  Staging: lightBlue[500],
  Waiting: amber[600],
  Matched: blue[300],
  Running: blue[900],
  Rescheduled: lime[700],
  Completing: orange[500],
  Completed: green[300],
  Done: green[500],
  Failed: red[500],
  Stalled: amber[900],
  Killed: red[900],
  Deleted: grey[500],
};

/**
 * Renders the status cell with colors
 */
const renderStatusCell = (status: unknown) => {
  if (typeof status !== "string") {
    return null; // or handle other types as needed
  }
  return (
    <Box
      sx={{
        display: "inline-block",
        borderRadius: "10px",
        padding: "3px 10px",
        backgroundColor: statusColors[status] || "default",
        color: "white",
        fontWeight: "bold",
      }}
    >
      {status}
    </Box>
  );
};

const columnHelper = createColumnHelper<Job>();

/**
 * The head cells for the data grid (desktop version)
 */
const columns = [
  columnHelper.accessor("JobID", {
    header: "ID",
    meta: { type: "number" },
  }),
  columnHelper.accessor("JobName", {
    header: "Name",
  }),
  columnHelper.accessor("Site", {
    header: "Site",
  }),
  columnHelper.accessor("Status", {
    header: "Status",
    cell: (info) => renderStatusCell(info.getValue()),
    meta: { type: "category", values: Object.keys(statusColors).sort() },
  }),
  columnHelper.accessor("MinorStatus", {
    header: "Minor Status",
  }),
  columnHelper.accessor("SubmissionTime", {
    header: "Submission Time",
    meta: { type: "date" },
  }),
];

/**
 * The data grid for the jobs
 */
export function JobDataTable() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [selected, setSelected] = React.useState<readonly number[]>([]);

  // Authentication
  const { configuration } = useOIDCContext();
  const { accessToken } = useOidcAccessToken(configuration?.scope);

  // State for loading elements
  const [backdropOpen, setBackdropOpen] = React.useState(false);
  const [snackbarInfo, setSnackbarInfo] = React.useState({
    open: false,
    message: "",
    severity: "success",
  });

  // States for table settings
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({
    left: ["JobID"], // Pin JobID column by default
  });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 25,
  });

  // State for search body
  const [searchBody, setSearchBody] = React.useState<SearchBody>({
    sort: [{ parameter: "JobID", direction: "asc" }],
  });
  // State for job history
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = React.useState(false);
  const [jobHistoryData, setJobHistoryData] = React.useState<JobHistory[]>([]);

  /**
   * Fetches the jobs from the /api/jobs/search endpoint
   */
  const { data, error, isLoading, isValidating } = useJobs(
    accessToken,
    searchBody,
    pagination.pageIndex,
    pagination.pageSize,
  );

  const dataHeader = data?.headers;
  const results = React.useMemo(() => data?.data || [], [data?.data]);

  // Parse the headers to get the first item, last item and number of items
  const contentRange = dataHeader?.get("content-range");
  let totalJobs = 0;

  if (contentRange) {
    const match = contentRange.match(/jobs (\d+)-(\d+)\/(\d+)/);
    if (match) {
      totalJobs = parseInt(match[3]);
    }
  } else if (results) {
    totalJobs = results.length;
  }

  const clearSelected = () => setSelected([]);

  /**
   * Handle the deletion of the selected jobs
   */
  const handleDelete = async (selectedIds: readonly number[]) => {
    setBackdropOpen(true);
    try {
      await deleteJobs(selectedIds, accessToken);
      setBackdropOpen(false);
      refreshJobs(
        accessToken,
        searchBody,
        pagination.pageIndex,
        pagination.pageSize,
      );
      clearSelected();
      setSnackbarInfo({
        open: true,
        message: "Deleted successfully",
        severity: "success",
      });
    } catch (error: unknown) {
      let errorMessage = "An unknown error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setSnackbarInfo({
        open: true,
        message: "Delete failed: " + errorMessage,
        severity: "error",
      });
    } finally {
      setBackdropOpen(false);
    }
  };

  /**
   * Handle the killing of the selected jobs
   */
  const handleKill = async (selectedIds: readonly number[]) => {
    setBackdropOpen(true);
    try {
      await killJobs(selectedIds, accessToken);
      setBackdropOpen(false);
      refreshJobs(
        accessToken,
        searchBody,
        pagination.pageIndex,
        pagination.pageSize,
      );
      clearSelected();
      setSnackbarInfo({
        open: true,
        message: "Killed successfully",
        severity: "success",
      });
    } catch (error: unknown) {
      let errorMessage = "An unknown error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setSnackbarInfo({
        open: true,
        message: "Kill failed: " + errorMessage,
        severity: "error",
      });
    } finally {
      setBackdropOpen(false);
    }
  };

  /**
   * Handle the rescheduling of the selected jobs
   */
  const handleReschedule = async (selectedIds: readonly number[]) => {
    setBackdropOpen(true);
    try {
      await rescheduleJobs(selectedIds, accessToken);
      setBackdropOpen(false);
      refreshJobs(
        accessToken,
        searchBody,
        pagination.pageIndex,
        pagination.pageSize,
      );
      clearSelected();
      setSnackbarInfo({
        open: true,
        message: "Rescheduled successfully",
        severity: "success",
      });
    } catch (error: unknown) {
      let errorMessage = "An unknown error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setSnackbarInfo({
        open: true,
        message: "Reschedule failed: " + errorMessage,
        severity: "error",
      });
    } finally {
      setBackdropOpen(false);
    }
  };

  /**
   * Handle the history of the selected job
   */
  const handleHistory = async (selectedId: number | null) => {
    if (!selectedId) return;
    setBackdropOpen(true);
    try {
      const { data } = await getJobHistory(selectedId, accessToken);
      setBackdropOpen(false);
      // Show the history
      setJobHistoryData(data[selectedId]);
      setIsHistoryDialogOpen(true);
    } catch (error: unknown) {
      let errorMessage = "An unknown error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setSnackbarInfo({
        open: true,
        message: "Fetching history failed: " + errorMessage,
        severity: "error",
      });
    } finally {
      setBackdropOpen(false);
    }
  };

  const handleHistoryClose = () => {
    setIsHistoryDialogOpen(false);
  };

  /**
   * The toolbar components for the data grid
   */
  const toolbarComponents = (
    <>
      <Tooltip title="Reschedule">
        <IconButton onClick={() => handleReschedule(selected)}>
          <Replay />
        </IconButton>
      </Tooltip>
      <Tooltip title="Kill">
        <IconButton onClick={() => handleKill(selected)}>
          <Clear />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton onClick={() => handleDelete(selected)}>
          <Delete />
        </IconButton>
      </Tooltip>
    </>
  );

  /**
   * The menu items
   */
  const menuItems: MenuItem[] = [
    { label: "Get history", onClick: (id: number | null) => handleHistory(id) },
  ];

  /**
   * Table instance
   */
  const table = useReactTable({
    data: results,
    columns,
    state: {
      columnVisibility,
      columnPinning,
      rowSelection,
      pagination,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    enablePinning: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    manualPagination: true,
  });

  /**
   * The main component
   */
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        overflow: "hidden",
      }}
    >
      <DataTable<Job>
        title="List of Jobs"
        table={table}
        totalRows={totalJobs}
        selected={selected}
        setSelected={setSelected}
        searchBody={searchBody}
        setSearchBody={setSearchBody}
        error={error}
        isLoading={isLoading}
        isValidating={isValidating}
        rowIdentifier="JobID"
        isMobile={isMobile}
        toolbarComponents={toolbarComponents}
        menuItems={menuItems}
      />
      <Snackbar
        open={snackbarInfo.open}
        autoHideDuration={6000}
        onClose={() => setSnackbarInfo((old) => ({ ...old, open: false }))}
      >
        <Alert
          onClose={() => setSnackbarInfo((old) => ({ ...old, open: false }))}
          severity={snackbarInfo.severity as AlertColor}
          sx={{ width: "100%" }}
        >
          {snackbarInfo.message}
        </Alert>
      </Snackbar>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={backdropOpen}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <JobHistoryDialog
        open={isHistoryDialogOpen}
        onClose={handleHistoryClose}
        historyData={jobHistoryData}
      />
    </Box>
  );
}
