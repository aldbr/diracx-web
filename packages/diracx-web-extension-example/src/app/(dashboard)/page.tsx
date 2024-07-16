"use client";
import React, { useEffect } from "react";
import { UserDashboard } from "@dirac-grid/test-lib/components";
import { ApplicationsContext } from "@dirac-grid/test-lib/contexts";
import { useSearchParamsUtils } from "@dirac-grid/test-lib/hooks";
import { applicationList } from "@/example-extension/applicationList";

export default function Page() {
  const { getParam, setParam } = useSearchParamsUtils();
  const appId = getParam("appId");

  useEffect(() => {
    if (!getParam("appId")) {
      setParam("appId", "Test App 1");
    }
  }, [getParam, setParam]);

  const [sections] = React.useContext(ApplicationsContext);

  const appType = React.useMemo(() => {
    const section = sections.find((section) =>
      section.items.some((item) => item.id === appId),
    );
    return section?.items.find((item) => item.id === appId)?.type;
  }, [sections, appId]);

  const Component = React.useMemo(() => {
    return applicationList.find((app) => app.name === appType)?.component;
  }, [appType]);

  return Component ? <Component /> : <UserDashboard />;
}
