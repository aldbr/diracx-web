"use client";
import { Box } from "@mui/material";
import { JobDataTable } from "./JobDataTable";
import ApplicationHeader from "@/components/shared/ApplicationHeader";

/**
 * Build the Job Monitor application
 *
 * @returns Job Monitor content
 */
export default function JobMonitor({
  headerSize,
}: {
  /**  The size of the header, optional */
  headerSize?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        overflow: "hidden",
      }}
    >
      <ApplicationHeader type="Job Monitor" size={headerSize} />
      <JobDataTable />
    </Box>
  );
}
