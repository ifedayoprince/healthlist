"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { rememberRedirect } from "@/lib/redirect";
import { PageLoader } from "./ui";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready || user) return;
    const pathname = window.location.pathname;
    if (pathname !== "/assessment") rememberRedirect(pathname);
    router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return <PageLoader />;

  return <>{children}</>;
}
