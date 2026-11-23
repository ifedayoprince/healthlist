"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { McpConnectModal } from "@/components/mcp-connect-modal";
import { AuthShell, Button, PageLoader } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { ready, user, pendingAssessment } = useAuth();
  const router = useRouter();
  const [mcpOpen, setMcpOpen] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    if (user.role === "DOCTOR") {
      router.replace("/doctor");
      return;
    }
    router.replace(pendingAssessment ? "/assessment" : "/dashboard");
  }, [ready, user, pendingAssessment, router]);

  if (ready && user) return <PageLoader />;

  return (
    <>
      <AuthShell
        footer={
          <span>
            Are you a doctor?{" "}
            <Link
              href="/doctor"
              className="text-foreground underline decoration-[#c9cdcf] underline-offset-4 transition hover:text-brand"
            >
              Open the doctor console
            </Link>
          </span>
        }
      >
        <div className="flex flex-1 flex-col items-center justify-center pb-16">
          <div className="w-full max-w-[526px]">
            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push("/login")}
            >
              Continue
            </Button>
            <button
              type="button"
              onClick={() => setMcpOpen(true)}
              className="mt-8 block w-full text-center text-[17px] text-foreground transition hover:text-brand"
            >
              Connect to my assistant
            </button>
          </div>
        </div>
      </AuthShell>

      <McpConnectModal open={mcpOpen} onClose={() => setMcpOpen(false)} />
    </>
  );
}
