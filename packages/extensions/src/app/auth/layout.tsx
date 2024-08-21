"use client";
import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DiracXWebProviders } from "@dirac-grid/diracx-web-components/contexts";

// Layout for the authentication page: setup the navigation provider
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the pathname, router and search params from the next/navigation package, needed for navigation and routing
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  return (
    // DiracXWebProviders is the main provider for the DiracX Web components, you need to give it the pathname, router and search params
    <DiracXWebProviders
      getPath={() => pathname}
      setPath={router.push}
      getSearchParams={() => searchParams}
    >
      {children}
    </DiracXWebProviders>
  );
}
