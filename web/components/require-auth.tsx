"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { rememberRedirect } from "@/lib/redirect";
import { useApp } from "@/lib/store";
import { PageLoader } from "./ui";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, sessionUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!ready || sessionUser) return;
    const pathname = window.location.pathname;
    if (pathname !== "/assessment") rememberRedirect(pathname);
    router.replace("/login");
  }, [ready, sessionUser, router]);

  if (!ready || !sessionUser) return <PageLoader />;

  return <>{children}</>;
}
