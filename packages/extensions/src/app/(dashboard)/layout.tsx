"use client";
import * as React from "react";
import { Box } from "@mui/material";
import {
  OIDCSecure,
  Dashboard,
} from "@dirac-grid/diracx-web-components/components";
import {
  ApplicationsProvider,
  DiracXWebProviders,
} from "@dirac-grid/diracx-web-components/contexts";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { applicationList } from "@/gubbins/applicationList";
import { defaultSections } from "@/gubbins/defaultSections";

// Layout for the dashboard: setup the providers and the dashboard for the applications
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the pathname, router and search params from the next/navigation package, needed for navigation and routing
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // A custom logo URL can be used for the dashboard
  const customLogoURL = "/robot.png";
  return (
    // DiracXWebProviders is the main provider for the DiracX Web components, you need to give it the pathname, router and search params
    <DiracXWebProviders
      getPath={() => pathname}
      setPath={router.push}
      getSearchParams={() => searchParams}
    >
      {/* ApplicationsProvider is the provider for the applications, you can give it customized application list or default sections to override them.
      No need to use it if you don't want to customize the applications */}
      <ApplicationsProvider
        appList={applicationList}
        defaultSections={defaultSections}
      >
        {/* OIDCSecure is used to make sure the user is authenticated before accessing the dashboard */}
        <OIDCSecure>
          {/* Dashboard is the main layout for the applications, you can optionally give it a custom logo URL and a drawer width */}
          <Dashboard logoURL={customLogoURL} drawerWidth={250}>
            <Box
              sx={{
                ml: "5%",
                mr: "5%",
              }}
            >
              {children}
            </Box>
          </Dashboard>
        </OIDCSecure>
      </ApplicationsProvider>
    </DiracXWebProviders>
  );
}